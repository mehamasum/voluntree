import React, {useEffect, useState} from "react";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  List,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  TimePicker,
  Typography
} from "antd";

import {formatDate, formatTime, makeColorGenerator, getInvertColor} from "../../../utils";
import {DeleteOutlined, EditOutlined} from '@ant-design/icons';

const generateColor = makeColorGenerator();

export const constructColumns = (editable) => {

    const dateRow = {
        title: 'Date',
        width: 100,
        render: (text, record) => (
          <Typography.Text>{formatDate(record.date)}</Typography.Text>
        )
      };
    const timeRow =  {
        title: 'Time',
        render: (text, record) => (
          <Typography.Text>{formatTime(record.start_time) + " to " + formatTime(record.end_time)}</Typography.Text>
        )
    };

    const actionRow = {
        title: 'Actions',
        render: (text, record) => {
          return <Space>
            <Button type="default" size="small">
              Edit
            </Button>
            <Button type="default" danger size="small">
              Delete
            </Button>
          </Space>;
        },
    };

    const slotsRow = {
        title: 'Slots',
        render: (text, record) => (
          <List
            dataSource={record.slots}
            renderItem={slot => (
              <List.Item actions={editable ? [<Button icon={<EditOutlined/>}/>, <Button icon={<DeleteOutlined/>}/>] : []}>
                <List.Item.Meta
                  title={<Tag color={generateColor(slot.id)}>
                    <span style={{color: getInvertColor(generateColor(slot.id))}}>
                      {slot.title} ({slot.required_volunteers})
                    </span>
                  </Tag>}
                  description={slot.description}
                />
              </List.Item>
            )}
          />
        )
    };
    
    const columns = [dateRow, timeRow];
    if( editable == true ) {
        columns.push(actionRow);
    }
    columns.push(slotsRow);
    return columns;
}

export default function DateTimeSlots(props) {
  const {editable, setVisibleTimeModal, setVisibleSlotModal, datetimes } = props;
  const columns = constructColumns(editable);
  return (
    <Card title="Date-Time and Slots" extra={editable && <Space>
      <Button onClick={() => setVisibleTimeModal(true)}>Add New Date & Time</Button>
      <Button onClick={() => setVisibleSlotModal(true)} disabled={!datetimes}>Add New Slot</Button>
    </Space>}>
      <Table columns={columns} dataSource={datetimes.map((d, i) => ({key: i, ...d}))}/>
    </Card>
  )
}