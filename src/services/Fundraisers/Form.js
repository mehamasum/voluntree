import './form.css';
import React from 'react';
import {useHistory} from 'react-router-dom';
import {Button, Form, Input} from 'antd';
import TinyEditor from '../../components/TinyEditor';


const FundraiserForm = props => {
  const {onSubmit, initialValues = {}, loading} = props;
  const history = useHistory();

  return (
    <React.Fragment>
      <Form name="basic"  initialValues={initialValues} onFinish={onSubmit} layout="vertical">

        <Form.Item label="Slug" name="slug" rules={[{required: true}]}>
          <Input placeholder="Input Your Fundraiser Slug"/>
        </Form.Item>

        <Form.Item label="Story" name="story" rules={[{required: true}]}>
          <TinyEditor />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" className="submit-funraiser" loading={loading}>
            Create Fundraiser
          </Button>

          <Button htmlType="button" className="submit-funraiser" onClick={() => history.goBack()}>
              Cancel
          </Button>
        </Form.Item>
      </Form>
    </React.Fragment>
  );
};

export default FundraiserForm;
