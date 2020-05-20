import React, { useEffect } from 'react';
import { useLocation } from "react-router-dom";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const FacebookLogin = props => {
  const query = useQuery();

  useEffect(() => {
    //window.opener.location.reload();
    //window.close();
  }, []);

  console.log("params", useQuery().get('code'));

  return (
    <React.Fragment>
      <h1>Faceook Redirect</h1>
    </React.Fragment>
  );
};

export default FacebookLogin;
