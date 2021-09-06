import React from "react";
import root from "../lib/app-root";
import Pointers from "../components/component";

import "./style-sheets/mirror.css";

export default
class Mirror extends React.Component
{
    constructor(props)
    {
        super(props);
        root.component = this;
    }

    render()
    {
        return (
            <div id="Mirror" ref={root.ref}>
                <div id="tool-container">
                    <Pointers />
                </div>
                <div id="widget-container">
                    {this.props.children}
                </div>
            </div>
        )
    }
}