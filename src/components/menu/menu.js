import React from "react";
import Component from "../component";
import Controller from "../../controller";
import Variable from "../../variable";
import "./menu.css";

export default function Menu(props)
{
    React.Component.check_props(props, ["distance"]);
    const left = props.left ? radianOf(props.left) : radianOf(35);
    const right = props.right ? radianOf(props.right): radianOf(35);
    const clickAfter = props.clickAfter ? props.clickAfter * 1000 : 1000;
    return (
        <div id="Menu">
            <HandMenu {...props} hand="left" threshold={(r) => r < left} clickAfter={clickAfter} />
            <HandMenu {...props} hand="right" threshold={(r) => r < right} clickAfter={clickAfter} />
        </div>
    )
}

Menu.Options = function (childElement, onClick, textDescription)
{
    return {
        childElement,
        onClick,
        textDescription,
    }
}

Menu.setOptions = function (hand, options) 
{
    for (const opt in options)
        if (! options[opt] instanceof Menu.Options)
            throw Error("Options value must be an instance of Menu.Options.");
    if (hand)
        Controller.globals.menu[hand].set(options);
    else {
        Controller.globals.menu.left.set(options);
        Controller.globals.menu.right.set(options);
    }
}

Menu.clearOptions = function(hand)
{
    if (hand)
        Controller.globals.menu[hand].clear();
    else {
        Controller.globals.menu.left.clear();
        Controller.globals.menu.right.clear();
    }
}

class Options {
    thumb = new Menu.Options
    indexFinger = new Menu.Options
    middleFinger = new Menu.Options
    ringFinger = new Menu.Options
    pinky = new Menu.Options

    set(options)
    {
        for (const digit in this) {
            if (options[digit])
                this[digit] = options[digit];
        }
    }

    clear()
    {
        for (const digit in this) {
            this[digit] = new Menu.Options;
        }
    }
}

Controller.globals.menu = {
    left: new Options,
    right: new Options,
}

const HandMenu = new Component("HandMenu",
class extends React.Component 
{
    constructor(props)
    {
        super(props);
        this.__init__(props);
        this.name = props.hand + "Menu";


        this.activebutton = null;
        this.buttonstate = {
            enable: (component) => 
            {
                if (! this.activebutton) {
                    this.activebutton = component.props.digit;
                    component.set_style({visibility: "visible"});
                }
                return (! this.activebutton 
                    || component.props.digit === this.activebutton
                );
            },
            disable: (component) =>
            {
                if (component.props.digit === this.activebutton) {
                    this.activebutton = component.props.digit;
                    component.set_style({visibility: "hidden"});
                }
            },
            visibility: new Variable(false),
            current: new Variable()
        }
    }

    update(pointers)
    {
        let hand = pointers[this.props.hand];        
    
        if (! hand.is_tracking || this.props.threshold(hand.rotation.pitch)) {
            // Palm is down
            this.buttonstate.visibility.set(false);
            this.buttonstate.current.set(null);
        }
        else {
            this.buttonstate.visibility.set(true);
        }
    }

    render()
    {
        return (
            <div className="HandMenu" style={this.state.style} ref={this.ref}>
                <MenuButton {...this.props} digit="thumb" buttonstate={this.buttonstate} />
                <MenuButton {...this.props} digit="indexFinger" buttonstate={this.buttonstate} />
                <MenuButton {...this.props} digit="middleFinger" buttonstate={this.buttonstate} />
                <MenuButton {...this.props} digit="ringFinger"  buttonstate={this.buttonstate} />
                <MenuButton {...this.props} digit="pinky" buttonstate={this.buttonstate} />
            </div>
        )
    }
})


function Future(task)
{
    let reject_fn;
    let wraps = new Promise((res, err) => 
    {
        reject_fn = err;
        Promise.resolve(new Promise(task))
            .then(res)
            .catch(err);
    });
    wraps.cancel = () => {reject_fn({canceled:true})};
    return wraps;
}

const MenuButton =
new Component("MenuButton", class extends React.Component
{
    constructor(props)
    {
        super(props);
        this.__init__(props);
        this.distance = props.distance;
        this.state.style.left = 0;
        this.state.style.right = 0;
        this.visibility = props.buttonstate.visibility;
        this.current = props.buttonstate.current;
        this.task = null;
        this.state.interior = {
            width: 30,
            height: 30,
        }
    }

    is_below(pos)
    {
        if (! this.ref.current)
            return false;
        
        let rect = this.ref.current.getBoundingClientRect();
        return pos > rect.bottom;
    }

    button_location(pointers)
    {
        let raw_palm = pointers[this.props.hand].raw.palm;
        let raw_digit = pointers[this.props.hand].raw[this.props.digit];
        raw_digit[1] = raw_palm[1] - this.y_offset;
        return Controller.normalize(raw_digit);
    }

    on_click()
    {
        
        let future = this.task = new Future((r) => setTimeout(r, this.props.clickAfter))
        future.then(() => 
        {
            console.debug(`Button pressed at ${this.props.hand}.${this.props.digit}`)
            let fn;
            if (fn=Controller.globals.menu[this.props.hand][this.props.digit].onClick) {
                fn();
            }
            this.task = null;
        }).catch(() =>
        {
            console.debug(`Button cancelled at ${this.props.hand}.${this.props.digit}`);
            this.task=null;
        });
    }

    update(pointers, timestamp)
    {

        let visibility = this.visibility.get();
        let current = this.current.get();
    

        if (! pointers[this.props.hand].is_tracking || ! visibility) {
            this.y_offset = null;
            return this.set_style({visibility: "hidden"});
        }
        // places button at [distance] below finger tip then button is slaved to palm
        else if (! this.y_offset) {
            let digit_y = pointers[this.props.hand].raw[this.props.digit][1];
            let palm_y = pointers[this.props.hand].raw.palm[1];
            this.y_offset = palm_y - (digit_y - this.distance);
        }
        
        let pointer_y = pointers[this.props.hand][this.props.digit][1];
        let [x, y] = this.button_location(pointers);
        this.set_style({left: x, top: y, visibility: "visible"});
        if (! current || current === this) {
            if (this.is_below(pointer_y)) {
                this.current.set(this);
                this.wait = timestamp;
                this.set_style({left: x, top: y, visibility: "visible"});
                if (! this.task)
                    this.on_click();
                this.setState({interior: {width:50, height:50}});
                    
            }
            else {
                this.current.set(null);
                if (this.task) {
                    this.task.cancel();
                    this.setState({interior: {width:30, height:30}})

                }
            }
        }
        else {
            this.set_style({visibility: "hidden"})
            if (current === this) {
                this.current.set(null);
                if (this.task) {
                    this.task.cancel();
                    this.setState({interior: {width:30, height:30}})
                }
            }
        }
    }

    render()
    {
        let {childElement} = Controller.globals.menu[this.props.hand][this.props.digit];
        let child, style = {...this.state.style};
        if (childElement) {
            child = (
                <div style={this.state.interior}>
                    {childElement}
                </div>
            );
            style.border = "2px solid transparent"
        }
        return (<div className="MenuButton" style={style} ref={this.ref} >
                    {child}
                </div>)
    }
});

class ButtonInteriorWrapper extends React.Component
{
    constructor(props)
    {
        super(props)
        this.state.style = {
            
        }
    }
}

const radianOf = (deg) => deg * (Math.PI / 180);