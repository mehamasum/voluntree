import React, {useEffect, useState} from "react";
import {Button, Checkbox, Divider, Form, Input, message, Select, Spin} from 'antd';
import useFetch from "use-http";
import Magic from "../../components/Magic";
import {TIMEZONES} from "../../utils";

const onSuccess = () => {
  message.success('Settings are saved');
};

const layout = {
  labelCol: {
    span: 4,
  },
  wrapperCol: {
    span: 20,
  },
};
const tailLayout = {
  wrapperCol: {
    offset: 4,
  },
};

const OrgSettings = () => {
  const [org, setOrg] = useState(null);
  const [saving, setSaving] = useState(false);
  const {get, patch} = useFetch(`/api/organizations`, {
    headers: {
      'Authorization': `Token ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });

  useEffect(() => {
    get('/').then(response => {
      setOrg(response.results[0]);
    });
  }, []);


  const onFinish = values => {
    console.log('Success:', values);
    setSaving(true);
    patch(`/${org.id}/`, values).then(res => {
      setOrg(org => ({...org, res}));
      setSaving(false);
      onSuccess();
    });
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  if (!org) return <Spin/>;

  return (
    <Form
      {...layout}
      name="basic"
      initialValues={{
        ...org,
        language: 'en',
      }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >

      <Divider orientation="left">Language and Timezone</Divider>

      <Form.Item
        name="language"
        label="Language"
      >
        <Select>
          <Select.Option value="en">English</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="timezone"
        label="Timezone"
      >
        <Select showSearch>
          {TIMEZONES.map(tz => <Select.Option value={tz}>{tz}</Select.Option>)}
        </Select>
      </Form.Item>

      <Divider orientation="left">Volunteer Settings</Divider>

      <Form.Item
        {...tailLayout}
        name="volunteer_verification"
        valuePropName="checked"
        extra={<>If checked, Voluntree will verify the email address of each volunteer when they sign up.<br/>
          Note that, email verification must be ON to create volunteer account in your integrations.</>}
      >
        <Checkbox>Verify email at sign up</Checkbox>
      </Form.Item>


      <Form.Item
        label="Requirements"
        name="volunteer_info"
        extra={<> <Magic/>This will help Voluntree to automatically reply to frequently asked questions </>}
      >
        <Input.TextArea rows={6} placeholder="What are the requirements for a volunteer?"/>
      </Form.Item>

      <Divider orientation="left">Payment Settings</Divider>

      <Form.Item
        label="Payment Info"
        name="payment_info"
        extra={<> <Magic/>This will help Voluntree to automatically reply to frequently asked questions </>}
      >
        <Input.TextArea rows={6} placeholder="How can people make donations/payments?"/>
      </Form.Item>

      <Form.Item {...tailLayout}>
        <Button type="primary" htmlType="submit" loading={saving}>
          Save
        </Button>
      </Form.Item>
    </Form>
  );
};

export default OrgSettings;