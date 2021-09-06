import request from "request";
import AsyncLoopExecutor from "../../async-loop";

const ZIP = 65401;
const API_KEY = "a296fc4c8a77cd6cbddb87e24787c809"
const tasks = [];
const WeatherData = {
    add_task(t) {tasks.push(t);}
};

AsyncLoopExecutor(
    function ()
    {
        request(init_url(ZIP, API_KEY, "weather"),
            (err, res) =>
            {
                if (! err)
                {
                    res = JSON.parse(res.body);
                    for (const k in res)
                        WeatherData[k] = res[k];
                    for (const task of tasks)
                        task(res, res.__forecast);
                }
            })
        request(init_url(ZIP, API_KEY, "forecast"),
            (err, res) =>
            {
                if (! err) {
                    WeatherData["__forecast"] = JSON.parse(res.body);
                }
            })
    },
    60000 // 60 sec
);

function init_url(zip, api_key, key)
{
    return `http://api.openweathermap.org/data/2.5/${key}?zip=${zip}&appid=${api_key}`   
}

export default WeatherData
