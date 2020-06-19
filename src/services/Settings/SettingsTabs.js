import React from "react";

import {Button, Card, Space, Tabs, Tag} from 'antd';
import {useHistory, useParams} from "react-router";
import PageListView from "./PageListView";
import {useFetch} from "../../hooks";
import VolunteerSettings from "./VolunteerSettings";
import PaymentSettings from "./PaymentSettings";


import nationbuilder from "../../assets/icons/nationbuilder.svg";
import kindful from "../../assets/icons/kindful.svg";

const {TabPane} = Tabs;


const OrgTab = () => {
  return (
    <>
      <Card title="Volunteer Settings">
        <VolunteerSettings/>
      </Card>
      <br/>


      <Card title="Payment Settings">
        <PaymentSettings/>
      </Card>
    </>
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

const IntegrationsTab = () => {
  const integrations = [
    {
      name: 'Nation Builder',
      logo: nationbuilder,
      connected: true,
      expired: false,
      ready: true
    },
    {
      name: 'Kindful',
      logo: kindful,
      connected: false,
      expired: false,
      ready: false
    }
  ]
  return (
    <div className="vms-list">
      <Space>
        {integrations.map(integration => (
          <Card
            key={integration.name}
            hoverable
            className="vms-card"
            cover={<img alt="example" src={integration.logo} className="vms-logo"/>}
          >
            <div className="vms-card-body">
              <div>
                {
                  integration.connected ? (
                    integration.expired ? <Tag color="error">Expired</Tag> : <Tag color="success">Connected</Tag>
                  ) : <Tag>Not Connected</Tag>
                }
              </div>
              <br/>
              <div>
                <Button
                  type="primary"
                  className="vms-connect"
                  disabled={!integration.ready}
                >
                  Connect {integration.name}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </Space>
    </div>
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