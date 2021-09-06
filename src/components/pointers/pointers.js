import React from "react";
import "./pointers.css";
import left_pointing from "./left_pointing.png"
import right_pointing from "./right_pointing.png"
import left_open from "./left_open.png"
import right_open from "./right_open.png"
import left_gripping from "./left_gripping.png"
import right_gripping from "./right_gripping.png"
import left_pinching from "./left_pinching.png"
import right_pinching from "./right_pinching.png"
import Controller from "../../controller";

const IMAGES = {
    left: {
        open: left_open,
        gripping: left_gripping,
        pointing: left_pointing,
        pinching: left_pinching
    },
    right: {
        open: right_open,
        gripping: right_gripping,
        pointing: right_pointing,
        pinching: right_pinching
    }
}





class Pointer extends React.Component
{
    constructor(p)
    {
        super(p);
        this.state = {}
        Controller.add_task(this.loop_callback.bind(this));
    }

    loop_callback(positions)
    {
        let position;
        let style;

        style = {
            visibility: positions[this.props.type].is_tracking ? "visible" : "hidden",
            border: "2px solid grey"
        };

        if (this.props.digit)
            position = positions[this.props.type][this.props.digit];
        else
        {
            position = positions[this.props.type].palm;
            style.width = 40;
            style.height = 40;
            style.borderRadius = 40;
            style.transform = `rotate(${positions[this.props.type].rotation[2]}rad)`
        }
        style.left = position[0];
        style.top = position[1];
        this.setState({style:style})
    }

    render()
    {
        let text = this.props.type === "right" ? "RH" : "LH";
        if (this.props.digit) 
    
            return (<div className="Pointer" style={this.state.style}>
                {Controller.finger_sym[this.props.digit]}
            </div>)
        else 
        {   
            let positions;
            let img;
            let type;

            positions = Controller.positions;
            type = this.props.type
            if (positions[type].is_gripping)
                img = IMAGES[type].gripping;
            else if (positions[type].is_pinching)
                img = IMAGES[type].pinching;
            else if (positions[type].is_pointing)
                img = IMAGES[type].pointing;
            else
                img = IMAGES[type].open;

            return (
                <img className="Palm" style={this.state.style} src={img} />
            )
        }
    }
}

export default Pointer;