import React from "react";
import Widget from "../../components/widget/widget";
import "./messagebox.css";
import client from "client"

function current_time([t])
{
    return Math.round((new Date(t)).getTime() / 1000);
}



const operation = {
    "==": (l, r) => l == r,
    "!=": (l, r) => l != r,
    ">=": (l, r) => l >= r,
    "<=": (l, r) => l <= r,
    ">": (l, r) => l > r,
    "<": (l, r) => l < r,
}

function eval_condition(conditions)
{
    for (const cond of conditions)
    {
        if (! operation[cond.op](conditions.lval, conditions.rval))
            return false;
    }
    return true;
}

const ruleinfo = {
    conditions: {
        "CURRENT TIME": [],
        "date": ["date"],
        "datetime": ["datetime-local"],
    },
    actions: {
        "set message": [],
        "delete": [],
    },
}

class Message extends React.Component
{
    constructor(props)
    {
        super(props)
        this.state = {message: "placeholder"};
        this.client = new client.Client(props.name, "rule");
        this.rules = {
            rules:[],
            conditions: {
                "CURRENT TIME": current_time,
                "date": current_time,
                "datetime": current_time,
            },
            actions: {
                "set message": (rule) => this.setState({message: rule.content}),
                "delete": (rule) => this.rules.rules.splice(this.rules.rules.indexOf(rule), 1),
            },
        };

        this.client.addEventListener("open", this.onopen.bind(this));
    }
    
    onopen()
    {
        this.client.do_get({
            rules: [],
            ruleinfo
        });
    }

    onmessage(event)
    {   

        let data = JSON.parse(event.data);
        console.log(data);
        if (data.name === this.props.name 
                && data.type === "config"
                && data.body !== null)
            this.rules.rules = data.body;
    }

    exec_rule()
    {
        for (const rule of [...this.rule.rules])
        {
         
            let doit = true;
            for (const condition of rule.condition)
            {
                let l, r;
                l =  this.rules.conditions[condition.lvalue.name](condition.lvalue.args);
                r = this.rules.conditions[condition.rvalue.name](condition.rvalue.args);
                if (! operation[condition.op](l, r))
                {
                    doit = false;
                    break;
                }
            }

            if (doit)
            {
                for (const action of rule.actions)
                {
                    this.rules.actions[action.name](rule);
                }
            }
        }
    }

    render()
    {
        return (
            <div className="Messagebox" style={this.state.style}>
                {this.state.message}
            </div>
        );
    }
}

export default
function MessageBox(props)
{
    return (
        <Widget style={props.style} name="Message">
            <Message />
        </Widget>
    )
}