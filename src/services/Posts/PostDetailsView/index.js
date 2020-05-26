import React, { useMemo } from 'react';
import Template from '../../../template';
import { useParams } from "react-router-dom";
import { useFetch } from '../../../hooks';
import { Card, Space } from 'antd';
import { Alert, Typography } from 'antd';
import {
    LinkOutlined,
} from '@ant-design/icons';
import { Layout } from 'antd';
import InterestedVolunteers from '../InterestedVolunteers';
const { Content } = Layout;

const PostEditView = props => {
  const {id} = useParams();
  const [post_response, , , ,status] = useFetch(`/api/voluntree/posts/${id}`);
  const [interest_response,, setUrl] = useFetch(`/api/voluntree/posts/${id}/interests/`);
  
  const post = useMemo(() => {
    if(!post_response) return {};
    return post_response;
  }, [post_response]);

  return (
    <React.Fragment>
      <Card title="Details" style={{width: '50%', height: '50%'}} extra={
        <a target="_blank" rel="noopener noreferrer"
          href={`https://facebook.com/${post.facebook_page_id}/posts/${post.facebook_post_id}`}>

          <LinkOutlined/> View on Facebook</a>}>
            {status===404 && <Alert message={"No Record Found"} type="error" banner closable/> }
            <Typography.Title level={3}>Page Name: {post.page_name}</Typography.Title>
            <Typography.Title level={4}>status:</Typography.Title>
            <Typography.Text>{post.status}</Typography.Text>
            <InterestedVolunteers id={id} />
        </Card>
    </React.Fragment>
  );
};

export default PostEditView;
