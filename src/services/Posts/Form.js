import React from 'react';
import { Form, Input, Button, Select } from 'antd';
const {Option} = Select;

const PostForm = props => {
  const {onSubmit = () => {}, initialValues={}} = props;

  return (
    <React.Fragment>
      <Form name="basic" initialValues={initialValues} onFinish={onSubmit}>
        <Form.Item name="page" label="Page" rules={[{ required: true }]}>
          <Select placeholder="Select a Page to give post" allowClear >
            <Option value="F9.wink">F9.wink</Option>
            <Option value="page1">page1</Option>
            <Option value="page2">page2</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Status" name="status" rules={[{required: true}]}>
          <Input.TextArea />
        </Form.Item>

        <Form.Item >
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </React.Fragment>
  );
};

export default PostForm;
