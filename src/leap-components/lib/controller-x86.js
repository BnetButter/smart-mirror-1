import Leap from "leapjs";
import root from "";
import Hand from "./hands";

const PARM = {
    normalize: (p) => p,
    xy_sensitivity: [2, 3],
    grab_radius: 30,
    point_threshold: 50,
    tickrate: 60,
};

const Controller = {
    pointers: {
        left: new Hand(),
        right: new Hand(),
        palm_distance: null,
        * [Symbol.iterator] ()
        {
            for (const hand of ["left", "right"])
                yield hand;
        },

        * tracking()
        {
            if (this.left.is_tracking)
                yield this.left;
            if (this.right.is_tracking)
                yield this.right;
        },
    },

    settings: {
        normalize: (p) => p,
        sensitivity: (h) => h,
        x_sens: 1,
        y_sens: 1,
        grab_radius: 30,
        point_threshold: 50,
    },

    get normalize() 
    {
        return this.settings.normalize;
    },

    start(scale, y_offset, width, height, x_sens, y_sens)
    {   
        
        let one_hand_normalize = normalizer(scale, y_offset, width, height);
        let two_hand_normalize = normalizer(1, 250, width, height);
        let sensitivity_fn = sensitivity(x_sens, y_sens);
        this.settings.sensitivity = sensitivity_fn;

        Leap.loop(null, (frame) => 
        {
            /* Two hands on screen so reduce sensitivity and scale */
            if (frame.hands[0] && frame.hands[1])
            {
                this.pointers.palm_distance = distance(
                    frame.hands[0].palmPosition,
                    frame.hands[1].palmPosition,
                    true
                );
                this.settings.x_sens = 1;
                this.settings.normalize = two_hand_normalize;
            }
            else // One hand on screen
            {
                this.pointers.palm_distance = null;
                this.settings.x_sens = 2;
                this.settings.normalize = one_hand_normalize;
            }
            this.pointers.left.is_tracking 
                = this.pointers.right.is_tracking = false;

            for (const hand of frame.hands)
                this.pointers[hand.type].process_frame(hand);
            /* Could update DOM here but this function is called ~120 hz.
                The interval may vary as well. */
        })
    },
}


function normalizer(scale, y_offset, width, height, y_sens)
{
    return (position) =>  [
        (width / 2) + (scale * position[0]),
        (y_offset * y_sens) + (height / 2) + (scale  * (-1 * position[1])),
        position[2],
    ]
}


function sensitivity(x_sens, y_sens)
{
    return function (hand) 
    {
        let res = {};
        let orig = {};
        let dy, dx;
    
        dx = (hand.palmPosition[0] * x_sens) - hand.palmPosition[0];
        dy = (hand.palmPosition[1] * y_sens) - hand.palmPosition[1];
        
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
}