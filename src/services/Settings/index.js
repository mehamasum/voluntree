import React from 'react';
import Template from '../../template';
import { useFetch } from '../../hooks';
import { Card, Space } from 'antd';
import { Button } from 'antd';
import PageListView from './PageListView';
import { Layout } from 'antd';
const { Content } = Layout;

const Settings = props => {
  const [oauth_url] = useFetch('/api/voluntree/facebook/oauth_url/')

  const onClickConnect = () => {
    window.open(oauth_url, "Popup", "width=400,height=600");
  };

  return (
    <React.Fragment>
      <Content className="center-content">
        <Card title="Settings" style={{width: '50%'}}>
          <Space direction="vertical">
            <Button type="primary" disabled={!oauth_url} onClick={onClickConnect}>
                Connnect With Page
            </Button>
            <PageListView/>
          </Space>
        </Card>
      </Content>
    </React.Fragment>
  );
};

export default Settings;
