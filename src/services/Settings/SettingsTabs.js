import React from "react";

import {Button, Card, Space, Tabs, Tag} from 'antd';
import {useHistory, useParams} from "react-router";
import PageListView from "./PageListView";
import {useFetch} from "../../hooks";


import IntegrationsTab from "./Integrations";
import OrgSettings from "./OrgSettings";

const {TabPane} = Tabs;


const OrgTab = () => {
  return (
    <OrgSettings/>
  )
}

const PagesTab = () => {
  const [oauth_url] = useFetch('/api/facebook/oauth_url/');

  const onClickConnect = () => {
    window.open(oauth_url, "Popup", "width=800,height=800");
  };

  return (
    <>
      <div className="create-new-page">
        <Button
          type="primary"
          disabled={!oauth_url}
          onClick={onClickConnect}
        >
          Connect Facebook Pages
        </Button>
      </div>

      <Card title="Connected Pages">
        <PageListView/>
      </Card>
    </>
  )
}

const SettingsTabs = props => {
  const history = useHistory();
  const {tab} = useParams();
  const handleTabClick = key => {
    history.push(`/settings/${key}`);
  }

  return (
    <Tabs onChange={handleTabClick} activeKey={tab || 'organization'} type="card">
      <TabPane tab="Organization" key="organization">
        <OrgTab/>
      </TabPane>
      <TabPane tab="Connected Pages" key="connected-pages">
        <PagesTab/>
      </TabPane>
      <TabPane tab="Integrations" key="integrations">
        <IntegrationsTab/>
      </TabPane>
    </Tabs>
  )
};


export default SettingsTabs;