import React from 'react';
import {useHistory} from 'react-router-dom';
import { Provider } from 'use-http';

export const FetchProvider = props => {
  const history = useHistory();

  let headers = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const options = {
    cachePolicy: 'no-cache',
    headers,
    interceptors: {
      response: async ({ response }) => {
        if (response.status === 401) {
          localStorage.clear();
          history.push('/login');
        }
        if (response.status === 404) {
          history.push('/404');
        }
        if (response.status >= 500) {
          //TODO Take error handle
        }
        return response;
      }
    }
  };

  return <Provider options={options}>{props.children}</Provider>;
};

