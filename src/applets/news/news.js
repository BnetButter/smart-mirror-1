import React from "react";
import Widget from "../../components/widget/widget";
import ScrollFrame from "../../components/scroll-frame/scroll-frame"
import Container from "./components/container";
export default
function News(props)
{
 

    return (
        <Widget style={props.style}>
            <ScrollFrame 
                style={{
                    height: props.height,
                    width: props.width,
                }}
                orient={ScrollFrame.VERTICAL}>
                <Container apikey={props.apikey} />
            </ScrollFrame>
        </Widget>
    );
}