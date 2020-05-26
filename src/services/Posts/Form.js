import React from 'react';
import { Form, Input, Button, Select } from 'antd';
const {Option} = Select;

const PostForm = props => {
  const {onSubmit = () => {}, initialValues={}, pages=[]} = props;

  return (
    <React.Fragment>
      <Form name="basic" initialValues={initialValues} onFinish={onSubmit} layout="vertical">
        <Form.Item name="page" label="Page" rules={[{ required: true }]}>
          <Select placeholder="Select a Page to give post" allowClear >
            {pages.map(page => {
              return <Option value={page.id} key={page.id}>{page.name}</Option>;
            })}
          </Select>
        </Form.Item>

        <Form.Item label="Status" name="status" rules={[{required: true}]}>
          <Input.TextArea rows={6}/>
        </Form.Item>

        <Form.Item label="Message For new Volunteer" name="message_for_new_volunteer" rules={[{required: true}]}>
          <Input.TextArea rows={4}/>
        </Form.Item>

        <Form.Item label="Message For Returning Volunteer" name="message_for_returning_volunteer" rules={[{required: true}]}>
          <Input.TextArea rows={4}/>
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
