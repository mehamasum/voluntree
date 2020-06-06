import React from 'react';
import './template.css';
import logo from '../logo-w-fixed.svg';


import {Avatar, Button, Dropdown, Layout, Menu, Spin, Tooltip, Typography} from "antd";
import {
  AppstoreOutlined,
  ClockCircleOutlined,
  DownOutlined,
  PlusOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
  FormOutlined
} from '@ant-design/icons';
import {Link} from 'react-router-dom';
import {useFetch} from "../hooks";
import {postFetch} from "../actions";


const {Header, Sider, Content, Footer} = Layout;


const Template = (props) => {
  const [meResponse, , , err] = useFetch('/api/auth/users/me/');

  const onLoggedOutClick = () => {
    const hasToken = localStorage.getItem('token');
    if (hasToken) {
      postFetch('/api/auth/token/logout/').then(() => {
        localStorage.removeItem('token');
        window.location.reload(false);
      })
    }
  };

  const menu = (
    <Menu>
      <Menu.Item onClick={e => {
        onLoggedOutClick();
      }}>
        Log Out
      </Menu.Item>
    </Menu>
  );

  if (err) {
    onLoggedOutClick();
  }

  if (!meResponse) {
    return (
      <div className="full-page-loader"><Spin size="large"/></div>
    );
  }

  return (
    <Layout style={{minHeight: '100vh'}}>
      <Header className="site-header">
        <div className="app-logo">
          <img src={logo} className="App-logo" alt="logo"/>
        </div>

        <div className="nav-right-menu">
          <div className="nav-right-menu-item">
            <Tooltip title="Create new post">
              <Link to={`/posts/create`}>
                <Button shape="circle-outline" icon={<PlusOutlined/>}/>
              </Link>
            </Tooltip>
          </div>
          <div className="nav-right-menu-item">
            <Dropdown overlay={menu} trigger={['click']}>
              <div className="nav-right-profile-menu">
                <Avatar icon={<UserOutlined/>}/>
                <Typography className="nav-right-profile-username">{meResponse.username}</Typography>
                <DownOutlined/>
              </div>
            </Dropdown>
          </div>

        </div>


      </Header>
      <Layout>
        <Sider collapsible theme="light">
          <Menu mode="inline" defaultSelectedKeys={['1']} selectedKeys={[props.path]}>
            <Menu.Item key="/" icon={<AppstoreOutlined/>}>
              <Link to="/">Dashboard</Link>
            </Menu.Item>
            <Menu.Item key="/posts" icon={<ClockCircleOutlined/>}>
              <Link to="/posts">Posts</Link>
            </Menu.Item>
            <Menu.Item key="/signups" icon={<FormOutlined />}>
              <Link to="/signups">Sign Ups</Link>
            </Menu.Item>
            <Menu.Item key="/volunteers" icon={<TeamOutlined/>}>
              <Link to="/volunteers">Volunteers</Link>
            </Menu.Item>
            <Menu.Item key="/settings" icon={<SettingOutlined/>}>
              <Link to="/settings">Settings</Link>
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout>
          <Content className="common-content-wrapper">
            <div className="common-content">
              {props.children}
            </div>
          </Content>
          <Footer style={{textAlign: 'center'}}> Voluntree ©2020</Footer>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default Template;
