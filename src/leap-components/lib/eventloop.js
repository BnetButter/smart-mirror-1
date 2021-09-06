/* Low level event loop implementation and synchronization primitives 

EventLoop()
    start()
    stop()
    call_soon()
    call_after()

Lock
    acquire()
    release()
    locked()

Event
    wait()
    set()
    clear()
    is_set()

Condition
    acquire()
    release()
    locked()
    wait()
    wait_for()
    notify()
    notify_all()

Semaphore
    acquire()
    release()
    locked()
*/
"use strict"

const ID = Symbol();
const MAINLOOP = Symbol("MainLoop");
const EVENT_WAITING = Symbol();
const EVENT_FLAG = Symbol();
const EVENT_QUEUE =  Symbol();
const EVENT_UPDATE = Symbol();
const EVENT_ARMED = Symbol();

const MUTEX_ACQUIRED = Symbol();
const MUTEX_RELEASED = Symbol();
const MUTEX_FAILED_TO_ACQUIRE = Symbol();
const MUTEX_LOCKED = Symbol();
const MUTEX_QUEUE = Symbol();
const MUTEX_UPDATE = Symbol();




 
class Queue
{
    constructor()
    {
        this.length = 0;
    }

    enqueue(data)
    {
        let node = {data};
        if (! this.tail)
        {
            this.head = this.tail = node;
        }
        else
        {
            this.tail.next = node;
            this.tail = node;
        }
        this.length ++;
    }

    dequeue()
    {
        if (! this.head)
            throw Error("Queue is empty");        
        let node = this.head;
        this.head = this.head.next;
        this.length --;
        if (! this.length)
            this.tail = this.head = null;
        return node.data;
    }

    get()
    {
        return this.head.data;
    }

    * [Symbol.iterator] ()
    {
        let node = this.head;
        while (node) {
            yield node.data;
            node = node.next;
        }
    }
}

class EventLoop
{   
    constructor({parent, interval, enforce_interval, label})
    {   
        this.children = [];
        this.paused = false;
        this.is_running = false;
        this.is_root = false;
        if (parent) {
            this.parent = parent;
            this.parent.children.push(this);
        }
        else {
            this.is_root = true;
            this.call_soon_fn = [];
        }
        this.label = label ? this.label : "EventLoop";
        this.interval = interval;
        this.enforce_interval = enforce_interval;

        this.watchers = Object.create(watchers);
        this.waiters = Object.create(waiters);
        this.events = Object.create(events);
        this.mutex_tasks = Object.create(mutex_tasks);
        this.call_afters = Object.create(call_afters);
        this.loop_tasks = Object.create(loop_tasks);
        this.futures = new Queue;
    }

    start()
    {
        if (this.is_running && this.is_root)
            throw Error("Loop is already running");
        else if (! this.is_root)
            return this.paused = false;
        this.is_running = true;
        this.mainloop = create_cancellable_promise(this[MAINLOOP].bind(this));
    }

    stop(fn)
    {
        if (! this.is_running && this.is_root)
            throw Error("Loop already stopped");
        else if (! this.is_root) {
            this._onstop = fn;
            return this.paused = true;
        }
        this.is_running = false;
        this._onstop = fn;
        this.mainloop.cancel();
    }

    call_soon(fn)
    {
        let loop = this;
        while (! loop.is_root) {
            loop = loop.master;
        }
        loop.call_soon_fn.push(fn);
    }

    call_after(fn, delay)
    {
        let id = Symbol();
        this.call_afters[id] = {
            delay,
            fn,
            loop: this
        }
        return id;
    }

    cancel_call_after(id)
    {
        delete this.call_after[id];
    }

    loop_through(fn)
    {
        fn[ID] = Symbol();
        this.loop_tasks[fn[ID]] = fn;
        return fn;
    }

    create_watcher(variable)
    {
        return new EventLoop.Watcher(variable, this);
    }

    delete_watcher(watcher)
    {
        let id = watcher[ID];
        if (! this.watchers[id])
            throw Error("Watcher not found");
        delete this.watchers[watcher[ID]];
    }

