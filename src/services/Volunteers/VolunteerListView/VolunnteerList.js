import React, {useCallback, useEffect, useState} from 'react';
import {Avatar, Button, Spin, Table, Typography, Rate} from 'antd';
import {MessengerIcon, NationBuilderIcon} from '../../../assets/icons';
import useFetch, { Provider } from 'use-http';
import {Link} from "react-router-dom";


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
    title: 'Avg. Rating',
    render: (text, record) => (
      <Rate disabled defaultValue={record.rating_sum/record.total_rating} />
    )
  },
  {
    title: 'Links',
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
          return (
            <a
              key={indx}
              href={`https://${integration.integration_data}.nationbuilder.com/admin/signups/${integration.data}`}
              target="_blank"
              rel="noopener noreferrer">
              <Button type="default" className="messenger-btn">
                <NationBuilderIcon/>
                NationBuilder Profile
              </Button>
            </a>);
        })}
      </div>
    )
  },
  {
    title: 'Actions',
    render: (text, record) => (
      <Link to={`/volunteers/${record.id}`}>Details</Link>
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
