import React from "react";
import WeatherData from "./weather-data";
import "./weather.css"
import Widget from "../../components/widget/widget";
import Skybox from "./components/skybox/skybox";
import Tempbox from "./components/tempbox/tempbox";
import Datetime from "./components/datetime/datetime"

function Weather()
{
    return (
        <Widget name="Weather">
            <div className="Weather">
                <div style={{display:"table"}}>
                    <Skybox />
                    <Tempbox />
                </div>
                <Datetime />
            </div>
        </Widget>
    )
}

export default Weather;