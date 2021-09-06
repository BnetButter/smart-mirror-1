import React from "react";
import "./widget.css"
import Controller from "../../controller";
import Component from "../component";
import Menu from "../menu/menu";

const THRESHOLD = -50;
const Widget = new Component("Widget",
class extends React.Component
{
    constructor(props)
    {   
        super(props);
        this.__init__(props);
        this.state.render_this = true;
        this.state.options = {};
        this.name = this.props.name ? 
            this.props.name :
            `Unidentified Widget (${Widget.all.length})`

        this.event = Controller.enableTasks(this, Symbol(this.name))
        if (this.props.isFocusTarget ? this.props.isFocusTarget : true)
            Controller.enableFocus(this);
        if (this.props.shieldDisable)
            Controller.shieldDisable(this);
 
        Widget.all.push(this);
        /* For xy translation */
        this.state.style.top = this.state.style.top ? this.state.style.top : 0;
        this.state.style.left = this.state.style.left ? this.state.style.left : 0;
        this.state.style.transform = this.scale = 1;
        /* z-index can change by pushing/pulling the widget 
            but not yet implemented
        */
        if (! this.state.style.zIndex)
            this.state.style.zIndex = Widget.all.length;
        

        this.event.addEventListener("focusin", this.onFocusIn.bind(this));
        this.event.addEventListener("focusout", this.onFocusOut.bind(this));
    }

    onFocusIn()
    {   
        Menu.clearOptions();
        Menu.setOptions(null, 
            {
                ringFinger: Menu.Options(
                    (
                        <div style={
                                {width:"100%", height: "100%", fontSize: 30}
                                }>
                             X
                        </div>
                    ),
                    () => this.destroy(),
                    "Remove this widget",
                ),
            })
        if (this.props.onFocusIn)
            this.props.onFocusIn(this);    
    }

    onFocusOut()
    {
        Menu.clearOptions();
        if (this.props.onFocusOut)
            this.props.onFocusOut(this);    
    }

    componentDidMount()
    {
        if (this.props.onMount)
            this.props.onMount(this);
    }

    render()
    {
        if (! this.state.render_this)
            return null;
        
        const children = React.Children.map(
            this.props.children,
            (child) => 
            { 
                return React.cloneElement(child, {
                        name: this.props.name ?
                            this.props.name :
                            `Unidentified Widget (${this.nth_widget})`,
                        symbol: Controller.identify(this)
                    }
                )
            }
        );
        return (
            <div className="Widget" ref={this.ref} style={{
                ...this.state.style,
                transform: `scale(${this.state.style.transform})`}}>
                {children}
            </div>
        );
    }

    center()
    {
        let width = this.ref.current.offsetWidth;
        let height = this.ref.current.offsetHeight;
        let root = document.getElementById("root");
        let root_width = root.offsetHeight;
        let root_height = root.offsetWidth;
        let x = (root_width / 2) - (width / 2);
        let y = (root_height / 2) - (height / 2);
        this.set_style({left: x, top: y});
    }

    componentWillUnmount()
    {
        Controller.deleteTasks(this);
        this.destroyed = true;
    }

    onopen()
    {   
    }

    onmessage(event)
    {   
        let data = JSON.parse(event.data);
        this.setState({
                style: data.body.settings,
                options: data.body.options,
            })
    }

    update(positions)
    {   
        if (! positions.left.is_tracking && ! positions.right.is_tracking)
            return this.set_style({border: "hidden"})
        this.move_on_grab(positions);
        this.scale_on_pinch(positions);
    }


    scale_on_pinch(positions)
    {
        if (! (positions.left.is_pinching && positions.right.is_pinching) 
                || ! (positions.left.has_focus(this) 
                        && positions.right.has_focus(this))
            )
        {
            this.initial_palm_distance = null;
            this.scale = this.state.style.transform;
            return;
        }
        if (! (this.is_inside(positions.left.indexFinger)
                && this.is_inside(positions.left.thumb)
                && this.is_inside(positions.right.indexFinger)
                && this.is_inside(positions.right.thumb)))
        {
            this.initial_palm_distance = null;
            this.scale = this.state.style.transform;
        }
        if (! this.initial_palm_distance)
            this.initial_palm_distance = positions.palm_distance;
        else
            this.set_style({transform: this.scale 
                + ((positions.palm_distance - this.initial_palm_distance) / 100)
            });
    }

    move_on_grab(positions)
    {
        let hand;
        if (hand=this.is_grabbed(positions))
        {
            if (! this.initial_palm_z_pos)
            {
                this.initial_palm_z_pos = positions[hand].palm[2];
                this.set_style({border: "2px dotted white"});
            }
            else if (this.initial_palm_z_pos - positions[hand].palm[2] < THRESHOLD)
            {
                if (! this.initial_palm_pos)
                {
                    this.set_style({border: "2px solid white"});
                    this.initial_palm_pos = positions[hand].palm;
                }
                else
                {
                    let curr_palm_pos;
                    let style;
                    let new_style;

                    curr_palm_pos = positions[hand].palm;
                    style = this.state.style;
                    new_style = {
                        left: style.left + (curr_palm_pos[0] - this.initial_palm_pos[0]),
                        top: style.top + (curr_palm_pos[1] - this.initial_palm_pos[1]),
                    }
                    
                    
                    this.set_style(new_style);
                    this.initial_palm_pos = [curr_palm_pos[0], curr_palm_pos[1]];
                }
            }
        }
        else
        {
            this.set_style({border: "hidden"});
            this.initial_palm_pos = null;
            this.initial_palm_z_pos = null;
        }
    }

    is_grabbed(positions)
    {
        let grabbed;
        for (const hand of ["left", "right"])
        {
            grabbed = true;
            if (! positions[hand].has_focus(this))
                grabbed = false;
            if (! this.is_inside(positions[hand].palm))
                grabbed = false;
            if (! positions[hand].is_gripping)
                grabbed = false;
            if (grabbed)
                return hand;
        }
        return grabbed;
    }

    destroy()
    {
        /*
            Controller.deleteTasks(this);
            this.setState({render_this: false});
                if (this.props.onDestroy)
                this.props.onDestroy();
        */
    }

    remove()
    {
        Controller.disableTasks(this);
    }

    add()
    {
        if (this.destroyed)
            throw Error(`Cannot revive dead component ${console.nameOf(this)}`)
        Controller.enableTasks(this);
    }

    static all = [];
    static ON_HOVER = {
        border: "2px dashed white"    
    };
});

export default Widget;