import React from "react";
import { Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const FileUploader = (props) => (
  <Upload {...props}>
    <Button disabled={props.disabled}>
      <UploadOutlined /> Click to Upload
    </Button>
  </Upload>
);

export default FileUploader;