import './style.css';
import React, { useEffect, useState } from 'react';
import { Layout, Card, Spin, Space } from 'antd';
import { useLocation } from "react-router-dom";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const FacebookLogin = () => {
  const code = useQuery().get('code');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if(!code) return;
    fetch('/api/facebook/verify_oauth/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${localStorage.getItem('token')}`},
      body: JSON.stringify({'code': code})
    })
    .then(response => response.status)
    .then(status => {
      setStatus(status);
      setLoading(false);
    })
  }, [code]);

  useEffect(() => {
    if(!status) return;
    let message = "";
    if(status !== 204) message = "Failed";
    else message = "Success";
    setMessage(message);
    setTimeout(() => {
      window.opener.location.reload();
      window.close();
    }, 1000);
  }, [status]);

  return (
    <Layout style={{height:"100vh"}} className="middle-align">
      <Layout.Content className="middle-align">
        <Card title="Facebook Login" style={{ width: 300 }}>
          <Space size="middle">
            <Spin size="large" spinning={loading}/>
          </Space>
          <h2>{message}</h2>
        </Card>
      </Layout.Content>
    </Layout>
  );
};

export default FacebookLogin;
