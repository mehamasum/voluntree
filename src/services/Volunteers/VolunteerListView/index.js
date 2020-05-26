import React, {useEffect, useMemo, useState, useCallback} from 'react';
import { useFetch } from '../../../hooks';
import {Table, Space, Card, Layout, Button, Avatar, Typography} from 'antd';
import {formatTime} from "../../../utils";
const { Content } = Layout;


const columns = [
  {
    title: 'Name',
    render: (text, record) => (
        <div>
          <Avatar icon={"F"}/>&nbsp;&nbsp;
          <Typography.Text>Facebook User</Typography.Text>
        </div>
    )
  },
  {
    title: 'Actions',
    render: (text, record) => (
        <Button type="primary" className="messenger-btn">
          <svg className="messenger-icon" width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd"><path d="M12 0c-6.627 0-12 4.975-12 11.111 0 3.497 1.745 6.616 4.472 8.652v4.237l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111 0-6.136-5.373-11.111-12-11.111zm1.193 14.963l-3.056-3.259-5.963 3.259 6.559-6.963 3.13 3.259 5.889-3.259-6.559 6.963z"/></svg>
          Messenger
        </Button>
    )
  },
];


const VolunteerListView = props => {
  const [volunteers_response,, setUrl] = useFetch('api/voluntree/volunteers/?limit=25&offset=0');
  const [pagination, setPagination] = useState({current: 1, pageSize: 25, showSizeChanger: false});
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
      <Content className="center-content">
        <Card title="Connected Volunteers">
          <Table
            columns={columns}
            dataSource={tableData}
            pagination={{...pagination, total}}
            onChange={onChangeTable}
            scroll={{y: 500 }}/>
          </Card>
      </Content>
    </React.Fragment>
  );
};

export default VolunteerListView;
