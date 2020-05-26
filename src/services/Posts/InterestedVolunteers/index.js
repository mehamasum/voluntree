import React, { useMemo, useState } from 'react';
import { List, Avatar, Button, Space } from 'antd';
import { useFetch } from '../../../hooks';

let iter = 0;
const InterestedVolunteers = props => {
  const {id} = props;
  const [interest_response,, setUrl] = useFetch(`/api/voluntree/posts/${id}/interests/`);
 

const footer = (nxtUrl, prvUrl, onClickAction) => {
  return (
    <div style={{ textAlign: 'right'}}>
      <Space>
        <Button type="primary" size="middle" disabled={!prvUrl} onClick={ () => onClickAction(prvUrl.replace('http://localhost:8000', ''))}> 
            Prev
        </Button>
        <Button type="primary" size="middle" disabled={!nxtUrl} onClick={ () => onClickAction(nxtUrl.replace('http://localhost:8000', ''))}> 
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
        dataSource={interest_response &&interest_response.results}
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
