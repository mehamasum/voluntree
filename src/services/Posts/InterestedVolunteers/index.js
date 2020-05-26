import React, { useMemo, useState, useEffect, useCallback} from 'react';
import { List, Card, Button, Space } from 'antd';
import { useFetch } from '../../../hooks';
import InfiniteScroll from 'react-infinite-scroller';

import './styles.css';

const InterestedVolunteers = props => {
  const {id} = props;
  const host = process.env.REACT_APP_BACKEND_HOST;
  const [interest_response,, setUrl,,,is_loading] = useFetch(`/api/voluntree/posts/${id}/interests/`);
  const [listData, setListData] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);

   
  const onMessage = useCallback((e) => {
      
    let json_parsed_data = JSON.parse(e.data);
    let data = json_parsed_data.data
    if( data.status == 201 ) { // newly created instance 
      setListData(prevListData => ([data.response, ...prevListData]));
    }
  }, [listData]);
 
  useEffect(()=> {
    const endPoint = 'ws://localhost:8000' + `/ws/volunteers/${id}/`;
    const ws = new WebSocket(endPoint);
    ws.onerror = (e) => {
      console.log('error', e);
    }
    
    ws.onmessage = onMessage;
  
    ws.onopen = (e) => {
      console.log('onopen', e);
    }
  
    ws.onclose = (e) => {
      console.log('onclose', e);
    }

  },[]);

  useEffect(() => {
    if(interest_response) {
      setListData(prevListData => ([...prevListData, ...interest_response.results]));
      setNextUrl(interest_response.next);
    }
  }, [interest_response && interest_response.results])

  return (
    <React.Fragment>
      <Card>
      <div className="demo-infinite-container">
        <InfiniteScroll
            initialLoad={false}
            pageStart={0}
            loadMore={() => nextUrl && setUrl(nextUrl.replace(host, ''))}
            hasMore={!is_loading && (nextUrl ? true : false) }
            loader={<div className="loader" key={0}>Loading ...</div>}
            useWindow={false}
          >
          <List
          header={<div style={{
            textAlign: 'center',
            height: 32,
            lineHeight: '32px',
          }}><h3>Interested Volunteers</h3></div>}
          bordered
          dataSource={listData}
          renderItem={item => (
            <List.Item>
                <div>{item.volunteer.facebook_user_id}</div>
            </List.Item>
          )}
        />
        </InfiniteScroll>
      </div>
      </Card>
    </React.Fragment>
  );
};

export default InterestedVolunteers;
