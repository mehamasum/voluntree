import React from 'react';
import './template.css';
import logo from '../logo-w-fixed.svg';

import {Layout, Menu, Dropdown} from "antd";
import {
  AppstoreOutlined,
  UnorderedListOutlined,
  SettingOutlined,
  UserOutlined,
  ClockCircleOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { Avatar } from 'antd';
import { Link } from 'react-router-dom';
const { Header, Sider, Content, Footer } = Layout;


const Template = (props) => {
  const onLoggedOutClick = () => {
    const hasToken = localStorage.getItem('token');
    if( hasToken ) {
      localStorage.removeItem('token');
      window.location.reload(false);
    }
  };

  const menu = (
      <Menu>
        <Menu.Item>
          <a onClick={e => {e.preventDefault(); onLoggedOutClick();}}>
            Log Out
          </a>
        </Menu.Item>
      </Menu>
  );

  return (
      <Layout style={{ minHeight: '100vh' }}>
        <Header className="site-header">
          <div className="app-logo"><img src={logo} className="App-logo" alt="logo" /></div>
          <div className="flex"></div>
          <Dropdown overlay={menu}>
            <a className="ant-dropdown-link" href="#">
              <Avatar icon={<UserOutlined />} />
            </a>
          </Dropdown>
        </Header>
        <Layout>
          <Sider trigger={null} className="sider-background">
            <Menu mode="inline" defaultSelectedKeys={['1']} selectedKeys={[props.path]}>
              <Menu.Item key="/" icon={<AppstoreOutlined />}>
                <Link to="/">Dashboard</Link>
              </Menu.Item>
              <Menu.Item key="/posts" icon={<ClockCircleOutlined />}>
                <Link to="/posts">Posts</Link>
              </Menu.Item>
              <Menu.Item key="/volunteers" icon={<TeamOutlined />}>
                <Link to="/volunteers">Volunteers</Link>
              </Menu.Item>
              <Menu.Item key="/settings" icon={<SettingOutlined />}>
                <Link to="/settings">Pages</Link>
              </Menu.Item>
            </Menu>
          </Sider>
          <Layout>
            <Content className="common-content-wrapper">
              <div className="common-content">
                {props.children}
              </div>
            </Content>
            <Footer style={{ textAlign: 'center' }}> Voluntree ©2020</Footer>
          </Layout>
        </Layout>
      </Layout>
  );
};

export default Template;
