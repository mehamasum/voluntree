import React, {useEffect, useState} from 'react';
import {Avatar, Button, List, Typography} from 'antd';
import {useFetch} from '../../../hooks';
import InfiniteScroll from 'react-infinite-scroller';
import _ from 'lodash';

import './styles.css';
import {Link} from "react-router-dom";


const InterestedVolunteers = props => {
  const {id} = props;
  const [interests_response, , setInterestsUrl, , , is_loading] = useFetch(`/api/signups/${id}/interests/`);
  const [interest_details_response,] = useFetch();
  const [listData, setListData] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [numberOfVolunteer, setNumberOfVolunteer] = useState(0);


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
          dataSource={_.uniqBy(listData, 'volunteer.id')}
          renderItem={item => (
            <List.Item actions={
              [
                <Link to={`/volunteers/${item.volunteer.id}`}>Profile</Link>,
                <Button type="link">Rate</Button>,
                <Button type="link" danger>Ban</Button>,
              ]}>
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
  );
};

export default InterestedVolunteers;
