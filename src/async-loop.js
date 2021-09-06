async function sleep(ms)
{
    return new Promise((r) => setTimeout(r, ms));
}

export default
function AsyncLoopExecutor(func, ms, ref)
{
    ref = ref ? ref : {func, ms};
    return new Promise(
        async function ()
        {
            while (true)
            {
                ref.func();
                await sleep(ref.ms);
            }
        }
    )
}