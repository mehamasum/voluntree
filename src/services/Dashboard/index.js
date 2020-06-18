import './index.css';

import React from 'react';
import {Button, Card, Col, PageHeader, Result, Row, Select, Statistic, Typography} from 'antd';

import {CommentOutlined, FireOutlined, FormOutlined, RiseOutlined} from '@ant-design/icons';

import PostList from '../Posts/PostListView';
import {Link} from "react-router-dom";
import {useFetch} from "../../hooks";

const Dashboard = ({...props}) => {
  const [pagesResponse] = useFetch('/api/pages/?limit=25&offset=0');
  const [stats] = useFetch('/api/organizations/stats/');
  console.log('got stats', stats);
  return (
    <div>
      <PageHeader
        className="site-page-header"
        title="Dashboard"
      />

      {
        pagesResponse && pagesResponse.count === 0 ? (
          <div>
            <Card>
              <Result
                title="Your haven't connected a Facebook Page yet"
                subTitle="Let's go to Page settings and add one."
                extra={
                  <Link to={`/settings`}>
                    <Button type="primary" key="console">
                      Go to Page Settings
                    </Button>
                  </Link>
                }
              />
            </Card>
            <br/>
          </div>
        ) : null
      }


      <Card title={
        <>
          Org Stats
          <Select defaultValue="last_28d" size="small" className="stat-range">
            <Select.Option value="last_28d">Last 28 days</Select.Option>
          </Select>
        </>
      }>
        <Row gutter={16}>
          <Col xs={12} sm={8} lg={6}>
            <Statistic
              title="Active Sign Ups"
              value={stats ? stats.active_signups : 0}
              prefix={<FireOutlined/>}
              className="stat-column"
            />
          </Col>
          <Col xs={12} sm={8} lg={6}>
            <Statistic title="Posts Created" value={stats ? stats.posts : '...'} prefix={<FormOutlined/>}
                       className="stat-column"/>
          </Col>
          <Col xs={12} sm={8} lg={6}>
            <Statistic title="Interests" value={stats ? stats.interests : '...'} prefix={<CommentOutlined/>}
                       className="stat-column"/>
          </Col>
          <Col xs={12} sm={8} lg={6}>
            <Statistic title="New Volunteers" value={stats ? stats.new_volunteers : '...'} prefix={<RiseOutlined/>}
                       className="stat-column"/>
          </Col>
        </Row>
      </Card>

      <br/>

      <PostList/>
    </div>
  )
};


export default Dashboard;
