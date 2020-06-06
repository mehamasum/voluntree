import React, {useState} from "react";
import {Button, Card, Modal, Table, Input} from "antd";
import {useHistory} from "react-router-dom";

export default function SignUpListView() {
  const [visible, setVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [modalValue, setModalValue] = useState('');
  const history = useHistory();


  const handleOk = () => {
    setCreating(true);
    window.setTimeout(() => {
      setCreating(false);
      const createdSignUpId = 'aaa';
      history.push(`/signups/${createdSignUpId}/edit`);
    }, 3000);
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
        onOk={handleOk}
        okButtonProps={{loading: creating}}
        onCancel={handleCancel}
      >
        <Input.TextArea
          value={modalValue}
          onChange={e => setModalValue(e.target.value)}
          placeholder="What is the title for your form?"
          autoSize={{minRows: 2, maxRows: 5}}/>
      </Modal>
    </div>
  );
}