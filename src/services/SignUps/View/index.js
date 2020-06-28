import React, {useEffect, useState} from "react";
import {Button, Card, Popconfirm, Space, Spin, Tabs, Tag} from "antd";
import {Link, useParams} from "react-router-dom";
import SendUpdatesView from './SendUpdatesView';
import useFetch from 'use-http';
import SignUpForm from '../SignUpForm';
import InterestedVolunteers from "../InterestedVolunteers";
import PostListView from "../../Posts/PostListView";

const {TabPane} = Tabs;


export default function SignUpView(props) {
  const {id} = useParams();
  const [signup, setSignup] = useState(null);
  const {get, post} = useFetch(`/api/signups/${id}`, {
    headers: {'Authorization': `Token ${localStorage.getItem('token')}`}
  }, [id]);

  useEffect(() => {
    get('/').then(response => {
      setSignup(response);
    });
  }, [])


  const onDisableClick = () => {
    post(`/disable/`).then(response => {
      console.log(response)
      setSignup(prev => ({...prev, disabled: true}))
    })
  };

  if (!signup) return <Spin/>;

  return (
    <div>
      <Card
        title={
          <Space>
            Sign Up Details
            <Tag color={signup.disabled ? "warning" : "processing"}
                 key="tag2">{signup.disabled ? "Stopped Collecting Response" : "Collecting Response"}</Tag>
          </Space>
        }
        extra={
          <Space size="middle">
            {signup.disabled ? null :
              <Popconfirm
                title="Are you sure? This can not be undone."
                onConfirm={onDisableClick}
                okText="Yes"
              >
                <Button danger>Stop Collecting Response</Button>
              </Popconfirm>}
            <Button type="primary">
              <Link to={`/signups/${id}/edit`}>Edit</Link>
            </Button>
          </Space>}>

        <Tabs defaultActiveKey="1">
          <TabPane tab="Details" key="1">
            <SignUpForm editable={false}/>
          </TabPane>
           <TabPane tab="Posts" key="2">
            <PostListView fetchUrl={`/api/signups/${id}/posts/?limit=25&offset=`}/>
          </TabPane>
          <TabPane tab="Sent Updates" key="3">
            <SendUpdatesView signUpId={id}/>
          </TabPane>
          <TabPane tab="Volunteers" key="4">
            <InterestedVolunteers id={id}/>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}
