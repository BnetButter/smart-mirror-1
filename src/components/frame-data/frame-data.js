import React from "react";
import Leap from "leapjs";
import "./frame-data.css"

class FrameData extends React.Component
{
    constructor(p)
    {
        super(p);
        this.state = {};
        Leap.loop({}, (frame) => this.setState({frame: frame}));
    }

    render()
    {   
        const frame = this.state.frame;
        if (! frame)
            return null;
        
        let position = {};
        for (const hand of frame.hands)
            position[hand.type] = hand.palmPosition.map(
                (pos) => Math.floor(pos)
                ).toString()
        return (
            <div className="FrameData">
                <h3>LeapMotion Frame Data</h3>
                id: {frame.id} <br/>
                left hand: [{position.left}] <br/>
                right hand: [{position.right}] <br/>
                fps: {frame.currentFrameRate} <br />
            </div>
        )
    }
}

export default FrameData;