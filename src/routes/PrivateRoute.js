import React from 'react';
import { Redirect, Route } from "react-router-dom";
import Template from "../template";

const PrivateRoute = props => {
  const { component: Component, path, ...rest } = props;
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Route
      {...rest}
      render={props =>
        isAuthenticated ? (
            <Template>
                <Component {...props} />
            </Template>
        ) : (
          <Redirect
            to={{
              pathname: '/login',
            }}
          />
        )
      }
    />
  );
};

export default PrivateRoute;
