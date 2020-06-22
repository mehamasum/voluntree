import React from 'react';
import ReactDOM from 'react-dom';
import 'antd/dist/antd.css';
import './index.css';
import { Route, Switch, BrowserRouter as Router } from 'react-router-dom';
import Dashboard from './services/Dashboard';
import {LoginView} from './services/Auth';
import * as serviceWorker from './serviceWorker';
import { Result } from 'antd';

import PrivateRoute from './routes/PrivateRoute';
import Settings from './services/Settings';
import FacebookLogin from './services/FacebookLogin';
import NationBuilderLogin from './services/NationBuilderLogin';
import PostCreateView from './services/Posts/PostCreateView';
import PostEditView from './services/Posts/PostEditView';
import PostDetailsView from './services/Posts/PostDetailsView';
import PostListView from './services/Posts/PostListView';
import VolunteerListView from './services/Volunteers/VolunteerListView';
import VolunteerDetailsView from './services/Volunteers/VolunteerDetailsView';

import Upcoming from './components/Upcoming';

import SignUpList from "./services/SignUps/List";
import SignUpView from "./services/SignUps/View";
import SignUpEdit from "./services/SignUps/Edit";

const App = (props) => {
  return (
      <Router>
        <Switch>
          <Route exact path="/login">
            <LoginView/>
          </Route>
          <PrivateRoute exact path="/" component={Dashboard} />
          <PrivateRoute exact path="/settings/:tab?" component={Settings} />
          <PrivateRoute exact path="/facebook_login/" component={FacebookLogin} withoutTemplate/>
          <PrivateRoute exact path="/nationbuilder_login/" component={NationBuilderLogin} withoutTemplate/>


          <PrivateRoute exact path="/posts/" component={PostListView} />
          <PrivateRoute exact path="/posts/create/" component={PostCreateView} />
          <PrivateRoute exact path="/posts/:id/" component={PostDetailsView} />
          <PrivateRoute exact path="/posts/:id/edit/" component={PostEditView} />

          <PrivateRoute exact path="/signups/" component={SignUpList} />
          <PrivateRoute exact path="/signups/:id/" component={SignUpView} />
          <PrivateRoute exact path="/signups/:id/edit/" component={SignUpEdit} />


          <PrivateRoute exact path="/donations" component={Upcoming} />
          <PrivateRoute exact path="/donors" component={Upcoming} />

          <PrivateRoute exact path="/volunteers" component={VolunteerListView} />
          <PrivateRoute exact path="/volunteers/:id" component={VolunteerDetailsView} />

          <Route render={() => <Result status="404" title="404" subTitle="Sorry, the page you visited does not exist." />} />
        </Switch>
      </Router>
  );
};

ReactDOM.render(<App/>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
