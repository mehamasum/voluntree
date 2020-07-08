import React from 'react';
import {Avatar, Card, Descriptions, Rate, Space, Spin, Table, Tag, Row, Col, Typography} from "antd";
import {StarOutlined, UserOutlined} from '@ant-design/icons';


const Ratings = props => {
  const {ratingData, avg_rating, total_rating} = props;
  return (
    <React.Fragment>
      <Row justify="center">
        <Col span={4}>
          <Row justify="center">
            <Typography.Title level={4} type="secondary">Avg</Typography.Title>
          </Row>
          <Row justify="center">
            <Typography.Title level={1} style={{marginBottom: 0}}>{avg_rating ? avg_rating.toFixed(1) : 'N/A'}</Typography.Title>
            <Rate disabled defaultValue={avg_rating}/>
            <Typography.Title level={4}>Total: <UserOutlined /> {total_rating}</Typography.Title>
          </Row>

        </Col>
        <Col span={20}>
          {ratingData.map((rat, indx) => (

            <Row key={indx}>
              <Col style={{ float: 'left', marginTop: 10, }} span={3}>
                <Row justify="end" style={{paddingRight: 5}}>
                  <Typography.Text>{rat.rating} <StarOutlined /></Typography.Text>
                </Row>
              </Col>
      
              <Col style={{ marginTop:10, float: 'right' }} span={18}>
                <div style={{ width: '100%', backgroundColor: '#f1f1f1', textAlign: 'center', color: 'white' }}>
                  <div style={{width: `${rat.percent}%`, height: 18, backgroundColor: rat.color}}></div>
                </div>
              </Col>

              <Col style={{float: 'left', marginTop: 10, textAlign: 'right' }} span={3}>
                <Row justify="start" style={{paddingLeft: 5}}>
                  <Typography.Text>{rat.total}</Typography.Text>
                </Row>
              </Col>
            </Row>
          ))};
        </Col>
      </Row>
    </React.Fragment>
  );
};


export default Ratings;
