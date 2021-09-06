import React from "react";
import root from "../lib/app-root";
import "./style-sheets/pointers.css";

export default
function Pointers(props)
{
    return (
        <div>
            <Hand hand="left" />
            <Hand hand="right" />
        </div>
    );
}

function Hand(props)
{
    return (
        <div>
            <Pointer {...props} pointer="palm" />
            <Pointer {...props} pointer="thumb" />
            <Pointer {...props} pointer="indexFinger" />
            <Pointer {...props} pointer="middleFinger" />
            <Pointer {...props} pointer="ringFinger" />
            <Pointer {...props} pointer="pinky" />
        </div>
    );
}



class Pointer extends React.Component
{
    constructor(props)
    {
        super(props);
        this.state.style = props.style ? props.style : {};
        this.state.child = null;
        this.state.x = 0;
        this.state.y = 0;

        root.pointers[props.hand][props.digit] = this;
        root.loop.loop_through(this.update.bind(this));
    }

    move(x, y)
    {
        this.setState({x, y});
    }

    setChild(element)
    {
        this.setState(element.child);
    }

    render()
    {
        const style = {
            ...this.state.style,
            top: this.state.y,
            left: this.state.x
        }
        return (
            <div className="Pointer" style={style}>
                {this.state.child}
            </div>
        );
    }
}


