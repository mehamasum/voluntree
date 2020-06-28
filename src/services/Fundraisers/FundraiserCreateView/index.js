import React, {useCallback} from 'react';
import { useHistory } from "react-router-dom";
import { Card, Layout, Alert } from 'antd';
import FundraiserForm from '../Form';


const FundraiserCreateView = props => {
  const history = useHistory();
  const onSubmit = useCallback(values => {
    console.log("values", values);
  }, [history]);
  return (
    <React.Fragment>
      <Layout.Content className="center-content">
        <Card title="Create New Fundraiser">
          <FundraiserForm onSubmit={onSubmit}/>
        </Card>
      </Layout.Content>
    </React.Fragment>
  );
};

export default FundraiserCreateView;
