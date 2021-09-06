import React from "react";
import Widget from "../widget/widget";
import Menu from "../menu/menu";

export default
class ControlPanel extends React.Component
{   

    constructor(props)
    {
        super(props);
        this.onFocusIn = this.onFocusIn.bind(this);
        this.onFocusOut = this.onFocusOut.bind(this);
        this.onMount = this.onMount.bind(this);
        this.onDestroy = this.onDestroy.bind(this);
        let root = document.getElementById("root");
        console.log(root.offsetHeight, root.offsetWidth)
        this.state = {
            render_this: true,
            style: {
                height: "50%",
                width: "50%",
                zIndex: 2000
            }
            
        }
    }

    render()
    {
        if (this.state.render_this) {
            return (
                <Widget {...this.props}
                        onFocusIn={this.onFocusIn}
                        onFocusOut={this.onFocusOut}
                        onMount={this.onMount}
                        onDestroy={this.onDestroy}
                        style={this.state.style}>
                    <div>
                        {this.props.children}
                    </div>
                </Widget>
            );
        }
        else {
            return null;
        }
    }

    onFocusIn()
    {
        Menu.setOptions("right", {
            ringFinger: new Menu.Options(
                    null, this.onDestroy.bind(this), "Delete window"
                ),
            }
        )
        Menu.setOptions("left", {
            ringFinger: new Menu.Options(
                    null, this.onDestroy.bind(this), "Delete window"
                ),
        });
    }

    onFocusOut()
    {
        Menu.clearOptions();
    }

    onMount(component)
    {
        component.center();
    }

    onDestroy()
    {
        this.setState({render_this: false});
        if (this.props.onDestroy)
            this.props.onDestroy();
    }
}