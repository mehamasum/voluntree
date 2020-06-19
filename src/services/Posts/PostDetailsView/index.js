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
          <InterestedVolunteers id={id}/>
        </Col>
      </Row>
    </React.Fragment>);
};

export default PostDetailsView;
