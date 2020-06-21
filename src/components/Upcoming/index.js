import React from "react";
import {Card, Result} from "antd";

export default function Magic(props) {
  return <Card>
    <Result
      title="This feature is not available for your organization"
      subTitle="This feature is still in Beta. Please contact Voluntree support if you want to participate in the Beta release."
    />
  </Card>
}