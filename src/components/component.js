/* Mixin class for interactive React Components */

import React from "react";
import Controller from "../controller";

const HOST = "localhost";
const PORT = 4000;

class Component
{
    constructor(name, cls)
    {
        Object.defineProperty(cls, "name", {value: name})
        let keys = Object.keys(cls.prototype);
        for (const attr of Object.getOwnPropertyNames(new.target))
            if (! (attr in keys))
                cls.prototype[attr] = new.target[attr];
        return cls;
    }

    static __init__(props)
    {
        this.state = {
            style: props.style ? props.style : {}
        }
        this.ref = React.createRef();

        if (typeof(this.update) === "function") {
            this.update = Controller.add_task(this.update.bind(this), props.symbol ? props.symbol.value : null);
        }
        if (props.symbol) {
            Controller.enableTasks(this, props.symbol.value)
        }
    }

    static set_style(style)
    {
        this.setState({style: {...this.state.style, ... style}});
    }

    static is_inside(...positions)
    {
        if (! this.ref.current)
            return false;
        
        let rect = this.ref.current.getBoundingClientRect();
        for (const pos of positions)
        {
            if (! (rect.left < pos[0] && pos[0] < rect.right
                && rect.top < pos[1] && pos[1] < rect.bottom))
            return false;
        }
        return true;
    }

    // export mixin methods
    static __all__ = [
        "__init__",
        "set_style",
        "is_inside",
    ]
}

export default Component;

