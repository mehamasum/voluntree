import React, {useMemo, useState} from "react";
import {useParams} from "react-router";
import {Avatar, Button, Card, Col, Descriptions, Rate, Row, Spin, Table} from "antd";
import useFetch from "use-http";
import {Link} from "react-router-dom";
import RatingBreakdown from '../../../components/RatingBreakdown';
import {NationBuilderIcon} from "../../../assets/icons";
import _ from 'lodash';

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
    render: text => <Rate disabled defaultValue={text}/>
  },
  {
    title: 'Remark',
    dataIndex: 'remark',
    key: 'remark',
  },
  {
    title: 'Remark by',
    dataIndex: 'rated_by',
    key: 'rated_by',
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
    if (!volunteer) return [];
    return [5, 4, 3, 2, 1].map(rat => {
      const rating = volunteer.rating_summary.find(r => r.rating === rat) || {rating: 0, total: 0};
      return rating.total;
    })

  }, [volunteer]);

  if (loading) return <Spin/>;
  if (error) return 'Error';

  const nbAccount = _.find(volunteer.integrations, ['integration_type', 'NATION_BUILDER']);

  return (
    <>
      <Card title="Volunteer Profile">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card type="inner">
              <Avatar size={128} src={volunteer.profile_pic}/>
              <br/><br/>

              <Descriptions>
                <Descriptions.Item label="Name">{volunteer.first_name} {volunteer.last_name}</Descriptions.Item>
              </Descriptions>

              <Descriptions>
                <Descriptions.Item label="Email">{volunteer.email ? volunteer.email : "N/A"}</Descriptions.Item>

              </Descriptions>

              <Descriptions>
                <Descriptions.Item label="Phone">N/A</Descriptions.Item>

              </Descriptions>

              <Descriptions>
                <Descriptions.Item label="Address">N/A</Descriptions.Item>

              </Descriptions>

              <Descriptions>
                <Descriptions.Item label="Note">N/A</Descriptions.Item>
              </Descriptions>


              {volunteer.integrations.length === 0 ? 'No Integration Accounts' :
                volunteer.integrations.map((integration, indx) => {
                  if (integration.integration_type !== 'NATION_BUILDER') return <>Foo</>;
                  return (
                    <a
                      key={indx}
                      href={`https://${integration.integration_data}.nationbuilder.com/admin/signups/${integration.data}`}
                      target="_blank"
                      rel="noopener noreferrer">
                      <Button type="default" className="messenger-btn">
                        <NationBuilderIcon/>
                        NationBuilder Profile
                      </Button>
                    </a>);
                })}
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card type="inner">
              <RatingBreakdown
                avg={volunteer.total_rating ? volunteer.rating_sum / volunteer.total_rating : 0}
                total={volunteer.total_rating}
                count={ratingData}/>
            </Card>
          </Col>
        </Row>
      </Card>

      <br/>

      <Card title="Activities">
        <Table columns={columns} dataSource={ratingList}/>
      </Card>
    </>
  );
}
