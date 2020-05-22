import React from 'react';
import AuthenticatedLayout from '../../Layouts';
import { useParams } from "react-router-dom";
import { Card } from 'antd';
import { Layout } from 'antd';
const { Content } = Layout;

const PostEditView = props => {
  const {id} = useParams();

  console.log("post id", id);
  return (
    <React.Fragment>
      <AuthenticatedLayout>
        <Content className="center-content">
          <Card title="Edit Post" style={{width: '50%', height: '50%'}}>
            <h1>Details view post: {id}</h1>
          </Card>
        </Content>
      </AuthenticatedLayout>
    </React.Fragment>
  );
};

export default PostEditView;
