import React, { useEffect } from 'react';
import AuthenticatedLayout from '../Layouts';
import { Button } from 'antd';
import { Layout, Menu } from 'antd';
const { Header, Content } = Layout;

const url = "https://www.facebook.com/v6.0/dialog/oauth?client_id=564565341110347&redirect_uri=http://localhost:3000/facebook_login/&state=xyz&scope=pages_manage_posts"

const Settings = props => {
  useEffect(() => {
    console.log("come here parent");
  });

  return (
    <React.Fragment>
      <AuthenticatedLayout>
          <Layout style={{ padding: '0 24px 24px' }}>
            <Content
              className="site-layout-background"
              style={{
                padding: 24,
                margin: 0,
                minHeight: 280,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
            <Button type="primary" onClick={() => {
              window.open(url, "Popup", "width=1000,height=800");
            }}>Content With Page</Button>
            </Content>
          </Layout>
      </AuthenticatedLayout>
    </React.Fragment>
  );
};

export default Settings;
