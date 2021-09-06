import React from "react";
import "./datetime.css";
import time from "../../time-data";

function Datebox(props)
{
    return (<div className="Datebox">
            <div className="Month">
                {props.month}
            </div>
            <div className="Day">
                {props.day}
            </div>
        </div>
    )
}

class Datetime extends React.Component
{
    constructor(props)
    {
        super(props)
        this.state = {...time};
        time.add_task(this.update.bind(this));
    }

    update()
    {
        this.setState({...time});
    }

    render()
    {
        return (
            <div className="Datetime">
                <div className="Weekday">
                    {this.state.week_day}
                </div>
                <Datebox month={this.state.month} day={this.state.day} />
                <div className="Time">
                    {this.state.time}
                </div>
            </div>
        )
    }

}

export default Datetime;