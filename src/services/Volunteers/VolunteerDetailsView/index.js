import React from "react";
import {useParams} from "react-router";
import {Avatar, Card, Descriptions, Rate, Space, Spin, Table, Tag} from "antd";
import useFetch from "use-http";

const columns = [
  {
    title: 'Sign Up',
    dataIndex: 'name',
    key: 'name',
    render: text => <a>{text}</a>,
  },
  {
    title: 'Rating',
    dataIndex: 'age',
    key: 'age',
    render: text => <Rate disabled defaultValue={text} />
  },
  {
    title: 'Rated by',
    dataIndex: 'address',
    key: 'address',
  },
  {
    title: 'Tags',
    key: 'tags',
    dataIndex: 'tags',
    render: tags => (
      <>
        {tags.map(tag => {
          let color = tag.length > 5 ? 'geekblue' : 'green';
          if (tag === 'loser') {
            color = 'volcano';
          }
          return (
            <Tag color={color} key={tag}>
              {tag.toUpperCase()}
            </Tag>
          );
        })}
      </>
    ),
  },
  {
    title: 'Remarks',
    key: 'action',
    render: (text, record) => (
      <Space size="middle">
        <a>Invite {record.name}</a>
        <a>Delete</a>
      </Space>
    ),
  },
];

const data = [
  {
    key: '1',
    name: 'John Brown',
    age: 3,
    address: 'New York No. 1 Lake Park',
    tags: ['nice', 'developer'],
  },
  {
    key: '2',
    name: 'Jim Green',
    age: 2,
    address: 'London No. 1 Lake Park',
    tags: ['loser'],
  },
  {
    key: '3',
    name: 'Joe Black',
    age: 5,
    address: 'Sidney No. 1 Lake Park',
    tags: ['cool', 'teacher'],
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