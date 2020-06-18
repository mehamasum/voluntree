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

const PaymentSettings = () => {
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
        label="Payment Info"
        name="payment_info"
        rules={[
          {
            required: true,
            message: 'Describe how people can make donations/payments',
          },
        ]}
        extra="This will help Voluntree to automatically reply to frequently asked questions"
      >
        <Input.TextArea rows={5} placeholder="How can people make donations/payments?"/>
      </Form.Item>

      <Form.Item {...tailLayout}>
        <Button type="primary" htmlType="submit">
          Save
        </Button>
      </Form.Item>
    </Form>
  );
};

export default PaymentSettings;