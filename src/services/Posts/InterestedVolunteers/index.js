import React, {useEffect, useState} from 'react';
import {Avatar, Button, Card, List, Typography} from 'antd';
import {useFetch} from '../../../hooks';
import InfiniteScroll from 'react-infinite-scroller';
import {MessengerIcon, NationBuilderIcon} from '../../../assets/icons';
import {DisconnectOutlined} from '@ant-design/icons';
import ReconnectingWebSocket from 'reconnecting-websocket';

import './styles.css';

const WEB_SOCKET_HOST = process.env.REACT_APP_WEBSOCKET_HOST || window.location.host;

const InterestedVolunteers = props => {
  const {id} = props;
  const [interests_response, , setInterestsUrl, , , is_loading] = useFetch(`/api/posts/${id}/interests/`);
  const [interest_details_response, , setInterestDetailsUrl] = useFetch();
  const [initialcount_of_interested_volunteers] = useFetch(`/api/posts/${id}/volunteers/`);
  const [listData, setListData] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [numberOfVolunteer, setNumberOfVolunteer] = useState(0);
  const [isSocketClose, setIsSocketClose] = useState(false);

  useEffect(() => {
    if (initialcount_of_interested_volunteers) {
      setNumberOfVolunteer(initialcount_of_interested_volunteers.count);
    }
  }, [initialcount_of_interested_volunteers]);

  useEffect(() => {
    const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
    const endPoint = `${wsScheme}://${WEB_SOCKET_HOST}/ws/posts/${id}/interests`;
    const ws = new ReconnectingWebSocket(endPoint);
    ws.onerror = () => {
      setIsSocketClose(true);
    };
    ws.onmessage = (e) => {
      const json_parsed_data = JSON.parse(e.data);
      const data = json_parsed_data.data;
      if (data.status === 'created') {
        setInterestDetailsUrl(`/api/interests/${data.id}/`);
      }
    };
    ws.onopen = () => {
      setIsSocketClose(false);
    };
    ws.onclose = () => {
      setIsSocketClose(true);
    };
    return () => {
      ws && ws.close();
    }
  }, [id, setInterestDetailsUrl, setIsSocketClose]);

  useEffect(() => {
    if (!interests_response) return;
    setListData(prevList => [...prevList, ...interests_response.results]);
    setNextUrl(interests_response.next);
  }, [interests_response]);

  useEffect(() => {
    if (!interest_details_response) return;
    setListData(prevList => [interest_details_response, ...prevList]);
    setNumberOfVolunteer(prevNumberOfVolunteer => prevNumberOfVolunteer + 1);
  }, [interest_details_response]);

  return (
    <Card
      title={`Confirmed Volunteers (${numberOfVolunteer})`}
      extra={isSocketClose && <DisconnectOutlined style={{color: 'red'}}/>}>
      <div className="infinite-container">
        <InfiniteScroll
          initialLoad={false}
          pageStart={0}
          loadMore={() => nextUrl && setInterestsUrl(nextUrl)}
          hasMore={!is_loading && !!nextUrl}
          loader={<div className="loader" key={0}>Loading ...</div>}
          useWindow={false}>
          <List
            bordered
            dataSource={listData}
            renderItem={item => (
              <List.Item actions={[<a
                  href={`https://www.facebook.com/${item.volunteer.facebook_page_id}/inbox/`}
                  target="_blank"
                  rel="noopener noreferrer">
                  <Button type="primary" className="messenger-btn">
                    <MessengerIcon/>
                    Messenger
                  </Button>
                </a>,

                ...item.volunteer.integrations.map((integration, indx) => {
                  if (integration.integration_type !== 'NATION_BUILDER') return <React.Fragment/>;
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
                })]}>
                <div>
                  <Avatar src={item.volunteer.profile_pic}/>&nbsp;&nbsp;
                  <Typography.Text>
                    {item.volunteer.first_name} {item.volunteer.last_name}
                  </Typography.Text>
                </div>
              </List.Item>)}
          />
        </InfiniteScroll>
      </div>
    </Card>
  );
};

export default InterestedVolunteers;
