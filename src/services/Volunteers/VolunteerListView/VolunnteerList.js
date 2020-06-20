import React, {useCallback, useEffect, useState} from 'react';
import {Avatar, Button, Spin, Table, Typography} from 'antd';
import {MessengerIcon, NationBuilderIcon} from '../../../assets/icons';
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
      <div className="action">
        <a
          href={`https://www.facebook.com/${record.facebook_page_id}/inbox/`}
          target="_blank"
          rel="noopener noreferrer">
          <Button type="primary" className="messenger-btn">
            <MessengerIcon/>
            Messenger
          </Button>
        </a>
        {record.integrations.map((integration, indx) => {
          if(integration.integration_type !== 'NATION_BUILDER') return <React.Fragment/>;
          console.log("integration", integration);
          return (
            <a
              key={indx}
              href={`https://${integration.integration_data}.nationbuilder.com/admin/signups/${integration.data}`}
              target="_blank"
              rel="noopener noreferrer">
              <Button type="default" className="messenger-btn">
                <NationBuilderIcon/>
                View Profile
              </Button>
            </a>);
        })}
      </div>
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

  console.log("data", data);
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
    />
  );
};

export default VolunteerListPerPage;
