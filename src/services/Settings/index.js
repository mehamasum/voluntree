import React from 'react';
import AuthenticatedLayout from '../Layouts';
import { useFetch } from '../../hooks';
import { Button } from 'antd';
import { Layout } from 'antd';
const { Content } = Layout;

const Settings = props => {
  const [oauth_url] = useFetch('/api/voluntree/facebook/oauth_url/')

  const onClickConnect = () => {
    window.open(oauth_url, "Popup", "width=800,height=800");
  };

  return (
    <React.Fragment>
      <AuthenticatedLayout>
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
          <Button
            type="primary"
            disabled={!oauth_url}
            onClick={onClickConnect}
          >
              Content With Page
          </Button>
        </Content>
      </AuthenticatedLayout>
    </React.Fragment>
  );
};

export default Settings;
