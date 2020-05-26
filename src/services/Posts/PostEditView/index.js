import React, { useCallback } from 'react';
import Template from '../../../template';
import { useParams } from "react-router-dom";
import { Card } from 'antd';
import { Layout } from 'antd';
import PostFrom from '../Form';
const { Content } = Layout;

const PostEditView = props => {
  const {id} = useParams();

  const onSubmit = useCallback(values => {
    console.log("onSubmit", values);
  }, []);

  return (
    <React.Fragment>
      <Card title="Edit Post" style={{width: '50%', height: '50%'}}>
        <PostFrom onSubmit={onSubmit} initialValues={{status: 'test'}}/>
      </Card>
    </React.Fragment>
  );
};

export default PostEditView;
