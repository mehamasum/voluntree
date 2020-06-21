import React, {useCallback, useEffect, useMemo, useState} from "react";
import {Button, Card, Form, Input, Modal, Space, Table, Tag, Typography} from "antd";
import {Link, useHistory} from "react-router-dom";
import {useFetch} from '../../../hooks';
import {formatRelativeTime} from "../../../utils";

const columns = [
  {title: 'Title', dataIndex: 'title'},
  {title: 'Description', dataIndex: 'description'},
  {
    title: 'Created',
    dataIndex: 'created_at',
    render: (text, record) => (
      <Typography.Text>{formatRelativeTime(record.created_at)}</Typography.Text>
    )
  },
   {
        title: 'Collecting Response',
        render: (text, record) => (
          <Tag color={record.disabled? "warning":"processing"} key="tag2">{record.disabled? "No":"Yes"}</Tag>
        ),
    },
  {
    title: 'Actions',
    render: (text, record) => (
        <Space size="middle">
          <Link to={`/signups/${record.id}/`}>View</Link>
        </Space>
    ),
  },
];

export default function SignUpListView() {
  const [signUpsResponse, , setUrl] = useFetch(`/api/signups/?limit=25`);
  const [pagination, setPagination] = useState({current: 1, pageSize: 25, showSizeChanger: false});
  const [total, setTotal] = useState(0);
  const [visible, setVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [modalValue, setModalValue] = useState('');
  const history = useHistory();
  const [form] = Form.useForm();

  const tableData = useMemo(() => {
    if (!signUpsResponse) return [];
    return signUpsResponse.results.map(r => ({...r, key: r.id}));
  }, [signUpsResponse]);

  useEffect(() => {
    if (!signUpsResponse) return;
    setTotal(signUpsResponse.count);
  }, [signUpsResponse]);

  const onChangeTable = useCallback((pag) => {
    setPagination(pag);
    const offset = (pag.current - 1) * 25;
    setUrl(`/api/signups/?limit=25&offset=${offset}`);
  }, [setPagination, setUrl]);


  const handleOk = (values) => {
    console.log("values", values);
    setCreating(true);
    let status = null;
    fetch('/api/signups/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(values)
    })
      .then(response => {
        status = response.status;
        return response.json();
      })
      .then(result => {
        setCreating(false);
        if (status === 201) history.push(`/signups/${result.id}/edit`);
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
        <Table columns={columns} dataSource={tableData} pagination={{...pagination, total}}
               onChange={onChangeTable}/>
      </Card>
      <Modal
        visible={visible}
        title="Create a new Sign Up"
        okButtonProps={{loading: creating}}
        onOk={form.submit}
        onCancel={handleCancel}
      >
        <Form form={form} onFinish={handleOk} labelCol={{span: 6}}>
          <Form.Item label="Title" name="title" rules={[{required: true}]}>
            <Input
              placeholder="Provide an accurate title to increase relevancy"
            />
          </Form.Item>

          <Form.Item label="Description" name="description" rules={[{required: true}]}>
            <Input.TextArea
              placeholder="Provide a clear, well-defined and easy-to-understand description"
              autoSize={{minRows: 3, maxRows: 5}}/>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
