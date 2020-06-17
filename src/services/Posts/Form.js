import './form.css';
import post from '../../assets/post.png';
import messenger from '../../assets/messenger.png';
import React from 'react';
import { Form, Input, Button, Select, Typography } from 'antd';
import { Row, Col, Divider } from 'antd';

const {Option} = Select;


const PostForm = props => {
  const {onSubmit = () => {}, initialValues={}, pages=[], signups=[], loading} = props;

  return (
    <React.Fragment>
      <Form name="basic" initialValues={initialValues} onFinish={onSubmit} layout="vertical">
        <Row>
          <Col span={12} className="post-form">
            <Divider orientation="left">Facebook Post</Divider>

            <Form.Item name="page" label="Select Page" rules={[{ required: true }]}>
              <Select placeholder="Which page do you want to post to?" allowClear >
                {pages.map(page => {
                  return <Option value={page.id} key={page.id}>{page.name}</Option>;
                })}
              </Select>
            </Form.Item>

            <Form.Item name="signup" label="Select Signup" rules={[{ required: true }]}>
              <Select placeholder="Which page do you want to post to?" allowClear >
                {signups.map(signup => {
                  return <Option value={signup.id} key={signup.id}>{signup.title}</Option>;
                })}
              </Select>
            </Form.Item>

            <Form.Item label="Status" name="status" rules={[{required: true}]}>
              <Input.TextArea rows={6} placeholder="What do you want to share?"/>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className="submit-post" loading={loading}>
                Create Post
              </Button>
            </Form.Item>
          </Col>
          <Col span={12} className="post-preview">
            <Typography.Text type="secondary">This will show up as a regular post on your page</Typography.Text>
            <img src={post} className="post-preview-img" alt="post-prev-img"/>
          </Col>
        </Row>

        <br/>
      </Form>
    </React.Fragment>
  );
};

export default PostForm;
