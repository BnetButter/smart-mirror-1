import Leap from "leapjs";

console.nameOf = nameOf;
const FINGERS = ["thumb", "indexFinger", "middleFinger", "ringFinger", "pinky"];
const POINTERS = [
    "palm", "thumb", "indexFinger",
    "middleFinger", "ringFinger", "pinky"
];

const PARM = {
    normalize: (p) => p,
    xy_sensitivity: [2, 3],
    grab_radius: 30,
    point_threshold: 50,
    tickrate: 60,
};

const DATA = {};

function distance(p1, p2, xy_only=false)
{
    if (xy_only)
        return Math.sqrt(
            Math.pow(p1[0] - p2[0], 2)
            + Math.pow(p1[1] - p2[1], 2)
        )

    return Math.sqrt(
        Math.pow(p1[0] - p2[0], 2)
        + Math.pow(p1[1] - p2[1], 2)
        + Math.pow(p1[2] - p2[2], 2)
    )
}

function normalizer(scale, y_offset, width, height)
{
    return (position) =>  [
        (width / 2) + (scale * position[0]),
        (y_offset * PARM.xy_sensitivity[1]) + (height / 2) + (scale  * (-1 * position[1])),
        position[2],
    ]
}

function Graph(positions)
{
    this.palm = {};
    this.thumb = {};
    this.indexFinger = {};
    this.middleFinger = {};
    this.ringFinger = {};
    this.pinky = {};

    for (const p1 of POINTERS)
        for (const p2 of POINTERS)
        {
            if (p1 == p2)
                this[p1][p2] = this[p2][p1] = 0;
            else if (! this[p1][p2])
                this[p1][p2] = this[p2][p1] = distance(positions[p1], positions[p2]);
        }
}

function apply_sensitivity_multiplier(hand)
{

    let res = {};
    let orig = {};
    let dy, dx;

    dx = (hand.palmPosition[0] * PARM.xy_sensitivity[0]) - hand.palmPosition[0];
    dy = (hand.palmPosition[1] * PARM.xy_sensitivity[1]) - hand.palmPosition[1];
    
    res.palm = [
        hand.palmPosition[0] + dx,
        hand.palmPosition[1] + dy,
        hand.palmPosition[2],
    ]
    orig.palm = hand.palmPosition;


    for (const digit of FINGERS)
    {   
        if (! hand[digit])
            return []; 

        let pos = hand[digit].tipPosition;
        res[digit] = [
            pos[0] + dx,
            pos[1] + dy,
            pos[2],
        ]
        orig[digit] = pos;
    }
    return [res, orig];
}



class Clock
{
     
    constructor()
    {
        this.last = 0; 
    }

    update(timestamp)
    {
        if (! this.last)
        {
            this.last = timestamp
            return 0;
        }

        let res = timestamp - this.last;
        this.last = timestamp;
        return res;
    }
}


class FrameBuffer
{
    constructor(max=0)
    {
        this.max = max;
        this.length = 0;
    }

    put(data)
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

        if (this.length > this.max)
            this.get();
    }

    get()
    {
        if (! this.head)
            throw Error("Queue is empty");        
        this.length --;
        let node = this.head;
        this.head = this.head.next;
        return node.data;
    }

    clear()
    {
        this.head = this.tail = null;
        this.length = 0;
    }

    * [Symbol.iterator] () 
    {   
        let node = this.head;
        while (node)
        {
            yield node.data;
            node = node.next;
        }
    }
}

function vector_avg(...vectors)
{
    let accumulator = [0, 0, 0];
    for (const vec of vectors)
    {
        accumulator[0] += vec[0];
        accumulator[1] += vec[1];
        accumulator[2] += vec[2];
    }
    accumulator[0] /= vectors.length;
    accumulator[1] /= vectors.length;
    accumulator[2] /= vectors.length;
    return accumulator;
}

class Rotation extends Array
{
    constructor(...args)
    {
        super(...args)
        this.pitch = this[0];
        this.yaw = this[1];
        this.roll = this[2];
    }
};

class Future
{

}

class GestureLock
{

    constructor()
    {
        this.value = 0;
        this.acquire = this.acquire.bind(this);
        this.release = this.release.bind(this);
    }

    acquire()
    {

    }

    release()
    {

    }
}



