import React from "react";
import Controller from "../../controller";
import Component from "../component";
import "./button.css"

const THRESHOLD = 50; // delta Z required to proc button command
const UNARMED_DURATION = 1000;
const DEFAULT_COMMAND = () => {console.log("Button proc'd")};

const Button = new Component("Button",
class extends React.Component
{
    constructor(props)
    {
        super(props);
        this.__init__(props);
        this.command = this.props.onClick ? this.props.onClick : DEFAULT_COMMAND;

        /* the border length parameter specifies how long the 'border' extends from each vertex. */
        this.border_length = this.props.borderLength ? this.props.borderLength: 10;
        this.border_width = this.props.borderWidth ? this.props.borderWidth : 2;

        /* d1, d2, d3 form the vertex borders. */
        this.state.d1 = {
            position: "absolute",
            background: "black",
        };
        this.state.d2 = {
            position: "absolute",
            background: "black",
        };
        this.state.d3 = {
            position: "absolute",
            background: "black",
        };


        this.initial_z_pos = null; // set when finger enters component
        this.armed = true;         // set to false when button is triggered
     
    }

    update(positions)
    {  
        let selector = null;
        for (let hand of Controller.hands)
        {
            if (this.is_inside(positions[hand].indexFinger) || this.is_inside(positions[hand].middleFinger))
                selector = hand;
        }

        /* armed variable prevents accidental double press. */
        if (! selector || ! this.armed)
        {
            this.on_normal();
            this.initial_z_pos = null; // unset initial_z_pos if pointer leaves component
            return;
        }


        /* Once the specified finger enters the component, we set the initial_z_pos.
        The button is proc'd when delta Z is above THRESHOLD */
        let hand = positions[selector];
        if (! this.initial_z_pos)
            this.initial_z_pos = hand.palm[2];
        else if (this.initial_z_pos - hand.palm[2] > THRESHOLD)
        {
            try 
            {
                console.debug("Clicked button")
                this.command(this);
            }
            catch (e) 
            {
                console.log(e);
            }
            
            /* Once proc'd, the button becomes unarmed. It cannot be pressed again until it is rearmed.
            While unarmed, A white border surrounds the button, indicating it has succesfully activated;
            */
            this.initial_z_pos = null;
            this.armed = false;
            this.on_proc();
            setTimeout(() => {this.armed = true; this.on_normal();}, UNARMED_DURATION);
        }
    }

    on_normal()
    {
        let height, width;
        let d1_state, d2_state, d3_state;

        height = this.ref.current.offsetHeight;
        width = this.ref.current.offsetWidth;
        d1_state = {
            width: width,
            height: height - (2 * this.border_length),
            left: 0,
            top: this.border_length,
            background: this.armed ? "black" : "white",
        };
        d2_state = {
            width: width - (2 * this.border_length),
            height: height,
            left: this.border_length,
            top: 0,
            background: this.armed ? "black" : "white"
        };
        d3_state = {
            width: width - (2 * this.border_width),
            height: height - (2 * this.border_width),
            top: this.border_width,
            left: this.border_width,
            background: "black",
        };

        this.setState({
            d1: {...this.state.d1, ...d1_state},
            d2: {...this.state.d2, ...d2_state},
            d3: {...this.state.d3, ...d3_state},

        });
    }

    componentDidMount()
    {
        this.on_normal();
    }

    on_proc()
    {
        let d1_state, d2_state;
        d1_state = {
            background: "white"
        };
        d2_state = {
            background: "white"
        };

        this.setState({
            d1: {...this.state.d1, ...d1_state},
            d2: {...this.state.d2, ...d2_state},
        });
        
    }

    render()
    {
        return (
                <div className="Button" style={this.state.style} ref={this.ref}>
                    <div style={this.state.d1} />
                    <div style={this.state.d2} />
                    <div style={this.state.d3}>
                        {this.props.children}
                    </div>
            </div>
        )
    }
});

export default Button;