import React, { useMemo, useState, useEffect } from 'react';
import { List, Avatar, Button, Space } from 'antd';
import { useFetch } from '../../../hooks';


const InterestedVolunteers = props => {
  const {id} = props;
  const host = process.env.REACT_APP_BACKEND_HOST;
  const [interest_response,, setUrl] = useFetch(`/api/voluntree/posts/${id}/interests/`);
  const [listData, setListData] = useState(interest_response ? interest_response.results : []);
  useEffect(()=> {
    const endPoint = 'ws://localhost:8000' + `/ws/volunteers/${id}/`;
    const ws = new WebSocket(endPoint);
    ws.onerror = (e) => {
      console.log('error', e);
    }
  
    ws.onmessage = (e) => {
      console.log('message', e);
    }
  
    ws.onopen = (e) => {
      console.log('onopen', e);
    }
  
    ws.onclose = (e) => {
      console.log('onclose', e);
    }

  },[]);

  useEffect(() => {
    if(interest_response) {
    setListData(interest_response.results);
    }
  }, [interest_response && interest_response.results])

 

const footer = (nxtUrl, prvUrl, onClickAction) => {
  return (
    <div style={{ textAlign: 'right'}}>
      <Space>
        <Button type="primary" size="middle" disabled={!prvUrl} onClick={ () => onClickAction(prvUrl.replace(host, ''))}> 
          Prev
        </Button>
        <Button type="primary" size="middle" disabled={!nxtUrl} onClick={ () => onClickAction(nxtUrl.replace(host, ''))}> 
          Next 
        </Button>
      </Space>

    </div>
  )
}


  return (
    <React.Fragment>
        <List
        header={<div style={{
          textAlign: 'center',
          height: 32,
          lineHeight: '32px',
        }}><h3>Interted Volunteers</h3></div>}
        footer={footer(interest_response && interest_response.next, interest_response && interest_response.previous, setUrl)}
        bordered
        dataSource={listData}
        renderItem={item => (
          <List.Item>
              <div>{item.volunteer.facebook_user_id}</div>
          </List.Item>
        )}
      />
    </React.Fragment>
  );
};

export default InterestedVolunteers;
