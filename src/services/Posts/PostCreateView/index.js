import React, { useCallback, useMemo, useState } from 'react';
import { useHistory } from "react-router-dom";
import Template from '../../../template';
import { Spin, Space } from 'antd';
import { useFetch } from '../../../hooks';
import { Card } from 'antd';
import { Layout } from 'antd';
import { Alert } from 'antd';
import PostFrom from '../Form';
const { Content } = Layout;

const PostCreateView = props => {
  const history = useHistory();
  const [pages_response] = useFetch('/api/voluntree/pages/?limit=100');
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(values => {
    let status = null;
    setLoading(true);
    fetch('/api/voluntree/posts/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${localStorage.getItem('token')}`},
      body: JSON.stringify(values)
    })
    .then(response => {
      status = response.status;
      return response.json();
    })
    .then(result => {
      setLoading(false);
      if(status===201) history.push("/posts");
      else {
        setErrorMsg(result.error.message);
      }
    })
    .catch(err => {
      console.log("err", err);
    });
  }, [history]);

  const pages = useMemo(() => {
    if(!pages_response) return [];
    return pages_response.results;
  }, [pages_response]);

  return (
    <React.Fragment>
      <Card title="Create Post" style={{width: '50%', height: '50%'}}>
        <Space size="middle">
          <Spin size="large" spinning={loading}/>
        </Space>
        {errorMsg &&
        <Alert message={errorMsg} type="error" banner closable/> }
        <PostFrom onSubmit={onSubmit} pages={pages}/>
      </Card>
    </React.Fragment>
  );
};

export default PostCreateView;
