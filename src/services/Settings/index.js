import React from 'react';
import AuthenticatedLayout from '../Layouts';
import { Button } from 'antd';
import { Layout, Menu } from 'antd';
const { Header, Content } = Layout;

const url = "https://www.facebook.com/v6.0/dialog/oauth?client_id=xyz&redirect_uri=http://localhost:3000/&state=xyz&permissions=publish_pages"

const Settings = props => {
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
              console.log("Click");
              window.open(url, "", "width=1000,height=800");
            }}>Content With Page</Button>
            </Content>
          </Layout>
      </AuthenticatedLayout>
    </React.Fragment>
  );
};

export default Settings;
