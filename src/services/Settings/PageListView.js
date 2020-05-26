import React, {useEffect, useMemo, useState, useCallback} from 'react';
import { useFetch } from '../../hooks';
import { Table, Space } from 'antd';
import { Avatar } from 'antd';
import { Typography } from 'antd';
import { Tag } from 'antd';

import { formatTime } from "../../utils";


const columns = [
  {
    title: 'Page Name',
    dataIndex: 'name',
    render: (text, record) => (
      <div>
        <Avatar
          src={`https://graph.facebook.com/${record.facebook_page_id}/picture`}
        />
        <Typography.Text>&nbsp; &nbsp;<a href={`https://facebook.com/${record.facebook_page_id}`} target='blank'>{record.name}</a></Typography.Text>
      </div>
    )
  },
  {
    title: 'Status',
    dataIndex: 'is_expired',
    render: (text, record) => (
      record.is_expired ? <Tag color="error">Expired</Tag> : <Tag color="success">Connected</Tag>
    )
  },
  {
    title: 'Expiry Date',
    dataIndex: 'is_expired',
    render: (text, record) => (
        <Typography.Text>{formatTime(record.page_expiry_token_date)}</Typography.Text>
    )
  }
];


const PageListView = props => {
  const [pages_response,, setUrl] = useFetch('/api/voluntree/pages/?limit=25&offset=0');
  const [pagination, setPagination] = useState({current: 1, pageSize: 25, showSizeChanger: false});
  const [total, setTotal] = useState(0);

  const tableData = useMemo(() => {
    if(!pages_response) return [];
    return pages_response.results.map(r => ({...r, key: r.id}));
  }, [pages_response]);

  const onChangeTable = useCallback((pag) => {
    setPagination(pag);
    const offset = (pag.current -1) * 25;
    setUrl(`/api/voluntree/pages/?limit=25&offset=${offset}`);
  }, [setPagination, setUrl]);

  useEffect(() => {
    if(!pages_response) return;
    setTotal(pages_response.count);
  }, [pages_response]);

  return (
    <React.Fragment>
      <Table
        columns={columns}
        dataSource={tableData}
        pagination={{...pagination, total}}
        onChange={onChangeTable}
        scroll={{y: 500 }}/>
    </React.Fragment>
  );
};

export default PageListView;
