import './styles.css';
import React, {useEffect, useState} from 'react';
import { Form, Input, Button, Layout, Card } from 'antd';
import { Redirect } from "react-router-dom";
import logo from '../../logo-w-fixed.svg';

const LoginView = () => {
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

  if (isLoggedIn) return <Redirect to={{pathname: '/',}}/>

  return (
    <React.Fragment>
      <Layout className="login-layout">
        <Layout.Content className="login-content">
          <div className="login-app-logo-container"><img src={logo} className="login-app-logo" alt="logo" /></div>
          <Card title="Admin Login" className="login-card">
            <Form
              name="basic"
              initialValues={{}}
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
            >
              <Form.Item
                name="username"
                rules={[
                  {
                    required: true,
                    message: 'Please input your username!',
                  },
                ]}
              >
                <Input placeholder="Username"/>
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  {
                    required: true,
                    message: 'Please input your password!',
                  },
                ]}
              >
                <Input placeholder="Password" type="password"/>
              </Form.Item>
              <Form.Item >
                <Button type="primary" htmlType="submit" className="login-form-submit">
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

export default LoginView;
