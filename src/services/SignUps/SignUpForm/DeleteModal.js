import React, {useEffect, useState} from "react";
import {
    Button,
    Modal,
    
  } from "antd";

export default function DeleteModal(props){
    const { deleteItemAction, showModal, onCancle} = props;
  
    return <Modal
        visible={showModal}
        title="Delete Item"
        onCancel={onCancle}
        footer={[
          <Button key="back" onClick={onCancle}>
            NO
          </Button>,
          <Button key="submit" type="danger" onClick={deleteItemAction} htmlType="submit"
                  form="datetime">
            YES
          </Button>
        ]}
       
      >
        <div>
            Are you sure, you want to delete this item?
        </div>
      </Modal>
}