    start_waiting(predicate, on_complete)
    {   
        let id = Symbol();
        this.waiters[id] = [predicate, on_complete, id];
        return id;
    }

    stop_watching(id)
    {
        delete this.watchers[id];
    }

    stop_waiting(id)
    {
        delete this.waiters[id];
    }

    create_mutex()
    {
        return new EventLoop.Mutex(this);
    }

    delete_mutex(mut)
    {
        delete this.mutex_tasks[mut[ID]];
    }

    add_mutex_task(mut, fn)
    {
        this.mutex_tasks[mut[ID]][MUTEX_QUEUE].enqueue(fn);
    }

    update()
    {   

        this.loop_tasks.update();
        this.waiters.update();
        this.watchers.update();
        this.mutex_tasks.update();
        this.events.update();
        this.call_afters.update();
        for (const child of this.children) {
            child.update();
        }
    }

    async [MAINLOOP] (resolve, error)
    {
        while (this.is_running) {
            let start, end;
            
            start = (new Date()).getTime();
            this.update();
            end = (new Date()).getTime();
            if ((end - start) > this.interval) {
                if (this.enforce_interval) {
                    throw Error( 
                        `EventLoop: Execution of ${this.label} `
                        `exceeded interval ${this.interval} ms`
                    );
                }
                else {
                    console.warn(
                        `EventLoop: Execution of ${this.label} `
                        `exceeded interval ${this.interval} ms `
                    );
                    this.interval *= 2;
                }
            }
            await new Promise((r) => setTimeout(r, this.interval - (start-end))); 
            for (const task of this.call_soon_fn) {
                task();
            }
            this.call_soon_fn = [];
        }
    }
}


const loop_tasks = {
    update()
    {   
        for (const sym of Object.getOwnPropertySymbols(this))
            this[sym]();
    }
};



const mutex_tasks = {
    update()
    {
        for (const sym of Object.getOwnPropertySymbols(this)) {
            this[sym][MUTEX_UPDATE]();
        }
    }
}

const call_afters = {
    update()
    {
        for (const sym of Object.getOwnPropertySymbols(this)) {
            let {delay, fn, loop} = this[sym];
            if (delay <= 0) {
                fn();
                delete this[sym];
            }
            else {
                this[sym].delay -= loop.interval;
            }
        }
    }
};

const watchers = {
    update()
    {
        for (const sym of Object.getOwnPropertySymbols(this))
        {
            let {last, variable, fn} = this[sym];
            if ((this[sym].last = variable.get()) !== last) {
                for (const task of fn)
                    task({last, current: this[sym].last});
            }
        }
    }
};

const waiters = {
    update()
    {
        for (const sym of Object.getOwnPropertySymbols(this)) {
            let [pred, fn, id] = this[sym]
            if (pred()) {
                fn();
                delete this[id];
            }
        }
    }
}
const events = {
    update()
    {
        for (const sym of Object.getOwnPropertySymbols(this)) {
            this[sym][EVENT_UPDATE]();
        }
    }
};

EventLoop.Watcher = class
{
    
    constructor (variable, loop)
    {   
        this[ID] = Symbol();
        this.last = variable.get();
        this.variable = variable;
        this.fn = new Set();
        if (loop) {
            this.loop = loop;
            loop.watchers[this[ID]] = this;
        }
    }

    addEventListener(fn)
    {
        this.fn.add(fn);
    }

    removeEventListener(fn)
    {
        this.fn.remove(fn);
    }
}

EventLoop.ContextManager = class
{

    constructor({loop, enter, exit})
    {
    
        if (loop) {
            loop.context_managers[this[ID]] = this;
            this.loop = loop;
        }
        this[ID] = Symbol();
        this.enter = enter;
        this.exit = exit;
    }
}

