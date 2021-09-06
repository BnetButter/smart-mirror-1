import React from "react";
import EventLoop from "./eventloop";

export default {
    ref: React.createRef(),
    loop: new EventLoop({interval: 16, enforce_interval: true, label:"root"}),
    component: null,
    pointers: {
        left: {},
        right: {},
    },
    get element ()
    {
        return this.ref.current;
    },

    get height()
    {
        if (this.element)
            return this.element.offsetHeight;
        else
            return 0;
    },

    get width()
    {
        if (this.element)
            return this.element.offsetWidth;
        return 0;
    },
};