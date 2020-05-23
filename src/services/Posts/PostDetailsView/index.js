import React, { useMemo } from 'react';
import Template from '../../../template';
import { useParams } from "react-router-dom";
import { useFetch } from '../../../hooks';
import { Card } from 'antd';
import { Alert } from 'antd';
import { Layout } from 'antd';
const { Content } = Layout;

const PostEditView = props => {
  const {id} = useParams();
  const [post_response, , , ,status] = useFetch(`/api/voluntree/posts/${id}`);

  const post = useMemo(() => {
    if(!post_response) return {};
    return post_response;
  }, [post_response]);

  return (
    <React.Fragment>
      <Template {...props}>
        <Content className="center-content">
          <Card title="Details View" style={{width: '50%', height: '50%'}}>
            {status===404 && <Alert message={"No Record Found"} type="error" banner closable/> }
            <h1>Details view post: {id}</h1>
            <h2>Details view post: {post.page_name}</h2>
            <p>Details view status: {post.status}</p>
          </Card>
        </Content>
      </Template>
    </React.Fragment>
  );
};

export default PostEditView;
