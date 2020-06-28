import React, {useEffect, useState} from "react";
import SignUpForm from '../SignUpForm';
import {Card} from "antd";
export default function SignUpEdit(props) {

  return (
    <Card title="Edit Sign Up">
      <SignUpForm editable={true} />
    </Card>
  );
}
