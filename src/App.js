import React from 'react';
import Pointer from "./components/pointers/pointers";
import Weather from "./applets/weather/weather";
import Controller from "./controller";
import Knob from "./components/knob/knob";
import Variable from './variable';
import Menu from "./components/menu/menu";
import News from "./applets/news/news";
import ControlPanel from "./components/control-panel/control-panel";
import settings_icon from "./media/settings-wheel.png";
import reload_icon from "./media/reload.png";
import './App.css';


const NEWSAPI = "4930fd751ab4418ea0c1f9855cb1b15b";

// did not know defaultProp or PropTypes was a thing
React.Component.check_props = (props, ...required) => 
{

    let missing = [];
    let err_msg = "Missing required properties ";

    for (const propname of required)
        if (! (propname in props))
            missing.push(propname)
    
    if (missing.length)
    {
        for (const name of missing)
            err_msg += `"${name}", `
        throw Error(err_msg);
    }
}



class App extends React.Component
{   
    static instance = null; 
    constructor(props)
    {
        
        super(props);
        App.instance = this;
        this.toplevel = new Set()
        this.state = {
            opacity: 100,
            toplevel: () => this.toplevel
        }
        this.on_change = (value) => this.setState({opacity: value})
        Controller.globals.app = this;
        this.opacity_variable = new Variable();
        this.opacity_variable.set(100);
        this._updated = {};
        Controller.add_task(this.update.bind(this));
    }

    add_widget(ComponentClass, props, only_one=false)
    {
        if (only_one && this.toplevel.has({ComponentClass, props}))
            return;
        
        props.onDestroy = () => this.remove_widget.bind(
            this, ComponentClass, props);
        
        this.toplevel.add({ComponentClass, props});
        this.setState({toplevel: () => this.toplevel});
    }

    remove_widget(ComponentClass, props)
    {
        this.toplevel.remove({ComponentClass, props});
        this.setState({toplevel: () => this.toplevel});
    }

    update(pointers)
    {
        for (const h of pointers) {
            const hand = pointers[h];
            if (! hand.has_focus()) {
                Menu.setOptions(h, DEFAULT_MENU)
            }
        }
    }

    render()
    {
        const toplevels = [...this.state.toplevel().keys()].map(
            ({ComponentClass, props}, value) => <ComponentClass 
                {...props}
                key={value} />
        );
        
        return (
            <div className="App" id="App">
                <Pointer type="left" />
                <Pointer type="left" digit="thumb" />
                <Pointer type="left" digit="indexFinger" />
                <Pointer type="left" digit="middleFinger" />
                <Pointer type="left" digit="ringFinger" />
                <Pointer type="left" digit="pinky" />
                <Pointer type="right" />
                <Pointer type="right" digit="thumb" />
                <Pointer type="right" digit="indexFinger" />
                <Pointer type="right" digit="middleFinger" />
                <Pointer type="right" digit="ringFinger" />
                <Pointer type="right" digit="pinky" />

                <Menu distance={10} />
                {toplevels}
                <div className="Mirror" style={{
                        opacity: `${this.state.opacity}%`
                        }}>
                    <Weather />
                    <News apikey={NEWSAPI} height={700} style={{top: 500}}/>
                </div>



            </div>
        )
    }
}

function AppControl(props)
{
    return (
        <ControlPanel 
                {...props}
                className="ControlPanel"
                name="Control Panel"
                shieldDisable={true}>
            <OpacityControl 
                {...props} />
        </ControlPanel>
    )
}

function OpacityLabel(props)
{
    return <div className="OpacityLabel">{`${props.value}`.padStart(3, " ") + "%"}</div>
}


class OpacityControl extends React.Component
{

    constructor(props)
    {
        React.Component.check_props(props, ["variable"]);
        super(props);
        this.state = {
            opacity: props.variable.get()
        }

        this.on_rotate = this.on_rotate.bind(this);
    }

    on_rotate(value)
    {
        value = Math.round(value);
        this.props.onChange(value);
        this.setState({opacity: value});
        if (value <= 40) {
            for (const component of Controller.components) {
                Controller.disableFocus(component);
            }
        }
        else if (value > 40) {
            for (const component of Controller.components) {
                Controller.enableFocus(component);
            }
        }
    }

    render()
    {
        return (
            <div className="OpacityControl" {...this.props}>
                <OpacityLabel value={this.state.opacity} />
                <Knob radius={70}
                        scale={2}
                        value={this.props.variable.get()}
                        min={-90}
                        max={90}
                        onChange={this.on_rotate}
                        style={{fontSize: 20}}>
                    Opacity
                </Knob>
            </div>
        )
    }
}



const DEFAULT_MENU = {
    indexFinger: new Menu.Options(
        <img src={settings_icon} style={{width:"100%", height: "100%"}} />, 
        () => App.instance.add_widget(
                AppControl, {
                    variable: App.instance.opacity_variable,
                    onChange: App.instance.on_change,
                }, 
                true
        ),
        "Control Panel"
    ),
    middleFinger: new Menu.Options(
        <img src={reload_icon} style={{width:"100%", height: "100%"}} />,
        () => window.location.reload(),
        "Reload window"
    ),
}

 
   
export default App;
