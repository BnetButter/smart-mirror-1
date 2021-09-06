import React from "react";
import Component from "../component";
import ScrollBar from "./scroll-bar";
import "./scroll-frame.css"


class Interior extends React.Component
{
    render()
    {
        return (
            <div className="ViewPortInterior" ref={this.props.ref_} style={this.props.style}>
                {this.props.children}
            </div>
        );
    }
}


const ViewPort = new Component("ViewPort",
    class extends React.Component
    {
        constructor(props)
        {
            super(props);       
            this.__init__(props);
            this.state = {
                x_offset: 0,
                y_offset: 0,
                style: props.style ? props.style : {}
            };
            this.interior_ref = React.createRef();
        }

        update(pointers)
        {
            if (! (pointers.left.is_pinching || pointers.right.is_pinching))
                return this.initial_pos = null;
           
            let hand;
            if (this.is_inside(pointers.left.indexFinger, pointers.left.thumb))
                hand = pointers.left;
            else if (this.is_inside(pointers.right.indexFinger, pointers.right.thumb))
                hand = pointers.right;
            else
                return this.initial_pos = null;
            
            
            let state = {
                x_offset: this.state.x_offset,
                y_offset: this.state.y_offset,
            };

            switch (this.props.orient)
            {
                case ScrollFrame.BOTH:
                    state.x_offset = this.vscroll(hand);
                    state.y_offset = this.hscroll(hand);
                    break;
                
                case ScrollFrame.VERTICAL:
                    state.y_offset = this.vscroll(hand);
                    break;
                
                case ScrollFrame.HORIZONTAL:
                    state.x_offset = this.hscroll(hand);
                    break;
            }

            let y_offset_max, x_offset_max;
      
            y_offset_max = this.ref.current.offsetHeight
                - this.interior_ref.current.offsetHeight;
            x_offset_max = this.ref.current.offsetWidth
                - this.interior_ref.current.offsetWidth;

            /* Constrain interior offset so it can't disappear from this view port */
            state.y_offset = state.y_offset <= 0 ? state.y_offset : 0;
            state.x_offset = state.x_offset <= 0 ? state.x_offset : 0;
            state.y_offset = state.y_offset < y_offset_max ? y_offset_max: state.y_offset;
            state.x_offset = state.x_offset < x_offset_max ? x_offset_max: state.x_offset;

            
            this.setState(state);
            this.props.set(
                state.x_offset,
                state.y_offset,
                x_offset_max,
                y_offset_max,
                this.ref.current.offsetWidth,
                this.ref.current.offsetHeight
            );
        }

        hscroll(hand)
        {
            if (! this.initial_pos)
            {
                this.initial_pos = hand.thumb;
                return this.state.x_offset;
            }
            else
            {
                let res = this.state.x_offset + (hand.thumb[0] - this.initial_pos[0]);
                this.initial_pos = hand.thumb;
                return res;   
            }
        }

        vscroll(hand)
        {
            if (! this.initial_pos)
            {   
                this.initial_pos = hand.thumb;
                return this.state.y_offset;
            }
            else
            {
                let res = this.state.y_offset + (hand.thumb[1] - this.initial_pos[1]);
                this.initial_pos = hand.thumb;
                return res;
            }
        }

        render()
        {
            if (this.props.children instanceof Array || this.props.children === undefined)
                throw Error("ScrollFrame must have one child component");
            
            let child = React.cloneElement(this.props.children, {
                style: {
                    position: "relative",
                    top: this.state.y_offset,
                    left: this.state.x_offset,
                }
            });

            return (
                <div className="ViewPort" 
                        style={this.state.style}
                        ref={this.ref}>                    
                    <Interior ref_={this.interior_ref} style={{
                            top: this.state.y_offset,
                            left: this.state.x_offset,
                            }}>
                        {this.props.children}
                    </Interior>
                </div>
            )
        }
    }
);


class ScrollFrame extends React.Component
{
    constructor(props)
    {
        super(props);
        React.Component.check_props(props, "orient")

        this.data = {
            y_offset: 0,
            x_offset: 0,
            x_max: 0,
            y_max: 0,
            width: 0,
            height: 0,

            set(x, y, x_max, y_max, width, height)
            {
                this.x_offset = x;
                this.y_offset = y;
                this.x_max = x_max;
                this.y_max = y_max;
                this.width = width;
                this.height = height;
            },

            get()
            {
                return this;
            }            
        }

        this.set = this.data.set.bind(this.data);
        this.get = this.data.get.bind(this.data);
    }

    render()
    {
        return (
            <div>
                <div>
                    <ViewPort {...this.props} set={this.set}>
                        {this.props.children}
                    </ViewPort>
                    
                    <ScrollBar.VScrollBar orient={this.props.orient} get={this.get}/>
                </div>
                <ScrollBar.HScrollBar orient={this.props.orient} get={this.get}/>
            </div>
        );
    }

    static BOTH = 0;
    static VERTICAL = 1;
    static HORIZONTAL = 2;
}

export default ScrollFrame;