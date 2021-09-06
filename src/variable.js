export default
function Variable(name, value)
{
    return {
        _value: value,
        get(type=(v) => v)
        {
            return type(this._value)
        },
        
        set(v, type=(v) => v)
        {
            return this._value = type(v);
        },

        toString()
        {
            return `${name}: ${this._value}`
        },
    };
}