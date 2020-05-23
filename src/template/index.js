import React, { useState } from 'react';

import { Layout, Menu } from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  FormOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons';

import './template.css';

const { Header, Sider, Content, Footer } = Layout;

const DashboardTemplate = ({ ...props }) => {
  const [state, setState] = useState(false);
 
  const onLoggedOutClick = () => {
    const hasToken = localStorage.getItem('token');
    if( hasToken ) {
      localStorage.removeItem('token');
      window.location.reload(false);
    }
  }

  const toggle = () => {
    setState( state ? false : true );
  };

    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Sider trigger={null} collapsible collapsed={state}>
          <div className="logo" />
          <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
            <Menu.Item key="1" icon={<AppstoreOutlined />}>
              Dashboard
            </Menu.Item>
            <Menu.Item key="2" icon={<FormOutlined />}>
              Create New Post
            </Menu.Item>
            <Menu.Item key="3" icon={<UnorderedListOutlined />}>
              Volunteer List 
            </Menu.Item>
            <Menu.Item key="4" icon={<SettingOutlined />}>
              Settings
            </Menu.Item>
            <Menu.Item key="5" icon={<LogoutOutlined />} onClick={onLoggedOutClick}>
              Log Out
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout className="site-layout">
          <Header className="site-layout-background" style={{ padding: 0 }}>
            {React.createElement(state ? MenuUnfoldOutlined : MenuFoldOutlined, {
              className: 'trigger',
              onClick: toggle,
            })}
          </Header>
          <Content
            style={{
              margin: '24px 16px',
              minHeight: 360,
              background: '#fff'
            }}
          >
             {props.children}
          </Content>
          <Footer style={{ textAlign: 'center' }}> Voluntree ©2020</Footer>
        </Layout>
      </Layout>
    );
}

export default DashboardTemplate;