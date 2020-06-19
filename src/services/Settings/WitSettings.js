import React from "react";
import { Button, Form, Select} from 'antd';

const WitSettingsForm = ({readOnly}) => {
  const [form] = Form.useForm();

  const onFinish = values => {
    console.log(values);
  };


  return (
    <Form form={form} name="control-hooks" onFinish={onFinish}>


      <Form.Item>
        <Button type="primary" htmlType="submit" disabled={readOnly}>
          Save Page Settings
        </Button>
      </Form.Item>
    </Form>
  );
};

export default WitSettingsForm;