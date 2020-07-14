import './form.css';
import post from '../../assets/post.png';
import React, {useState} from 'react';
import {Button, Checkbox, Col, Form, Input, message, Row, Select, Typography} from 'antd';
import Magic from "../../components/Magic";
import FileUploader from "../../components/FileUploader";

const {Option} = Select;


const PostForm = props => {
  const [form] = Form.useForm();
  const [showAttachInfo, setShowAttachInfo] = useState(false);
  const [selected, setSelected] = useState([]);
  const {onSubmit, initialValues = {}, pages, signups, loading} = props;

  const onSignupSelect = value => {
    setShowAttachInfo(!!value);
  }

  const fileUploaderProps = {
    name: 'file',
    action: '/api/uploads/',
    headers: {'Authorization': `Token ${localStorage.getItem('token')}`},
    onChange(info) {
      setSelected(info.fileList.slice(-1));
      if (info.file.status === 'done') {
        message.success(`File uploaded successfully`);
        form.setFieldsValue({
          upload: info.file.response.id,
        });
      } else if (info.file.status === 'error') {
        message.error(`File upload failed.`);
        console.log('File upload err', info)
      }
    },
    beforeUpload(file) {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('You can only upload JPG/PNG file!');
      }
      const isLt1M = file.size / 1024 / 1024 < 1;
      if (!isLt1M) {
        message.error('Image must smaller than 1MB!');
      }
      return isJpgOrPng && isLt1M;
    },
    accept: 'image/jpg,image/png',
    onRemove(file) {
      form.setFieldsValue({
        upload: null,
      });
    }
  };

  return (
    <React.Fragment>
      <Form name="basic" initialValues={initialValues} onFinish={onSubmit} layout="vertical" form={form}>
        <Row>
          <Col span={12} className="post-form">
            <Form.Item name="page" label="Select Page" rules={[{required: true}]}>
              <Select placeholder="Which page do you want to post to?" allowClear>
                {pages.map(page => {
                  return <Option value={page.id} key={page.id}>{page.name}</Option>;
                })}
              </Select>
            </Form.Item>

            <Form.Item label="Status" name="status" rules={[{required: true}]}>
              <Input.TextArea rows={6} placeholder="What do you want to share?"/>
            </Form.Item>

            <Form.Item label="Photo" rules={[{required: false}]}>
              <FileUploader {...fileUploaderProps} fileList={selected}/>
            </Form.Item>

            <Form.Item label="Photo" name="upload" rules={[{required: false}]} hidden>
              <Input type="hidden" value={100}/>
            </Form.Item>

            <Form.Item
              name="signup"
              label="Attach to Signup"
              extra={<> <Magic/>This will help Voluntree to automatically reply to frequently asked questions </>}
            >
              <Select placeholder="Select a signup if you want to collect sign up" allowClear onChange={onSignupSelect}>
                {signups.map(signup => {
                  return <Option value={signup.id} key={signup.id}>{signup.title}</Option>;
                })}
              </Select>
            </Form.Item>

            {showAttachInfo ? <Form.Item
              name="append_signup_info"
              valuePropName="checked"
              extra="If checked, Voluntree will concatenate date-time and slot info under the post"
            >
              <Checkbox>Attach Sign Up Info</Checkbox>
            </Form.Item> : null}

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
