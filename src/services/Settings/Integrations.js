import React, {useEffect, useState} from "react";

import {Button, Card, Form, Input, Modal, Space, Tag} from 'antd';
import {useFetch} from "../../hooks";
import _ from 'lodash';

import nationbuilder from "../../assets/icons/nationbuilder.svg";
import kindful from "../../assets/icons/kindful.svg";

const IntegrationsTab = () => {
  const [integrationInfo, setIntegrationInfo] = useState([
    {
      type: 'NATION_BUILDER',
      name: 'Nation Builder',
      logo: nationbuilder,
      connected: false,
      is_expired: false,
      ready: true,
    },
    {
      type: 'KINDFUL',
      name: 'Kindful',
      logo: kindful,
      connected: false,
      is_expired: false,
      ready: false,
    }
  ]);
  const [nationbuilder_oauth_url, setNbResponse, setNationBuilderOauthUrl] = useFetch();
  const [integrations] = useFetch('/api/integrations/');
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();

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
    if (!nationbuilder_oauth_url) return;
    window.open(nationbuilder_oauth_url, "Popup", "width=800,height=800");
    setNbResponse(null);
  }, [nationbuilder_oauth_url]);

  useEffect(() => {
    if (!integrations || !integrations.results) return;

    const cloned = _.clone(integrationInfo);

    integrations.results.forEach(integration => {
      const match = _.find(cloned, 'type', [integration.integration_type]);
      match.connected = true;
      match.is_expired = integration.is_expired;
    });
    setIntegrationInfo(cloned);
  }, [integrations]);


  return (
    <div className="vms-list">
      <Space>
        {integrationInfo.map(integration => (
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
                    integration.is_expired ? <Tag color="error">Expired</Tag> : <Tag color="success">Connected</Tag>
                  ) : <Tag>Not Connected</Tag>
                }
              </div>
              <br/>
              <div>
                <Button
                  type="primary"
                  className="vms-connect"
                  disabled={!integration.ready}
                  onClick={onClickConnectNationBuilder}
                >
                  Connect {integration.name}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </Space>

      <Modal
        visible={visible}
        title="What is the name of your NationBuilder site?"
        okButtonProps={{}}
        onOk={form.submit}
        onCancel={handleCancel}
      >
        <Form form={form} onFinish={handleOk}>
          <Form.Item
            label="Slug"
            name="slug"
            rules={[{required: true}]}
            extra="A slug is the “name” of your NationBuilder site. For example, my site is awesome.nationbuilder.com - so “awesome” is my slug."
          >
            <Input
              placeholder="Enter you nation builder slug"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}


export default IntegrationsTab;