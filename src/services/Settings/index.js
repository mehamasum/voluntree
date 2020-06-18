import './index.css';

import React from 'react';
import {Button, Card} from 'antd';
import {useFetch} from '../../hooks';
import PageListView from './PageListView';

import nationbuilder from '../../assets/icons/nationbuilder.svg';
import VolunteerSettings from "./VolunteerSettings";
import PaymentSettings from "./PaymentSettings";


const Settings = () => {
  const [oauth_url] = useFetch('/api/facebook/oauth_url/');

  const onClickConnect = () => {
    window.open(oauth_url, "Popup", "width=800,height=800");
  };

  return (
    <div>
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
      <br/>


      <Card title="Volunteer Settings">
        <VolunteerSettings/>
      </Card>
      <br/>


      <Card title="Payment Settings">
        <PaymentSettings/>
      </Card>
      <br/>


      <Card title="VMS Integrations">
        <Card
          hoverable
          className="vms-card"
          cover={<img alt="example" src={nationbuilder} className="vms-nb"/>}
        >
          <div className="vms-card-body">
            <Button
              type="primary"
              className="vms-connect"
            >
              Connect Nation Builder
            </Button>
          </div>
        </Card>

      </Card>
    </div>
  );
};

export default Settings;
