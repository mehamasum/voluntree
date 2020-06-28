import React from 'react';
import {Link, useHistory} from "react-router-dom";
import {Card, Space, Table, Button} from 'antd';


const FundraiserListView = props => {
  return (
    <div>
      <Card title="Created Fundraisers" extra={
        <Button type="primary"><Link to={`/fundraisers/create`}>Create New Post</Link></Button>
      }>
        <Table columns={[]} dataSource={[]} onChange={() => {}}/>
      </Card>
    </div>
  );
};

export default FundraiserListView;
