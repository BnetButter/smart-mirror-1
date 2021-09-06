import React from "react";
import "./scroll-bar.css"
import Component from "../component";

const ScrollKnob = new Component("ScrollKnob",
    class extends React.Component
    {
        constructor(props)
        {
            super(props);
            this.__init__(props);
            this.state.style.padding = props.size;
            if (props.orient === 1)
                this.state.style.left = -10;
            else if (props.orient === 2)
                this.state.style.top = -10;
        }

        update(pointers)
        {
        
            if (this.props.no_update)
                return;
            
            let {x_offset, y_offset, x_max, y_max, width, height} = this.props.get();    
            if (this.props.orient === 1 && y_max)
            {   
                height -= (2 * this.props.size);
                let ratio = (y_max + y_offset) / y_max;
                let top = height * ratio - height;
                this.set_style({top})

            }

            else if (this.orient == 2)
            {
                
            }
        }

        render()
        {
            return (
                <div className="ScrollKnob" style={this.state.style} />
            )
        }
    }
)

function VScrollBar(props)
{

    let style = {...props.style};
    if (props.orient === 2)
        style.display = "none";
    else
        style.display = "inline-block";

    return (
        <div className="VScrollBar"
                style={{
                    ...props.style,
                    display: props.orient === 2 ? "none": "inline-block"
                    }}
                >
            <ScrollKnob className="ScrollKnob" 
                    interior={props.interior} 
                    scrollcommand={props.scrollcommand}
                    orient={1}
                    get={props.get}
                    no_update={props.orient === 2}
                    size={7}
                />
        </div>
    );
}

function HScrollBar(props)
{   
    let style = {...props.style};
    if (props.orient === 1)
        style.display = "none";
    else
        style.display = "block";
    
    return (
        <div className="HScrollBar"
                style={{
                    ...props.style,
                    display: props.orient === 1 ? "none" : "block"
                }}>
            <ScrollKnob className="ScrollKnob" interior={props.interior}
                scrollcommand={props.scrollcommand}
                orient={2}
                get={props.get} 
                no_update={props.orient === 1}
                size={7}
                />
        </div>
    )
}

export default {
    VScrollBar,
    HScrollBar,
};