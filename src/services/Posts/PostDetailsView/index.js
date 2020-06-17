import React, {useEffect, useMemo, useState} from 'react';
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
import {Link, useParams} from "react-router-dom";
import {useFetch} from '../../../hooks';
import {postFetch} from '../../../actions';
import InterestedVolunteers from '../InterestedVolunteers';
import {formatRelativeTime, truncateString} from "../../../utils";
import {
    LinkOutlined,
} from '@ant-design/icons';


const {TextArea} = Input;

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

const PostDetailsView = () => {
  const {id} = useParams();
  const [postResponse, setPostResponse] = useFetch(`/api/posts/${id}/`);
  const [notification_response, setNotificationResponse] = useFetch(`/api/posts/${id}/notifications/`);
  const [showModal, setShowModal] = useState(false);
  const [modalValue, setModalValue] = useState('');
  const [newNotificationFetch, setNewNotificationFetch] = useState(false);

  const post = useMemo(() => {
    if (!postResponse) return {};
    return postResponse;
  }, [postResponse]);

  const tableData = useMemo(() => {
    if (!notification_response) return [];
    return notification_response.map(r => ({...r, key: r.id}));
  }, [notification_response]);

  useEffect(() => {
    if (newNotificationFetch) {
      fetch(`/api/posts/${id}/notifications/`, {
        headers: {'Authorization': `Token ${localStorage.getItem('token')}`}
      })
        .then(results => {
          return results.json();
        })
        .then(response => {
          setNotificationResponse(response);
          return response;
        });
      setNewNotificationFetch(false);
    }
  }, [newNotificationFetch, id, setNotificationResponse]);

  const onModalOk = () => {
    const postData = {
      'post': id,
      'message': modalValue
    };
    postFetch(`/api/notifications/`, postData).then(() => {
      setNewNotificationFetch(true);
      setModalValue('');
      setShowModal(false);
    }).catch(error => {
      console.log('error', error);
    });
  };




  return (
    <React.Fragment>
      <PageHeader
        onBack={() => window.history.back()}
        title="Post Details"
        tags={[
          <Tag color="success" key="tag1">Published</Tag>,
          post.signup ? <Tag color="processing" key="tag2">Linked with Sign Up</Tag> : null
        ]}/>

      <Card
        title="Post Details"
        extra={
          <Space>
            {post.signup ? <Button><Link to={`/signups/${post.signup}/`}>View Sign Up</Link></Button> : null}
            <Button><a target="_blank" rel="noopener noreferrer"
                 href={`https://facebook.com/${post.facebook_page_id}/posts/${post.facebook_post_id}`}><LinkOutlined/> View
                  on Facebook</a></Button>
          </Space>
        }>
        <Descriptions>
          <Descriptions.Item label="Facebook Link">
            <Typography.Paragraph copyable>
              {`https://facebook.com/${post.facebook_page_id}/posts/${post.facebook_post_id}`}
            </Typography.Paragraph>
          </Descriptions.Item>
        </Descriptions>

        <div className="fb-post-embed-wrapper">
          <div className="fb-post-embed">
            <Card>
              <Skeleton loading={!postResponse} avatar active>
                <Card.Meta
                  avatar={<Avatar src={`https://graph.facebook.com/${post.facebook_page_id}/picture`}/>}
                  title={post.page_name}
                  description={(
                    <div>
                      <Typography.Text type="secondary">{formatRelativeTime(post.created_at)}</Typography.Text>
                      <br/>
                      <br/>
                      <Typography.Paragraph
                        ellipsis={{rows: 10, expandable: true}}>
                        {post.status}
                      </Typography.Paragraph>
                    </div>)}/>
              </Skeleton>
            </Card>
          </div>
        </div>
      </Card>

      <br/>

      <Row gutter={16}>
        <Col span={12}>
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
        </Col>

        <Col span={12}>
          <InterestedVolunteers id={id}/>
        </Col>
      </Row>

      <div>
        <Modal
          title="Send update to all volunteers of this event"
          visible={showModal}
          onOk={onModalOk}
          onCancel={() => setShowModal(false)}>
          <TextArea
            value={modalValue}
            onChange={e => setModalValue(e.target.value)}
            placeholder="What do you want to share?"
            autoSize={{minRows: 3, maxRows: 5}}/>
        </Modal>
      </div>
    </React.Fragment>);
};

export default PostDetailsView;
