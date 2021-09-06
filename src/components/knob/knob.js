import React from "react"
import Component from "../component";
import "./knob.css";

const deg_to_rad = (deg) => deg * (Math.PI / 180);
const TRANSFORM = "translateX(-50%) translateY(-50%) "
const INTERIOR_STYLE = {
    position: "absolute",
    top: "50%",
    left: "50%",
}


const Knob = new Component("Knob",
    class extends React.Component
    {
        constructor(props)
        {  
            let axis = check_axis(props.axis ? props.axis : "roll");
            React.Component.check_props(props, ["radius"]);
            
            super(props);
            this.__init__(props);
            this.axis = axis;
            this.on_rotate = props.onChange ? props.onChange : () => {};
            this.scale = props.scale ? props.scale : 1;
            this.min = props.min ? deg_to_rad(props.min) : 0;
            this.max = props.max ? deg_to_rad(props.max) : 0;
            this.state.roll = props.value  ?
                (props.value / 100
                    * (this.max - this.min)
                    + this.min)
                : 0;
            
            this.state.style.borderRadius =
                this.state.style.width =
                this.state.style.height = props.radius * 2;
        }

        update(pointers)
        {
            let hand;
            for (const h of ["left", "right"])
            {
                if (! pointers[h].is_pinching)
                    continue;
                if (! this.is_inside(pointers[h].pinch_pos()))
                    continue;
                hand = pointers[h];
            }

            if (! hand)
                return this.initial_roll = null;
            
            if (! this.initial_roll)
                return this.initial_roll = hand.rotation[this.axis];

            if (this.props.variable && this.props.variable.get() !== this.get())
            {
                //  do something here? cant remember...
            }
            
            let roll, status;
            
            roll  = this.state.roll + this.scale * (hand.rotation[this.axis] - this.initial_roll);
            if (this.max !== this.min)
            {
                roll = roll >= this.min ? roll : this.min;
                roll = roll <= this.max ? roll : this.max;
            }

            this.initial_roll = hand.rotation[this.axis];
            this.setState({roll});

            status = this.get();
            this.on_rotate(status);
            if (this.props.variable)
                this.props.variable.set(status);
        }

        get()
        {
            if (this.props.label)
                return 0;
            if (this.max === this.min)
                return this.state.roll / (2 * Math.PI);

            return ((this.state.roll - this.min) / (this.max - this.min)) * 100;
        }

        set(value)
        {
            let roll;
            if (this.max === this.min)
                roll = value * (2 * Math.PI);
            else
                roll = value / 100 * (this.max - this.min) + this.min;
            
            this.setState({roll});
        }

        render()
        {
            return (
                <div className="Knob" 
                        style={{...this.state.style, transform: `rotate(${this.state.roll}rad)`}}
                        ref={this.ref}>
                    <div style={{...INTERIOR_STYLE, transform: TRANSFORM + `rotate(${-1 * this.state.roll}rad)`}}>
                        {this.props.children}
                    </div>
                </div>
            );
        }
    }
);

export default Knob;

const AXIS = ["pitch", "yaw", "roll", 0, 1, 2];
function check_axis(axis)
{
    if (! AXIS.includes(axis))
        throw Error(`Invalid axis property "${axis}". Property must be one of ['pitch', 'yaw', 'roll', 0, 1, 2]`)
    return axis;
}