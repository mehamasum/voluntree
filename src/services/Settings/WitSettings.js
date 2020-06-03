import React from "react";
import { Button, Form, Select} from 'antd';

const WitSettingsForm = ({readOnly}) => {
  const [form] = Form.useForm();

  const onFinish = values => {
    console.log(values);
  };


  return (
    <Form form={form} name="control-hooks" onFinish={onFinish}>
      <Form.Item
        name="lang"
        label="Language"
      >
        <Select defaultValue="en" disabled={readOnly}>
          <Select.Option value="en">English</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="timezone"
        label="Timezone"
      >
        <Select defaultValue="America/Los_Angeles" disabled={readOnly}>
          <Select.Option value="America/Los_Angeles">Los Angeles (Pacific)</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" disabled={readOnly}>
          Save Page Settings
        </Button>
      </Form.Item>
    </Form>
  );
};

export default WitSettingsForm;