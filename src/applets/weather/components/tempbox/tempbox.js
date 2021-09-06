import React from "react";
import WeatherData from "../../weather-data";
import "./tempbox.css"

const TEMP_CONVERT = {
    F: (k) => (k - 273.15) * 9/5 + 32,
    C: (k) => (k - 273.15),
    K: (k) => k,
};

const DEFAULT_UNIT = "F";


function MinMaxTemp(props)
{
    return (
        <div className="MinMaxTemp">
            <div id="MinMax">{props.text}</div>
            <div>{props.temp}&#176; {DEFAULT_UNIT}</div>
        </div>
    );
}

class Tempbox extends React.Component
{   
    constructor(props)
    {
        super(props);
        this.state = {
            temp: 0,
            low: 0,
            high: 0,
        }
        WeatherData.add_task(this.update.bind(this));
    }
    
    update(data)
    {
        const convert = TEMP_CONVERT[DEFAULT_UNIT];
        this.setState({
            temp: Math.round(convert(data.main.temp)),
            low: Math.round(convert(data.main.temp_min)),
            high: Math.round(convert(data.main.temp_max))
        });
    }

    render()
    {
        return (
            <div className="Tempbox">
                <div>
                    {this.state.temp}&#176; {DEFAULT_UNIT}
                </div>
                <div className="MinMax">
                    <MinMaxTemp text="low" temp={this.state.low} />
                    <MinMaxTemp text="high" temp={this.state.low} />
                </div>
            </div>
        )
    }
}

export default Tempbox;