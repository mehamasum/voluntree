import React, {useState} from 'react';
import ReactDOM from 'react-dom';
import 'antd/dist/antd.css';
import './assets/css/index.css';
import { Route, Switch, BrowserRouter as Router, Link } from 'react-router-dom';
import Dashboard from './services/Dashboard';
import {LoginView} from './services/Auth';
import * as serviceWorker from './serviceWorker';
import PrivateRoute from './routes/PrivateRoute';
import Settings from './services/Settings';
import FacebookLogin from './services/FacebookLogin';
import PostCreateView from './services/Posts/PostCreateView';
import PostEditView from './services/Posts/PostEditView';
import PostDetailsView from './services/Posts/PostDetailsView';
import PostListView from './services/Posts/PostListView';
import Volunteers from './services/Volunteers';

const App = (props) => {
  return (
      <Router>
        <Switch>
          <Route exact path="/login">
            <LoginView/>
          </Route>
          <PrivateRoute exact path="/" component={Dashboard} />
          <PrivateRoute exact path="/settings/" component={Settings} />
          <PrivateRoute exact path="/facebook_login/" component={FacebookLogin} withoutTemplate/>
          <PrivateRoute exact path="/posts/" component={PostListView} />
          <PrivateRoute exact path="/posts/create/" component={PostCreateView} />
          <PrivateRoute exact path="/posts/:id/edit/" component={PostEditView} />
          <PrivateRoute exact path="/posts/:id/" component={PostDetailsView} />
          <PrivateRoute exact path="/volunteers" component={Volunteers} />
        </Switch>
      </Router>
  );
};

ReactDOM.render(<App/>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
