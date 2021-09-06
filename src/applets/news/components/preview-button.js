import React from "react";
import Button from "../../../components/button/button"
import "./style-sheets/preview-button.css";

export default 
function Preview(props)
{
    let {title, description, author} = props.article;
    return (
        <div className="Preview">
            <Button {...props}>
                <div>
                    {title}
                </div>
            </Button>
        </div>
    )
}