import React, {useEffect, useMemo, useState, useCallback} from 'react';
import {Table, Card, Layout, Button, Avatar, Typography} from 'antd';
import { useFetch } from '../../../hooks';
import {MessengerIcon} from '../../../assets/icons';


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


const VolunteerListView = props => {
  const [volunteers_response,, setUrl] = useFetch(
  'api/voluntree/volunteers/?limit=25&offset=0');
  const [pagination, setPagination] = useState({
    current: 1, pageSize: 25, showSizeChanger: false});
  const [total, setTotal] = useState(0);

  const tableData = useMemo(() => {
    if(!volunteers_response) return [];
    return volunteers_response.results.map(r => ({...r, key: r.id}));
  }, [volunteers_response]);

  const onChangeTable = useCallback((pag) => {
    setPagination(pag);
    const offset = (pag.current -1) * 25;
    setUrl(`api/voluntree/volunteers/?limit=25&offset=${offset}`);
  }, [setPagination, setUrl]);

  useEffect(() => {
    if(!volunteers_response) return;
    setTotal(volunteers_response.count);
  }, [volunteers_response]);

  return (
    <React.Fragment>
      <Layout.Content className="center-content">
        <Card title="Connected Volunteers">
          <Table
            columns={columns}
            dataSource={tableData}
            pagination={{...pagination, total}}
            onChange={onChangeTable}
            scroll={{y: 500 }}/>
          </Card>
      </Layout.Content>
    </React.Fragment>
  );
};

export default VolunteerListView;
