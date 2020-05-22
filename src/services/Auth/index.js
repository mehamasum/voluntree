import React, {useEffect, useState} from 'react';
import './styles.css';
import { Form, Input, Button } from 'antd';
import { Redirect } from "react-router-dom";
import { Layout } from 'antd';
import { Card } from 'antd';

const Demo = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  const onFinish = values => {
    fetch('/api/auth/token/', {
      method: 'POST',
      headers: {'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    })
    .then(response => response.json())
    .then(result => {
      if(result.token) {
        localStorage.setItem('token', result.token);
        setIsLoggedIn(true);
      }
    })
    .catch(err => {
      console.log("err", err);
    });
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  useEffect(() => {
    if(!isLoggedIn) return;

  }, [isLoggedIn]);

  return (
    <React.Fragment>
    {isLoggedIn && 
          <Redirect
            to={{
              pathname: '/',
            }}
          />
    }
      <Layout className="login-layout">
        <Layout.Content className="login-content">
          <Card title="Login" style={{ width: 300 }}>
            <Form
              name="basic"
              initialValues={{}}
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
            >
              <Form.Item
                label="Username"
                name="username"
                rules={[
                  {
                    required: true,
                    message: 'Please input your username!',
                  },
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[
                  {
                    required: true,
                    message: 'Please input your password!',
                  },
                ]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item >
                <Button type="primary" htmlType="submit">
                  Login
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Layout.Content>
      </Layout>
    </React.Fragment>
  );
};

export const LoginView = Demo;
