import React, {useCallback, useEffect, useState} from 'react';
import {Avatar, Button, Spin, Table, Typography} from 'antd';
import {MessengerIcon} from '../../../assets/icons';
import useFetch, { Provider } from 'use-http';


const columns = [
  {
    title: 'Name',
    render: (text, record) => (
      <div>
        <Avatar src={record.profile_pic}/>&nbsp;&nbsp;
        <Typography.Text>
          {record.first_name} {record.last_name}
        </Typography.Text>
      </div>
    )
  },
  {
    title: 'Actions',
    render: (text, record) => (
      <a
        href={`https://www.facebook.com/${record.facebook_page_id}/inbox/`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button type="primary" className="messenger-btn">
          <MessengerIcon/>
          Messenger
        </Button>
      </a>
    )
  },
];


const VolunteerListPerPage = props => {
  const [page, setPage] = useState(1)

  const { data = null, loading } = useFetch(`api/pages/${props.pageId}/volunteers/?limit=25&offset=${(page - 1) * 25}`, {
    onNewData: (oldData, newData) => newData,
    perPage: 25,
    headers: {'Authorization': `Token ${localStorage.getItem('token')}` }
  }, [page, props.pageId]);

  if (loading) return <Spin/>;

  return (
    <Table
      columns={columns}
      dataSource={data.results.map(r => ({...r, key: r.id}))}
      pagination={{
        current: page,
        pageSize: 25,
        showSizeChanger: false,
        total: data.count
      }}
      onChange={() => setPage(page + 1)}
      scroll={{y: 500}}/>
  );
};

export default VolunteerListPerPage;
