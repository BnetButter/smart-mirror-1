import React from "react";
import "./style-sheets/container.css";
import Variable from "../../../variable";
import Article from "./article";
import request from "request";


export default
class Container extends React.Component
{

    constructor(props)
    {
        super(props);
        this.variable = new Variable();
        this.state = {
            content: () => this.variable.get()
        }
    }

    render()
    {
        let articles;
        let result = this.state.content()
        if (result && result.status === "ok") {
            articles = result.articles 
        }
        else {
            articles = [];
        }

        const children = articles.map(
            (article, k) => <Article key={k} article={article} />
        )

        return (
            <div className="Container" style={this.props.style}>
                {children}
            </div>
        )
    }   

    componentDidMount()
    {
        if (! this._mainloop)
            this._mainloop = Cancellable(this.mainloop.bind(this));
    }

    componentWillUnmount()
    {   
        this.mainloop.cancel()
    }

    async mainloop()
    {
        while (true) {

            await new Promise((r) => setTimeout(r, 5000))

            request(request_url(this.props.apikey),
                (err, res) => 
                {
                    if (! err) {
                        res = JSON.parse(res.body);
                        console.info(`Retrieved ${res.totalResults} articles`)
                        this.variable.set(res);
                        this.setState({content: () => this.variable.get()});
                    }            
                })
            await new Promise((r) => setTimeout(r, 3595000));
        } 
    }
}

function Cancellable(task)
{
    let reject_fn;
    let wraps = new Promise((res, err) => 
    {
        reject_fn = err;
        Promise.resolve(new Promise(task))
            .then(res)
            .catch(err);
    });
    wraps.cancel = () => {reject_fn({canceled:true})};
    return wraps;
}

function request_url(apikey, country="us")
{
    return `http://newsapi.org/v2/top-headlines?country=${country}&apiKey=${apikey}`;
}