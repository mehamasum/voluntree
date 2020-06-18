import React from "react";
import { Form, Input, Button, Checkbox } from 'antd';

const layout = {
  labelCol: {
    span: 6,
  },
  wrapperCol: {
    span: 18,
  },
};
const tailLayout = {
  wrapperCol: {
    offset: 6,
  },
};

const VolunteerSettings = () => {
  const onFinish = values => {
    console.log('Success:', values);
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  return (
    <Form
      {...layout}
      name="basic"
      initialValues={{
        remember: true,
      }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <Form.Item
        label="Requirements"
        name="volunteer_requirements"
        rules={[
          {
            required: true,
            message: 'Describe requirements for a volunteer',
          },
        ]}
      >
        <Input.TextArea rows={2} placeholder="What are the requirements for a volunteer?"/>
        <small>This will help Voluntree to automatically reply to frequently asked questions</small>
      </Form.Item>

      <br/>

      <Form.Item
        {...tailLayout}
        name="volunteer_verification"
        valuePropName="checked"
        help="If checked, Voluntree will verify the email address of each volunteer when they sign up"
      >
        <Checkbox>Verify email at sign up</Checkbox>
      </Form.Item>

      <br/>

      <Form.Item {...tailLayout}>
        <Button type="primary" htmlType="submit">
          Save
        </Button>
      </Form.Item>
    </Form>
  );
};

export default VolunteerSettings;