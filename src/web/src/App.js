import './index.scss';

import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useRouteMatch,
  useParams
} from "react-router-dom";

import {Login} from './scenes/user';
export default function App() {
  //let match = useRouteMatch();
  
  return (
    <Router path="/">      
      <Login/>
    </Router>
  );
}
