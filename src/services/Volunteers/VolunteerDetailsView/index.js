import React from "react";
import {useParams} from "react-router";
import {Avatar, Card, Descriptions, Rate, Space, Spin, Table, Tag} from "antd";
import useFetch from "use-http";
import {Link} from "react-router-dom";

const columns = [
  {
    title: 'Sign Up',
    dataIndex: 'signup',
    key: 'signup',
    render: text => <Link>{text}</Link>,
  },
  {
    title: 'Rating',
    dataIndex: 'rating',
    key: 'rating',
    render: text => <Rate disabled defaultValue={text} />
  },
  {
    title: 'Rated by',
    dataIndex: 'user',
    key: 'user',
  },
  {
    title: 'Remark',
    dataIndex: 'remark',
    key: 'remark',
  },
];

const data = [
  {
    key: '1',
    signup: 'signup',
    rating: 3,
    user: 'New York No. 1 Lake Park',
    remark: 'nice',
  },
  {
    key: '2',
    signup: 'signup',
    rating: 3,
    user: 'New York No. 1 Lake Park',
    remark: 'nice',
  },
  {
    key: '3',
    signup: 'signup',
    rating: 3,
    user: 'New York No. 1 Lake Park',
    remark: 'nice',
  },
];


export default function (props) {
  const {id} = useParams();
  const {loading, error, data: volunteer = null} = useFetch(`/api/volunteers/${id}/`, {
    headers: {
      'Authorization': `Token ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  }, []);

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
        <Descriptions title="Performance Info">
          <Descriptions.Item label="Avg. Rating"><Rate disabled defaultValue={3} /></Descriptions.Item>
        </Descriptions>
      </Card>

      <br/>

      <Card title="Activities">
        <Table columns={columns} dataSource={data}/>
      </Card>
    </>
  );
}