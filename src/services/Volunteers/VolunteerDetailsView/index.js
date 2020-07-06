import React, { useState, useEffect } from "react";
import {useParams} from "react-router";
import {Avatar, Card, Descriptions, Rate, Space, Spin, Table, Tag} from "antd";
import useFetch from "use-http";
import {getFetch} from '../../../actions';
import {Link} from "react-router-dom";

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
    title: 'Rated by',
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

  console.log('ratingList', ratingList);
  if (loading) return <Spin/>;
  if (error) return 'Error';
  console.log("volunteer", volunteer);
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
        <Descriptions title="Ratings" colon={false}>
          <Descriptions.Item label="Avg" span={3}>
            <Rate disabled defaultValue={volunteer.avg_rating} />
          </Descriptions.Item>
          {volunteer && [5,4,3,2,1].map(rat => {
            const rating = volunteer.rating_summary.find(r => r.rating === rat) || {rating: rat, total: 0};
            return (
              <Descriptions.Item label={`${rating.rating}`} key={rat} span={3}>
                <Rate disabled defaultValue={rating.rating} />
                <span>{` (${rating.total})`}</span>
              </Descriptions.Item>
            );
          })}
        </Descriptions>
      </Card>

      <br/>

      <Card title="Activities">
        <Table columns={columns} dataSource={ratingList}/>
      </Card>
    </>
  );
}
