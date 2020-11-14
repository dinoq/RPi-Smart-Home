import React from "react";

export class Login extends React.Component{
    constructor(props){
        super(props); 
        this.state = {
            email: '',
            password: '',
            rememberMe: false,
        }
    }

    componentDidMount(){
        if(localStorage.rememberMe && localStorage.email !== ""){
            this.setState({
                rememberMe: true,
                email: localStorage.username,
                password: localStorage.password
            })
        }
        document.getElementById("form-wrapper").style.height="500px";
        console.log(document.getElementById("form-wrapper").clientHeight);
        //console.log(React.findDOMNode(this.refs.formWrapper));
    }
    render(){


        return(
            <div id="form-wrapper" ref="formWrapper">
                <form onSubmit={(e)=>{}} id="login-form">
                    <input type="text" name="login" id="login" placeholder="Email"/>
                    <input type="password" name="password" id="password" placeholder="heslo"/>
                    <div>
                        <input type="checkbox" id="remember" checked={this.state.rememberMe} name="remember-me" onChange={this.onChangeCheckbox} />
                        <label htmlFor="remember">Zapamatovat</label>
                    </div>
                    <input type="button" value="Přihlásit" onClick={this.login}/>
                </form>
            </div>
        );
    }

    onChangeCheckbox = (e)=>{
        this.setState({
            rememberMe: e.target.checked
        })
    }

    login = ()=>{

    }


}