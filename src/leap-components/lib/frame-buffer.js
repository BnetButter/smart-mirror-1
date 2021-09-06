module.exports = 
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