import React, {useEffect, useState} from "react";
import {Button, Card, PageHeader, Popconfirm, Space, Spin, Tag} from "antd";
import {Link, useParams} from "react-router-dom";
import useFetch from 'use-http';
import SignUpForm from '../SignUpForm';

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
      <PageHeader
        onBack={() => window.history.back()}
        title="Sign Up Details"
        tags={[
          <Tag color={signup.disabled ? "warning" : "processing"}
               key="tag2">{signup.disabled ? "Stopped Collecting Response" : "Collecting Response"}</Tag>
        ]}/>
      <Card
        title="Sign Up Details"
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
              <Link to={`/signups/${props.match.params.id}/edit`}>Edit</Link>
            </Button>
          </Space>}>
          <SignUpForm editable={false}/>
       
      </Card>
      <br/>

      <Card title="Posts">
      </Card>

      <br/>

      <Card title="Sent Updates">
      </Card>

      <br/>

      <Card title="Confirmed Volunteers (0)">
      </Card>

    </div>
  );
}