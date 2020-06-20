import React, {useEffect, useState} from "react";
import SignUpForm from '../SignUpForm';
export default function SignUpEdit(props) {

  return (
    <div>
      <SignUpForm editable={true} />
    </div>
  );
}
