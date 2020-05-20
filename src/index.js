import React from 'react';
import ReactDOM from 'react-dom';
import 'antd/dist/antd.css';
import './assets/css/index.css';
import { Route, Switch, BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import Settings from './services/Settings';
import FacebookLogin from './services/FacebookLogin';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
  <React.Fragment>
    <Router>
      <Switch>
        <Route exact path="/">
          <App/>
        </Route>
        <Route exact path="/settings">
          <Settings/>
        </Route>
        <Route exact path="/facebook_login">
          <FacebookLogin/>
        </Route>
      </Switch>
    </Router>
  </React.Fragment>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