const BUFFER = Symbol("buffer");
const FOCUS = Symbol("focus");
const TASK_MANAGER = Symbol("Task Manager");
const UPDATE = Symbol("Update task");
const default_pos = [0,0,0];

function Hand()
{
    return {
        palm: default_pos,
        thumb: default_pos,
        indexFinger: default_pos,
        middleFinger: default_pos,
        ringFinger: default_pos,
        pinky: default_pos,
        rotation: new Rotation(0, 0, 0),
        is_tracking: false,
        is_gripping: false,
        is_pointing: false,
        is_pinching: false,
        
        [BUFFER]: new FrameBuffer(10),
        [FOCUS]: {
            component: null,
            focus_in_callbacks: [],
            focus_out_callbacks: [],
        },

        raw: {
            palm: default_pos,
            thumb: default_pos,
            indexFinger: default_pos,
            middleFinger: default_pos,
            ringFinger: default_pos,
            pinky: default_pos,
            rotation: default_pos,
        },

        * [Symbol.iterator] ()
        {
            for (const p of POINTERS)
                yield this[p];
        },

        get_focus()
        {
            return this[FOCUS].component;
        },

        has_focus(component)
        {
            if (! component) {
                return this[FOCUS].component !== null;
            }
            if (! component[TASK_MANAGER].is_focus_target 
                    || ! component[TASK_MANAGER].enabled) {
                return false;
            }
            if (! this[FOCUS].component) {
                return false;
            }
            return this[FOCUS].component[TASK_MANAGER].sym === component[TASK_MANAGER].sym;
        },

        set_focus(component)
        {   
            if (this.has_focus(component)) {
                return;
            }
            else if (this.has_focus()) {
                this[FOCUS].focus_out_callbacks.forEach((on_unset) => on_unset());
                console.debug(`Focusing away from ${nameOf(this[FOCUS].component)}`);
            }

            this[FOCUS].component = component;
            this[FOCUS].focus_in_callbacks = component[TASK_MANAGER].focusin;
            this[FOCUS].focus_out_callbacks = component[TASK_MANAGER].focusout;
            this[FOCUS].focus_in_callbacks.forEach((on_set) => on_set());
            
            console.info(`Focusing on ${nameOf(this[FOCUS].component)}...`)
        },

        unset_focus(component=null)
        {   
    
            if (component && ! this.has_focus(component)) {
                console.debug("unset_focus: no-op");
                return;
            }
            if (this.has_focus(component)) {
                this[FOCUS].focus_out_callbacks.forEach((on_unset) => on_unset())
                console.info(`Focusing away from ${nameOf(this[FOCUS].component)}`);
            }
            this[FOCUS].focus_out_callbacks = EMPTY_SET;
            this[FOCUS].focus_in_callbacks = EMPTY_SET;
            this[FOCUS].component = null;
        },

        process_frame(frame)
        {
            let [res, original] = apply_sensitivity_multiplier(frame);
            if (res)
                this.is_tracking = true;
            else
            {
                this.is_tracking = false;
                this[BUFFER].clear();
                return;
            }
            
            let data = {};
            for (const pointer of POINTERS) {
                this.raw[pointer] = res[pointer]
                data[pointer] = this[pointer] = PARM.normalize(res[pointer]);
            }

            this.rotation = data.rotation = 
                new Rotation(frame.pitch(), frame.yaw(), -1 * frame.roll());
            this[BUFFER].put(data);
            let distance = this.distance = new Graph(original);
            
            this.is_gripping = 
                (distance.thumb.indexFinger
                + distance.indexFinger.middleFinger
                + distance.middleFinger.ringFinger
                + distance.ringFinger.pinky) / 4 < PARM.grab_radius;
        
            this.is_pointing = 
                distance.palm.indexFinger < PARM.point_threshold ? 
                    false :
                    distance.thumb.middleFinger < PARM.grab_radius;

            this.is_pinching = 
                distance.thumb.indexFinger < PARM.grab_radius
                && distance.palm.middleFinger > PARM.grab_radius;
        },

        smooth_input()
        {   
            if (! this.is_tracking || this[BUFFER].length < this[BUFFER].max)
                return
            else
            {
                let result = {
                    ... this,
                    palm: [],
                    thumb: [],
                    indexFinger: [],
                    middleFinger: [],
                    ringFinger: [],
                    pinky: [],
                    raw: {
                        palm: [],
                        thumb: [],
                        indexFinger: [],
                        middleFinger: [],
                        ringFinger: [],
                        pinky: [],
                    }
                };

                for (const data of this[BUFFER])
                {   
                    for (const pointer of POINTERS) {
                        result[pointer].push(data[pointer]);
                        
                    }
                }

                for (const pointer of POINTERS)
                    this[pointer] = vector_avg(...result[pointer]);
                
                return result;
            }
        },

        pinch_pos()
        {
            let [x1, y1, z1] = this.thumb;
            let [x2, y2, z2] = this.indexFinger;

            /* returns the middle of a line from thumb to indexFinger */
            return [(x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2];
        }
    }
}


const Controller = {
    Clock,
    
    hands: ["left", "right"],
    finger_sym: {
        thumb: "p",
        indexFinger: "i",
        middleFinger: "m",
        ringFinger: "a",
        pinky: "c",
    },
    positions: {
        left: new Hand(),
        right: new Hand(),
        palm_distance: null,
        * [Symbol.iterator] ()
        {
            for (const hand of ["left", "right"])
                yield hand;
        }
    },
    get normalize() 
    {
        return this.parm.normalize;
    },
    timestamp: 0,
    parm: PARM,
    tasks: new Set([set_focus]),

    components: {
        * [Symbol.iterator] ()
        {
            for (const id of Object.getOwnPropertySymbols(this))
            {
                if (id === Symbol.iterator)
                    continue;
                yield this[id];
            }
        }
    },
    globals: {},
    add_task(task, symbol)
    {
        if (symbol && this.components[symbol]) {
            this.components[symbol][TASK_MANAGER][UPDATE].add(task);
        }
        else {
            this.tasks.add(task)
        }
        return task;
    },
    
    remove_task(task, symbol)
    {      
        if (symbol && this.components[symbol]) {
            this.components[symbol][TASK_MANAGER][UPDATE].remove(task);
        }
        else {
            this.tasks.remove(task);
        }
        return task;
    },

    start(scale, y_offset, width, height)
    {   
        let one_hand_normalize = normalizer(scale, y_offset, width, height);
        let two_hand_normalize = normalizer(1, 250, width, height);

        Leap.loop(null, (frame) => 
        {

            this.timestamp = frame.timestamp;

            /* Two hands on screen so reduce sensitivity and scale */
            if (frame.hands[0] && frame.hands[1])
            {
                this.positions.palm_distance = distance(
                    frame.hands[0].palmPosition,
                    frame.hands[1].palmPosition,
                    true
                );
                this.parm.xy_sensitivity[0] = 1;
                this.parm.normalize = two_hand_normalize;
            }
            else // One hand on screen
            {
                this.positions.palm_distance = null;
                this.parm.xy_sensitivity[0] = 2;
                this.parm.normalize = one_hand_normalize;
            }
            this.positions.left.is_tracking = this.positions.right.is_tracking = false;
            for (const hand of frame.hands)
                this.positions[hand.type].process_frame(hand);
            
            /* Could update DOM here but this function is called ~120 hz.
                The interval may vary as well. */
        })
        new Promise(this.mainloop.bind(this));
    },

    /* Update all components at a constant rate (assuming we're not CPU bound) */
    async mainloop()
    {
        while (true)
        {
            this.positions.left.smooth_input();
            this.positions.right.smooth_input();
            for (const component of this.components) {
                if (component[TASK_MANAGER].enabled) {
                    for (const update of component[TASK_MANAGER][UPDATE]) {
                        update(this.positions, this.timestamp);
                    }
                }
            }
            for (const update of this.tasks) {
                update(this.positions, this.timestamp); 
            }
            await new Promise((r) => setTimeout(r, 17));
        }
    },

    /* Call to propagate task manager to children of top level widgets */
    identify(component)
    {
        return {
            value: component[TASK_MANAGER].sym,
        };
    },

    /* This function should only be called by Component instances with a valid reference to
    a TaskManager instance. It must be called by top level Widget */
    enableTasks(component, symbol, update)
    {   
        if (component[TASK_MANAGER])
        {
            if (! component[TASK_MANAGER].enabled) {
                component[TASK_MANAGER].enabled = true;
                return console.info(`TaskManager for '${nameOf(component)} enabled.'`);
            }
        }

        else if (! symbol) {
            throw TypeError(
                `Cannot call enableTasks for ${nameOf(component)}. `
                `Missing 'symbol' parameter.`
            );
        }

        let result;

        /* Block below should execute when Widget constructor has been called for the first time
            and when Widget component is "restored" */
        if (! this.components[symbol]) {
            this.components[symbol] = component;
            result = component[TASK_MANAGER] = new TaskManager(symbol);
            console.info(`Instanced TaskManager for ${nameOf(component)}`);
        }

        /* Block below should be executed if a Widget component child inherits
            the property from its parent */
        else if (this.components[symbol]) {
            result = component[TASK_MANAGER] = this.components[symbol][TASK_MANAGER];
            console.debug(`${nameOf(component)} component has inherited TaskManager`);
        }

        /* should never be called*/
        else {
            alert("Critical error in Controller.enableTasks");
        }

        if (update)
            Controller.tasks.add(update);
        return result;
    },

    disableTasks(component)
    {
        if (! component[TASK_MANAGER])
            throw Error(`Component ${nameOf(component)} is missing TaskManager instance`);
        if (component[TASK_MANAGER].enabled && ! component[TASK_MANAGER].is_shielded) {
            component[TASK_MANAGER].enabled = false;
            console.info(`Component ${nameOf(component)} disabled`)
        }
    },

    deleteTasks(component)
    {
        if (! component[TASK_MANAGER])
            throw Error(`Component ${nameOf(component)} is missing TaskManager instance`);
        delete this.components[component[TASK_MANAGER].sym];
    },

    /* Optional call by toplevel constructor. But Controller.enableTasks must be called first. */
    enableFocus(component)
    {   
        if (! component[TASK_MANAGER])
            throw Error(`Cannot call enableFocus for ${nameOf(component)}`
                `without prior call to enableTasks`)
        component[TASK_MANAGER].addEvent("focusin");
        component[TASK_MANAGER].addEvent("focusout");
        component[TASK_MANAGER].is_focus_target = true;
        console.info(`Focus enabled for component ${nameOf(component)}`)
    },

    disableFocus(component)
    {
        if (! component[TASK_MANAGER])
            throw Error(`Cannot call disableFocus for ${nameOf(component)}`
                `without prior call to enableTasks`)
        component[TASK_MANAGER].is_focus_target = false;
        console.info(`Focus disabled for component ${nameOf(component)}`)
    },

    shieldDisable(component)
    {
        component[TASK_MANAGER].is_shielded = true; 
    }

}

function set_focus(pointers)
{   
    for (const h of Controller.hands)
    {
        const hand = pointers[h];
        if (! hand.is_tracking)
            continue;
        
        const focus_candidates = [];
        for (const component of Controller.components)
        {
            if (component.is_inside(hand.palm) 
                    && component[TASK_MANAGER].is_focus_target
                    && component[TASK_MANAGER].enabled)
                focus_candidates.push(component);
        }
        
        let component;
        if (! (component = z_index_max(focus_candidates)))
        {
            hand.unset_focus();
            continue;
        }
        hand.set_focus(component);
    }
}


class TaskManager
{
    constructor(sym, ...propnames)
    {   
        this.enabled = true;
        this.sym = sym;
        
        if (! propnames.length && ! this[UPDATE]) {
            this[UPDATE] = new Set();
        }
        else {
            for (const prop of propnames)
                if (! (prop in this))
                    this[prop] = new Set();
        }

        this.addEventListener = (type, fn) =>
        {
            this[type].add(fn);
            return fn;
        };

        this.removeEventListener = (type, fn) => 
        {
            this[type].delete(fn);
            return fn;
        };
        
        this.addEvent = (type) =>
        {
            if (! this[type])
                this[type] = new Set()
            return this;
        };

        this.removeEvent = (type) =>
        {
            delete this[type];
            return this;
        };
    }
}

function nameOf(component)
{
    return component.name ?
        component.name :
        'instance of' + component.constructor.name;
}

function z_index_max(components)
{
    let max = null, max_z = 0;
    for (const component of components)
        if (component.state.style.zIndex >= max_z)
            max = component;
    return max;
}
const EMPTY_SET = new Set();

export default Controller;