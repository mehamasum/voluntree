import './index.css';

import React from 'react';
import {Button, Card, PageHeader, Result} from 'antd';

import PostList from '../Posts/PostListView';
import {Link} from "react-router-dom";
import {useFetch} from "../../hooks";

const Dashboard = ({...props}) => {
  const [pagesResponse] = useFetch('/api/pages/?limit=25&offset=0');
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


      {/*
     <Card>
        <Row gutter={16}>
          <Col xs={12} sm={8} lg={6}>
            <Statistic title="Active Posts" value={2} prefix={<FireOutlined/>} className="stat-column"/>
          </Col>
          <Col xs={12} sm={8} lg={6}>
            <Statistic title="Posts Created" value={112} prefix={<FormOutlined/>} className="stat-column"/>
          </Col>
          <Col xs={12} sm={8} lg={6}>
            <Statistic title="New Volunteers" value={89} prefix={<RiseOutlined/>} className="stat-column"/>
          </Col>
          <Col xs={12} sm={8} lg={6}>
            <Statistic title="Returning Volunteers" value={11} prefix={<RedoOutlined/>} className="stat-column"/>
          </Col>
        </Row>
      </Card>

      <br/>*/}

      <PostList/>
    </div>
  )
};


export default Dashboard;
