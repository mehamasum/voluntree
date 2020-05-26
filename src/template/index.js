import React from 'react';
import './template.css';

import {Layout, Menu, Dropdown} from "antd";
import {
  AppstoreOutlined,
  UnorderedListOutlined,
  SettingOutlined,
  UserOutlined
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
        <Header>
          <div className="logo" />
          <div className="flex"></div>
          <Dropdown overlay={menu}>
            <a className="ant-dropdown-link" href="#">
              <Avatar size="large" icon={<UserOutlined />} />
            </a>
          </Dropdown>
        </Header>
        <Layout>
          <Sider trigger={null} className="site-layout-background">
            <Menu mode="inline" defaultSelectedKeys={['1']}>
              <Menu.Item key="1" icon={<AppstoreOutlined />}>
                <Link to="/">Dashboard</Link>
              </Menu.Item>
              <Menu.Item key="2" icon={<UnorderedListOutlined />}>
                <Link to="/volunteers">Volunteers</Link>
              </Menu.Item>
              <Menu.Item key="3" icon={<SettingOutlined />}>
                <Link to="/settings">Settings</Link>
              </Menu.Item>
            </Menu>
          </Sider>
          <Layout>
            <Content>
              {props.children}
            </Content>
            <Footer style={{ textAlign: 'center' }}> Voluntree © 2020</Footer>
          </Layout>
        </Layout>
      </Layout>
  );
};

export default Template;
