import strftime from "strftime";
import AsyncLoopExecutor from "../../async-loop"


const time = {
    week_day: "",
    day: "",
    month: "",
    time: "",
    _tasks: [],
    add_task(task) {this._tasks.push(task)}
};

AsyncLoopExecutor(
    function ()
    {
        time.week_day = strftime("%a");
        time.day = strftime("%-d");
        time.month = strftime("%b");
        time.time = strftime("%I:%M %p");
        for (const task of time._tasks)
            task(time);
    },
    1000
)

export default time;