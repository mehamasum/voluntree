import './index.css';
import React, {useState, useEffect} from 'react';
import {Button, Card, Modal, Input, Form, Tag} from 'antd';
import {useFetch} from '../../hooks';
import PageListView from './PageListView';

import nationbuilder from '../../assets/icons/nationbuilder.svg';
import VolunteerSettings from "./VolunteerSettings";
import PaymentSettings from "./PaymentSettings";
import Tabs from "./SettingsTabs";


const Settings = () => {
  const [nationbuilderState, setNationbuilderState] = useState(null);
  const [facebook_oauth_url] = useFetch('/api/facebook/oauth_url/');
  const [nationbuilder_oauth_url, setNbResponse, setNationBuilderOauthUrl] = useFetch();
  const [integrations] = useFetch('/api/integrations/');
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();

  const onClickConnect = () => {
    window.open(facebook_oauth_url, "Popup", "width=800,height=800");
  };

  const onClickConnectNationBuilder = () => {
    setVisible(true);
  };

  const handleOk = (values) => {
    setNationBuilderOauthUrl(`/api/nationbuilder/oauth_url/?slug=${values.slug}`);
    setVisible(false);
  }

  const handleCancel = () => {
    setVisible(false);
  }

  useEffect(() => {
    if(!nationbuilder_oauth_url) return;
    window.open(nationbuilder_oauth_url, "Popup", "width=800,height=800");
    setNbResponse(null);
  }, [nationbuilder_oauth_url]);

  useEffect(() => {
    if(!integrations || !integrations.results) return;
    integrations.results.forEach(integration => {
      if(integration.integration_type==='NATION_BUILDER') {
        setNationbuilderState(integration);
      }
    });
  }, [integrations]);

  return (
    <div>
      <Card>
        <Tabs/>
      </Card>
      <div className="create-new-page">
        <Button
          type="primary"
          disabled={!facebook_oauth_url}
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
            {nationbuilderState ?
              (nationbuilderState.is_expired) ? <Tag color="error">Expired</Tag> : <Tag color="success">Connected</Tag> : <React.Fragment/>
            }
            <Button
              type="primary"
              className="vms-connect"
              onClick={onClickConnectNationBuilder}
            >
              Connect Nation Builder
            </Button>
          </div>
        </Card>

      </Card>

      <Modal
        visible={visible}
        title="Enter Your NationBuilder Slug"
        okButtonProps={{}}
        onOk={form.submit}
        onCancel={handleCancel}
      >
        <Form form={form} onFinish={handleOk}>
          <Form.Item label="Slug" name="slug" rules={[{required: true}]}>
            <Input.TextArea
              placeholder="Enter you nation builder slug."
              autoSize={{minRows: 2, maxRows: 5}}/>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Settings;
