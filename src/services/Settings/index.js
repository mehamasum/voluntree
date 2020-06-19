import './index.css';
import React from 'react';
import {Card} from 'antd';

import Tabs from "./SettingsTabs";


const Settings = () => {


  return (
    <div>
      <Card title="Settings">
        <Tabs/>
      </Card>
    </div>
  );
};

export default Settings;
