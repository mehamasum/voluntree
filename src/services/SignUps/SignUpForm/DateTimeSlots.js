import React, {useEffect, useState, useMemo} from "react";
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

import {useFetch} from '../../../hooks';
import {formatDate, formatTime, makeColorGenerator, getInvertColor} from "../../../utils";
import {DeleteOutlined, EditOutlined} from '@ant-design/icons';
import { DeleteFetch } from '../../../actions';
import DeleteModal from './DeleteModal';
const generateColor = makeColorGenerator();

const ActionButton = (props) => {
  const {setVisibleTimeModal, id} = props;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  console.log('new Data', props);
  const deleteItemAction = () => {
    DeleteFetch(`/api/datetimes/${id}/`).then(()=> {
      console.log('successful');
      setShowDeleteModal(false);
    }).catch(err => {
      console.log('got error', err);
    })
  }

  const onCancle = () => {
    setShowDeleteModal(false);
  }
  return <Space>
            <Button icon={<EditOutlined/>} onClick={() => setVisibleTimeModal(true)} />
            <Button icon={<DeleteOutlined/>} onClick={() => setShowDeleteModal(true)} />
            <DeleteModal 
              deleteItemAction={deleteItemAction}
              showModal={showDeleteModal}
              onCancle={onCancle}
            />
          </Space>;
  
}


const SlotItem = (props) => {
  
  const {slot, editable} = props;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [volunteerList] = useFetch(`/api/slots/${slot.id}/volunteers/`);

  const volunteerListData = useMemo(() => {
    if (!volunteerList) return [];
    return volunteerList.map(r => ({...r, key: r.id}));
  }, [volunteerList]);

  const deleteItemAction = () => {
    DeleteFetch(`/api/slots/${slot.id}/`).then(()=> {
      console.log('successful');
      setShowDeleteModal(false);
    }).catch(err => {
      console.log('got error', err);
    })
  }

  console.log('VolunteerList', volunteerListData);

  const onCancle = () => {
    setShowDeleteModal(false);
  }

  return <List.Item actions={editable ? [<Button icon={<EditOutlined/>}/>, <Button icon={<DeleteOutlined/>} onClick={() => setShowDeleteModal(true)}/>] : []}>
  <List.Item.Meta
    title={<Tag color={generateColor(slot.id)}>
      <span style={{color: getInvertColor(generateColor(slot.id))}}>
        {slot.title} ({volunteerListData.length} / {slot.required_volunteers})
      </span>
    </Tag>}
    description={slot.description}
  />
  <DeleteModal 
    deleteItemAction={deleteItemAction}
    showModal={showDeleteModal}
    onCancle={onCancle}
  />
</List.Item>
}

const constructColumns = (props) => {
    const {editable, setVisibleTimeModal, datetimes } = props;
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
          console.log('record', record);
          return <ActionButton 
                        setVisibleTimeModal={setVisibleTimeModal}
                        datetimes={datetimes}
                        id={record.id}
                  />
           
        },
    };

    const slotsRow = {
        title: 'Slots',
        render: (text, record) => (
          <List
            dataSource={record.slots}
            renderItem={slot => <SlotItem  slot={slot} editable={editable}/>}
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
  const columns = constructColumns(props);
  return (
    <Card title="Date-Time and Slots" extra={editable && <Space>
      <Button onClick={() => setVisibleTimeModal(true)}>Add New Date & Time</Button>
      <Button onClick={() => setVisibleSlotModal(true)} disabled={!datetimes}>Add New Slot</Button>
    </Space>}>
      <Table columns={columns} dataSource={datetimes.map((d, i) => ({key: i, ...d}))}/>
    </Card>
  )
}