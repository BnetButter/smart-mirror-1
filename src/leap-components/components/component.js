import React from "react";

export default
class Component extends React.Component
{
    constructor(props)
    {
        super(props);
        this.ref = React.createRef();
        this.state = {style: props.style ? {...props.style} : {}};
    }

    is_inside(...positions)
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


    set_style(style)
    {
        this.setState({style: {...this.state.style, ...style}})
    }
    
    render(child)
    {
        return (
            <div ref={this.ref}>
                {child}
            </div>
        )
    }
}