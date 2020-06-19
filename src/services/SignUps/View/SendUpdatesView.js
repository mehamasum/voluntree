import React, {useState, useEffect, useMemo} from 'react';
import {
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Input,
  Modal,
  PageHeader,
  Row,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography
} from 'antd';
import useFetch from 'use-http';
import {formatRelativeTime, truncateString} from "../../../utils";

const columns = [
  {
    title: 'Update',
    dataIndex: 'message',
    render: (text, record) => (
      <Typography.Text>
        {truncateString(record.message, 240)}
      </Typography.Text>
    )
  },
];

const SendUpdatesView = props => {
  const {signUpId} = props;
  const [showModal, setShowModal] = useState(false);
  const [modalValue, setModalValue] = useState('');
  const {get: getNotifications, data: notifications=[]} = useFetch(`/api/signups/${signUpId}/notifications/`, {
    cachePolicy: 'no-cache',
    headers: {'Authorization': `Token ${localStorage.getItem('token')}`}
  }, [signUpId]);
  const {post: createNotification, response} = useFetch(`/api/notifications/`, {
    headers: {'Authorization': `Token ${localStorage.getItem('token')}`}
  });

  const onModalOk = async () => {
    const postData = {
      'signup': signUpId,
      'message': modalValue
    };
    await createNotification('', postData);
    if(response.ok) {
      setShowModal(false);
      getNotifications();
    }
  };

  const tableData = useMemo(() => {
    return notifications.map(n => ({...n, key: n.id}));
  }, [notifications]);



  return (
    <React.Fragment>
      <Card
        title="Sent Updates"
        extra={
          <Button
            type="primary"
            className="messenger-btn"
            onClick={() => setShowModal(!showModal)}>
            Send New Update
          </Button>}>
          <Table columns={columns} dataSource={tableData}/>
      </Card>
      <div>
        <Modal
          title="Send update to all volunteers of this event"
          visible={showModal}
          onOk={onModalOk}
          onCancel={() => setShowModal(false)}>
          <Input.TextArea
            value={modalValue}
            onChange={e => setModalValue(e.target.value)}
            placeholder="What do you want to share?"
            autoSize={{minRows: 3, maxRows: 5}}/>
        </Modal>
      </div>
    </React.Fragment>
  );
};


export default SendUpdatesView;
