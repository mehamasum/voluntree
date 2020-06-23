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
  const [ratingList, setRatingList] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const {loading, error, data: volunteer = null} = useFetch(`/api/volunteers/${id}/`, {
    headers: {
      'Authorization': `Token ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  }, []);

  useEffect(() => {
    getFetch(`/api/volunteers/${id}/rating_list/`).then(result=>{
      setRatingList(result);
      let totalRating = 0;
      let totalEntry = 0;
      result.forEach(element => {
        if(element.rating) { // already rated in this event 
          totalRating += element.rating;
          totalEntry += 1;
        }
       
      });

      if( result.length ) {
        setAverageRating(totalRating / totalEntry);
      }
     
    })
  }, [])

  
  console.log('ratingList', ratingList);
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
        <Descriptions title="Performance Info" >
          <Descriptions.Item label="Avg. Rating" key={`${averageRating}_item`}><Rate disabled defaultValue={averageRating} /></Descriptions.Item>
        </Descriptions>
      </Card>

      <br/>

      <Card title="Activities">
        <Table columns={columns} dataSource={ratingList}/>
      </Card>
    </>
  );
}