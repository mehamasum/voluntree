import React, {useState, useEffect} from 'react';
import { Redirect, Route } from "react-router-dom";

const PrivateRoute = props => {
  const { component: Component, path, ...rest } = props;
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Route
      {...rest}
      render={props =>
        isAuthenticated ? (
          <Component {...props} />
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
