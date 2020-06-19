import './index.css';
import React, {useState, useEffect} from 'react';
import {Button, Card, Modal, Input, Form, Tag} from 'antd';

import Tabs from "./SettingsTabs";


const Settings = () => {


  return (
    <div>
      <Card>
        <Tabs/>
      </Card>
    </div>
  );
};

export default Settings;
