import React, { useCallback, useMemo, useState } from 'react';
import { Card, Layout, Alert } from 'antd';
import { useHistory } from "react-router-dom";
import { useFetch } from '../../../hooks';
import PostFrom from '../Form';

const PostCreateView = () => {
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
      <Layout.Content className="center-content">
        <Card title="Create New Post">
          {errorMsg && <Alert message={errorMsg} type="error" banner closable/> }
          <PostFrom onSubmit={onSubmit} pages={pages} loading={loading}/>
        </Card>
      </Layout.Content>
    </React.Fragment>
  );
};

export default PostCreateView;
