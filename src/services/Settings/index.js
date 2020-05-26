import React from 'react';
import Template from '../../template';
import { useFetch } from '../../hooks';
import { Button } from 'antd';
import { Layout } from 'antd';
const { Content } = Layout;

const Settings = props => {
  const [oauth_url] = useFetch('/api/voluntree/facebook/oauth_url/')

  const onClickConnect = () => {
    window.open(oauth_url, "Popup", "width=400,height=600");
  };

  return (
    <React.Fragment>
        <Button
            type="primary"
            disabled={!oauth_url}
            onClick={onClickConnect}
        >
            Content With Page
        </Button>
    </React.Fragment>
  );
};

export default Settings;
