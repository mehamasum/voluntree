import React from "react";
import {Card, Space} from "antd";
import {Link} from "react-router-dom";

export default function SignUpView(props) {


  return (
    <div>
      <Card title="View Sign Up" extra={<Space size="middle">
        <Link to={`/signups/${props.match.params.id}/edit`}>Edit</Link>
      </Space>}>
      </Card>
      <br/>

      <Card title="Posts">
      </Card>

      <br/>

      <Card title="Sent Updates">
      </Card>

      <br/>

      <Card title="Confirmed Volunteers (0)">
      </Card>

    </div>
  );
}