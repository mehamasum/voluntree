import React, { useCallback } from 'react';
import AuthenticatedLayout from '../../Layouts';
import { Card } from 'antd';
import { Layout } from 'antd';
import PostFrom from '../Form';
const { Content } = Layout;

const PostCreateView = props => {

  const onSubmit = useCallback(values => {
    console.log("onSubmit", values);
  }, []);

  return (
    <React.Fragment>
      <AuthenticatedLayout>
        <Content className="center-content">
          <Card title="Create Post" style={{width: '50%', height: '50%'}}>
            <PostFrom onSubmit={onSubmit}/>
          </Card>
        </Content>
      </AuthenticatedLayout>
    </React.Fragment>
  );
};

export default PostCreateView;
