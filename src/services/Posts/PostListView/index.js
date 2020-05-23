import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useFetch } from '../../../hooks';
import { Card } from 'antd';
import { Layout } from 'antd';
import { Link } from "react-router-dom";
import { Table, Space } from 'antd';
const { Content } = Layout;

const columns = [
  {
    title: 'Id',
    dataIndex: 'id',
  },
  {
    title: 'Page Name',
    dataIndex: 'page_name',
  },
  {
    title: 'Status',
    dataIndex: 'status',
  },
  {
    title: 'Action',
    render: (text, record) => (
      <Space size="middle">
        <Link to={`/posts/${record.id}`}>Details</Link>
      </Space>
    ),
  },
];

const PostListView = props => {
  const [posts_response,, setUrl] = useFetch('/api/voluntree/posts/?limit=25&offset=0');
  const [pagination, setPagination] = useState({current: 1, pageSize: 25, showSizeChanger: false});

  const tableData = useMemo(() => {
    if(!posts_response) return [];
    return posts_response.results.map(r => ({...r, key: r.id}));
  }, [posts_response]);

  const onChangeTable = useCallback((pag) => {
    setPagination(pag);
    const offset = (pag.current -1) * 25;
    setUrl(`/api/voluntree/posts/?limit=25&offset=${offset}`);
  }, [setPagination, setUrl]);

  useEffect(() => {
    if(!posts_response) return;
    setPagination({...pagination, total: posts_response.count});
  }, [posts_response]);

  return (
    <React.Fragment>
        <Content className="center-content">
          <Card title="Post List view" style={{width: '50%', height: '50%'}}>
            <Link to={`/posts/create`}>Post new</Link>
            <Table columns={columns} dataSource={tableData} pagination={pagination} onChange={onChangeTable}/>
          </Card>
        </Content>
    </React.Fragment>
  );
};

export default PostListView;
