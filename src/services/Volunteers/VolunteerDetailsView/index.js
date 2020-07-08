import React, { useState, useEffect, useMemo } from "react";
import {useParams} from "react-router";
import {Avatar, Card, Descriptions, Rate, Space, Spin, Table, Tag} from "antd";
import useFetch from "use-http";
import {getFetch} from '../../../actions';
import {Link} from "react-router-dom";
import Ratings from './Raings';
import RatingBreakdown from '../../../components/RatingBreakdown';

const columns = [
  {
    title: 'Sign Up',
    dataIndex: 'signup',
    key: 'signup',
    render: (text, record) => <Link to={`/signups/${record.signup.id}/`}>{record.signup.title}</Link>,
  },
  {
    title: 'Rating',
    dataIndex: 'rating',
    key: 'rating',
    render: text => <Rate disabled defaultValue={text} />
  },
  {
    title: 'Given by',
    dataIndex: 'rated_by',
    key: 'rated_by',
  },
  {
    title: 'Remark',
    dataIndex: 'remark',
    key: 'remark',
  },
];



export default function (props) {
  const {id} = useParams();
  const [averageRating, setAverageRating] = useState(0);
  const {loading, error, data: volunteer = null} = useFetch(`/api/volunteers/${id}/`, {
    headers: {
      'Authorization': `Token ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  }, []);
  const {data: ratingList = []} = useFetch(`/api/volunteers/${id}/rating_list/`, {
    headers: {
      'Authorization': `Token ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    onNewData: (curr, newd) => newd.map((d, indx) => ({...d, key: indx}))
  }, []);

  const ratingData = useMemo(() => {
    if(!volunteer) return [];
    return [5, 4, 3, 2, 1].map(rat => {
        const rating = volunteer.rating_summary.find(r => r.rating === rat) || {rating: 0, total: 0};
        return rating.total;
    })

  }, [volunteer]);

  if (loading) return <Spin/>;
  if (error) return 'Error';

  return (
    <>
      <Card title="Volunteer Profile">
        <Avatar size={64} src={volunteer.profile_pic}/>
        <br/><br/>

        <Descriptions title="Basic Info">
          <Descriptions.Item label="Name">{volunteer.first_name} {volunteer.last_name}</Descriptions.Item>
          <Descriptions.Item label="Email">{volunteer.email ? volunteer.email : "N/A"}</Descriptions.Item>
          <Descriptions.Item label="Phone">N/A</Descriptions.Item>
          <Descriptions.Item label="Remark">Empty</Descriptions.Item>
          <Descriptions.Item label="Address">
            No. 18, Wantang Road, Xihu District, Hangzhou, Zhejiang, China
          </Descriptions.Item>
        </Descriptions>

        <br/><br/>
        <Descriptions title="Ratings" colon={false}></Descriptions>

          <RatingBreakdown
            avg={volunteer.total_rating ? volunteer.rating_sum/volunteer.total_rating : 0}
            total={volunteer.total_rating}
            count={ratingData}/>

      </Card>

      <br/>

      <Card title="Activities">
        <Table columns={columns} dataSource={ratingList}/>
      </Card>
    </>
  );
}