EventLoop.Mutex = class
{
            /* Usage
        ----------
    
        function * fn(mutex)
        {
            yield mutex.acquire();
            try {
                // do thing
            }
            catch () {
                
            }
            finally () {
                yield mutex.release()
            }
        } */

        constructor(loop)
        {
            if (loop) {
                loop.mutex_tasks[this[ID]] = this;
                this.loop = loop;
            }
            this[ID] = Symbol();
            this[MUTEX_LOCKED] = false;
            this[MUTEX_QUEUE] = new Queue();
        }

        [MUTEX_UPDATE] () {
            let queue = this[MUTEX_QUEUE];
            while (queue.length) {
                const generator = queue.get();
                let {value, done} = generator.next();
                if (value === MUTEX_FAILED_TO_ACQUIRE) {
                    queue.enqueue(queue.dequeue());
                    continue;
                }
                else if (value === MUTEX_ACQUIRED) {
                    continue;
                }
                else if (value === MUTEX_RELEASED) {
                    generator.next();
                    queue.enqueue(queue.dequeue());
                }
                else if (done) {
                    queue.dequeue();
                }
            }
        }
    
        acquire()
        {   
            if (! this[MUTEX_LOCKED]) {
                this[MUTEX_LOCKED] = true;
                return MUTEX_ACQUIRED;
            }
            throw Error("Cannot acquire locked mutex");
        }
    
        release()
        {
            this[MUTEX_LOCKED] = false;
            return MUTEX_RELEASED;
        }

        locked()
        {
            return this[MUTEX_LOCKED];
        }
}

EventLoop.Event = class 
{


    constructor(loop)
    {
        if (loop) { 
            loop.events[this[ID]] = this;
            this.loop = loop;
        }
        this[ID] = Symbol();
        this[EVENT_QUEUE] = new Queue();
        this[EVENT_FLAG] = false;
        this[EVENT_ARMED] = [];
    }

    addEvent(fn)
    {
        this[EVENT_QUEUE].enqueue(fn)
    }

    addEventListener(fn)
    {
        
        this[EVENT_QUEUE].enqueue(
            (function * (thisarg)
            {
                yield thisarg.wait();
                return fn();
            })(this)
        );
    }

    set()
    {
        this[EVENT_FLAG] = true;
        for (const task of this[EVENT_ARMED]) {
            task.next();
        }
        this[EVENT_ARMED] = [];
    }

    clear()
    {
        this[EVENT_FLAG] = false;
    }

    wait()
    {
        if (! this[EVENT_FLAG])
            return EVENT_WAITING;
        else
            return EVENT_ARMED;
    }

    [EVENT_UPDATE] () 
    {
        let queue = this[EVENT_QUEUE]
        while (queue.length) {
            const generator = queue.dequeue()
            let {done, value} = generator.next();
            if (done) {
                return
            }
            else if (value === EVENT_ARMED) {
                queue.enqueue(generator);
            }
            else if (value === EVENT_WAITING) {
                this[EVENT_ARMED].push(generator);
            }
            else {
                throw Error("Waiting functions must yield only once");
            }
        }
    }
}



EventLoop.Semaphore = class
{
   
}

EventLoop.Condition = class
{

    constructor(loop, lock=null)
    {
        this.loop = loop;
        if (lock) {
            this.lock = lock;
        }
        else {
            this.lock = loop.create_mutex()
        }


    }

    acquire()
    {
        return this.lock.acquire();
    }
    
    release()
    {
       return this.lock.release();
    }

    locked()
    {
        return this.lock.locked();
    }

    notify(n=1)
    {
        
    }

    notify_all()
    {

    }

    wait()
    {

    }

    wait_for()
    {

    }
}

EventLoop.Eventf = class 
{
    constructor(loop)
    {
        this.loop = loop
        this.flag = false;
        this.waiter = loop.ensure_future();
        
    }

    set()
    {
        this.waiter.set_done();
        this.waiter = this.loop.ensure_future();
    }

    clear()
    {
        this.waiter.set_pending();
    }

    wait()
    {
        return this.waiter;    
    }
}




function create_cancellable_promise(task)
{
    let reject_fn;
    let wraps = new Promise((res, err) => 
    {
        reject_fn = err;
        Promise.resolve(new Promise(task))
            .then(res)
            .catch(err);
    });
    wraps.cancel = () => {reject_fn({canceled:true})};
    return wraps;
}

module.exports = EventLoop;




