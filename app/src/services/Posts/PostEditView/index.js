import React, { useCallback } from 'react';
import { Card } from 'antd';
import PostFrom from '../Form';

const PostEditView = props => {
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
