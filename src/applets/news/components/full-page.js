import React from "react";
import Button from "../../../components/button/button";


export default
function FullPage(props)
{
    return (
        <Button {...props}>
            {props.content}
        </Button>
    );
}