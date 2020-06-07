import React, {useState} from "react";
import {Button, Card, Modal, Table, Input, Form} from "antd";
import {useHistory} from "react-router-dom";

export default function SignUpListView() {
  const [visible, setVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [modalValue, setModalValue] = useState('');
  const history = useHistory();
  const [form] = Form.useForm();


  const handleOk = (values) => {
    console.log("values", values);
    setCreating(true);
    let status = null;
    fetch('/api/signups/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${localStorage.getItem('token')}`},
      body: JSON.stringify(values)
    })
    .then(response => {
      status = response.status;
      return response.json();
    })
    .then(result => {
      setCreating(false);
      if(status===201) history.push(`/signups/${result.id}/edit`);
    })
    .catch(err => {
      console.log("err", err);
    });

    /*
    window.setTimeout(() => {
      setCreating(false);
      const createdSignUpId = 'aaa';
      history.push(`/signups/${createdSignUpId}/edit`);
    }, 3000);*/
  }

  const handleCancel = () => {
    setVisible(false);
  }

  return (
    <div>
      <Card title="Created Sign Ups" extra={
        <Button type="primary" onClick={() => setVisible(true)}>Create New Sign Up</Button>
      }>
        <Table/>
      </Card>
      <Modal
        visible={visible}
        title="Create a new Sign Up"
        okButtonProps={{loading: creating}}
        onOk={form.submit}
        onCancel={handleCancel}
      >
        <Form form={form} onFinish={handleOk}>
          <Form.Item label="Title" name="title" rules={[{required: true}]}>
            <Input.TextArea
              placeholder="What is the title for your form?"
              autoSize={{minRows: 2, maxRows: 5}}/>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
