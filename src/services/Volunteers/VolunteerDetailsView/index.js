import React from "react";
import {useParams} from "react-router";
import {Card} from "antd";

export default function (props) {
  const {id} = useParams();
  return <Card title="Volunteer Profile"><div>{id}</div></Card>
}