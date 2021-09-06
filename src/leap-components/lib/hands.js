const FrameBuffer = require("./frame-buffer");

const NULL_HAND = {
    palm: default_pos,
    thumb: default_pos,
    indexFinger: default_pos,
    middleFinger: default_pos,
    ringFinger: default_pos,
    pinky: default_pos,
    is_tracking: false,
    is_gripping: false,
    is_pointing: false,
    is_pinching: false,

    rotation: new Rotation(0, 0, 0),
    raw: {
        palm: default_pos,
        thumb: default_pos,
        indexFinger: default_pos,
        middleFinger: default_pos,
        ringFinger: default_pos,
        pinky: default_pos,
        rotation: default_pos,
    },

    buffered_raw: {
        palm: default_pos,
        thumb: default_pos,
        indexFinger: default_pos,
        middleFinger: default_pos,
        ringFinger: default_pos,
        pinky: default_pos,
        rotation: default_pos,
    },
}

export default
function Hand({bufferlength})
{
    return {
        ... NULL_HAND,

        [BUFFER]: new FrameBuffer(bufferlength),

        * [Symbol.iterator] ()
        {
            for (const p of POINTERS)
                yield this[p];
        },

        process_frame(frame, sensitivity_fn, normalize_fn)
        {
            let [res, original] = sensitivity_fn(frame);
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
                data[pointer] = this[pointer] = normalize_fn(res[pointer]);
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
                let accumulator = {...NULL_HAND};
                for (const data of this[BUFFER]) {   
                    for (const pointer of POINTERS) {
                        accumulator[pointer].push(data[pointer]);
                    }
                }



                for (const pointer of POINTERS)
                    this[pointer] = vector_avg(...result[pointer]);
                
                return result;
            }
        },

        buffer(hand)
        {
            this[BUFFER].put(hand);
        },

        pinch_pos()
        {
            let [x1, y1, z1] = this.thumb;
            let [x2, y2, z2] = this.indexFinger;

            /* returns the middle of a line from thumb to indexFinger */
            return [(x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2];
        },

        accumulator()
        {   
            return {
                palm: default_pos,
                thumb: default_pos,
                indexFinger: default_pos,
                middleFinger: default_pos,
                ringFinger: default_pos,
                pinky: default_pos,
                is_tracking: false,
                is_gripping: false,
                is_pointing: false,
                is_pinching: false,
        
                rotation: new Rotation(0, 0, 0),
                raw: {
                    palm: default_pos,
                    thumb: default_pos,
                    indexFinger: default_pos,
                    middleFinger: default_pos,
                    ringFinger: default_pos,
                    pinky: default_pos,
                    rotation: default_pos,
                },
        
                buffered_raw: {
                    palm: default_pos,
                    thumb: default_pos,
                    indexFinger: default_pos,
                    middleFinger: default_pos,
                    ringFinger: default_pos,
                    pinky: default_pos,
                    rotation: default_pos,
                },
            };
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


const BUFFER = Symbol("buffer");
const default_pos = [0,0,0];