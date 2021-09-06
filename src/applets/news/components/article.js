import React from "react";
import Button from "../../../components/button/button"
import PreviewButton from "./preview-button";
import FullPageButton from "./full-page";
import "./style-sheets/article.css"

export default 
class Article extends React.Component
{
    constructor(props)
    {
        super(props);
        this.state = {
            show_page: false,
        }
        this.on_click = this.on_click.bind(this);
    }

    on_click()
    {
        this.setState({show_page: ! this.state.show_page})
    }


    render()
    {

        let preview_display = this.state.show_page ? "none" : "default";
        let article_display = this.state.show_page ? "default": "none";
        return (
            <div className="Article" style={this.props.style}>
                <PreviewButton
                        onClick={this.on_click} 
                        style={{display: preview_display}}
                        article={this.props.article}
                        />
            </div>
        )
    }
}