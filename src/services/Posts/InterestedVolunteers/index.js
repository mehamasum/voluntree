import React, {useState, useEffect, useMemo} from 'react';
import {List, Button, Avatar, Typography} from 'antd';
import {useFetch} from '../../../hooks';
import InfiniteScroll from 'react-infinite-scroller';
import {MessengerIcon} from '../../../assets/icons';
import './styles.css';


const WEB_SOCKET_HOST = process.env.REACT_APP_WEBSOCKET_HOST;
const host = process.env.REACT_APP_BACKEND_HOST;

// TODO Refactor the whole WebSocket logic
const InterestedVolunteers = props => {
  const {id} = props;
  const [interests_response, , setInterestsUrl, , , is_loading] = useFetch(`/api/voluntree/posts/${id}/interests/`);
  const [interest_details_response, , setInterestDetailsUrl] = useFetch();
  const [initialcount_of_interested_volunteers] = useFetch(`/api/voluntree/posts/${id}/volunteers/`);
  const [listData, setListData] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [numberOfVolunteer, setNumberOfVolunteer] = useState(0);

  const onMessage = (e) => {
    let json_parsed_data = JSON.parse(e.data);
    console.log("come new data", e);
    let data = json_parsed_data.data
    if (data.status === 'created') { // newly created instance
      setInterestDetailsUrl(`/api/voluntree/interests/${data.id}/`);
    }
  };

  useEffect(() => {
    if(initialcount_of_interested_volunteers) {
      setNumberOfVolunteer(initialcount_of_interested_volunteers.count);
    }
  }, [initialcount_of_interested_volunteers])

  useEffect(() => {
    const endPoint = `${WEB_SOCKET_HOST}/ws/voluntree/posts/${id}/interests`;
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
  }, [id]);

  useEffect(() => {
    if(!interests_response) return;
    setListData([...listData, ...interests_response.results]);
    setNextUrl(interests_response.next);
  }, [interests_response])

  useEffect(() => {
    if(!interest_details_response) return;
    setListData([interest_details_response, ...listData])
    setNumberOfVolunteer( numberOfVolunteer + 1 );
  }, [interest_details_response]);

    return (
        <React.Fragment>
            <div className="demo-infinite-container">
            <div>
            <Typography.Text>Total Interest Received: {numberOfVolunteer}</Typography.Text>
            </div>
            <InfiniteScroll
                initialLoad={false}
                pageStart={0}
                loadMore={() => nextUrl && setInterestsUrl(nextUrl.replace(host, ''))}
                hasMore={!is_loading && (nextUrl ? true : false)}
                loader={<div className="loader" key={0}>Loading ...</div>}
                useWindow={false}
            >
                <List
                    bordered
                    dataSource={listData}
                    renderItem={item => (
                        <List.Item>
                          <div>
                            <Avatar src={item.volunteer.profile_pic}/>&nbsp;&nbsp;
                            <Typography.Text>{item.volunteer.first_name} {item.volunteer.last_name}</Typography.Text>
                          </div>
                            <a href={`https://www.facebook.com/${item.volunteer.facebook_page_id}/inbox/`} target="_blank" rel="noopener noreferrer">
                                <Button type="primary" className="messenger-btn">
                                    <MessengerIcon/>
                                    Messenger
                                </Button>
                            </a>
                        </List.Item>
                    )}
                />
            </InfiniteScroll>
            </div>
        </React.Fragment>
    );
};

export default InterestedVolunteers;
