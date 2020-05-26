import React, {useEffect, useMemo, useState, useCallback} from 'react';
import { useFetch } from '../../../hooks';
import { Table, Space, Card, Layout } from 'antd';
import { Avatar } from 'antd';
import { Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
const { Content } = Layout;


const columns = [
  {
    title: 'Facebook user id',
    dataIndex: 'facebook_user_id',
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
        <Card title="Volunteers" style={{width: '50%'}}>
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
