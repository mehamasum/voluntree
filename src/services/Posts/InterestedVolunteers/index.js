import React, {useState, useEffect, useCallback} from 'react';
import {List, Button, Avatar, Typography} from 'antd';
import {useFetch} from '../../../hooks';
import InfiniteScroll from 'react-infinite-scroller';

import './styles.css';

// TODO Refactor the whole WebSocket logic
const InterestedVolunteers = props => {
    const {id} = props;
    const host = process.env.REACT_APP_BACKEND_HOST;
    const [interest_response, , setUrl, , , is_loading] = useFetch(`/api/voluntree/posts/${id}/interests/`);
    const [initialcount_of_interested_volunteers] = useFetch(`/api/voluntree/posts/${id}/volunteers/`);
    const [listData, setListData] = useState([]);
    const [nextUrl, setNextUrl] = useState(null);
    const [numberOfVolunteer, setNumberOfVolunteer] = useState(0);


    const onMessage = useCallback((e) => {

        let json_parsed_data = JSON.parse(e.data);
        let data = json_parsed_data.data
        if (data.status === 201) { // newly created instance
            setListData(prevListData => ([data.response, ...prevListData]));
            setNumberOfVolunteer( prevNumberOfVolunteer => prevNumberOfVolunteer + 1 );
        } else if(data.status === 200 ) {
          //setNumberOfVolunteer(data.count);
        }
    }, []);

    useEffect(() => {
        if(initialcount_of_interested_volunteers) {
            setNumberOfVolunteer(initialcount_of_interested_volunteers.count);
        }
    }, [initialcount_of_interested_volunteers])

    useEffect(() => {
        const endPoint = `ws://localhost:8000/ws/volunteers/${id}/`;
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

    }, []);

    useEffect(() => {
        if (interest_response) {
            setListData(prevListData => ([...prevListData, ...interest_response.results]));
            setNextUrl(interest_response.next);
        }
    }, [interest_response && interest_response.results])

    return (
        <React.Fragment>
            <div className="demo-infinite-container">
            <div>
            <Typography.Text>Total Interest Received: {numberOfVolunteer}</Typography.Text>
            </div>
            <InfiniteScroll
                initialLoad={false}
                pageStart={0}
                loadMore={() => nextUrl && setUrl(nextUrl.replace(host, ''))}
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
                                    <svg className="messenger-icon" width="24" height="24"
                                         xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd">
                                        <path
                                            d="M12 0c-6.627 0-12 4.975-12 11.111 0 3.497 1.745 6.616 4.472 8.652v4.237l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111 0-6.136-5.373-11.111-12-11.111zm1.193 14.963l-3.056-3.259-5.963 3.259 6.559-6.963 3.13 3.259 5.889-3.259-6.559 6.963z"/>
                                    </svg>
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
