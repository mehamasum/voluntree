import React, {useEffect, useMemo, useState} from "react";
import {Avatar, Button, Card, List, Space, Table, Tag, Tooltip, Typography} from "antd";

import {useFetch} from '../../../hooks';
import {formatDate, formatTime, getInvertColor, makeColorGenerator} from "../../../utils";
import {DeleteOutlined, EditOutlined} from '@ant-design/icons';
import {DeleteFetch} from '../../../actions';
import DeleteModal from './DeleteModal';
import ReconnectingWebSocket from 'reconnecting-websocket';

const generateColor = makeColorGenerator();

const WEB_SOCKET_HOST = process.env.REACT_APP_WEBSOCKET_HOST || window.location.host;

const ActionButton = (props) => {
  const {setVisibleTimeModal, id} = props;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const deleteItemAction = () => {
    DeleteFetch(`/api/datetimes/${id}/`).then(() => {
      setShowDeleteModal(false);
    }).catch(err => {
      console.log('got error', err);
    })
  }

  const onCancle = () => {
    setShowDeleteModal(false);
  }
  return <Space>
    <Button icon={<EditOutlined/>} onClick={() => setVisibleTimeModal(true)}/>
    <Button icon={<DeleteOutlined/>} onClick={() => setShowDeleteModal(true)}/>
    <DeleteModal
      deleteItemAction={deleteItemAction}
      showModal={showDeleteModal}
      onCancle={onCancle}
    />
  </Space>;

}


const PopulateAvatar = (props) => {
  const {record} = props;
  return (
    <span key={record.id}>
      <Tooltip placement="top" title={`${record.first_name} ${record.last_name}`}>
        <Avatar src={record.profile_pic} size="small"/>
      </Tooltip>
    </span>
  )
}

const SlotItem = (props) => {

  const {slot, editable, datetimeId} = props;
  const {id} = slot;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [volunteerList, setVolunteerList] = useFetch(`/api/slots/${id}/volunteers/`);
  const [newVolunteer, , setNewVolunteerDetailsUrl] = useFetch();
  const [isSocketClose, setIsSocketClose] = useState(false);

  const [roomId, setRoomId]  = useState(`${id}_${datetimeId}`);
  

  useEffect(() => {
  
    const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
    const endPoint = `${wsScheme}://${WEB_SOCKET_HOST}/ws/slots/${roomId}/interests`;
    const ws = new ReconnectingWebSocket(endPoint);
    ws.onerror = () => {
      setIsSocketClose(true);
    };
    ws.onmessage = (e) => {
      const json_parsed_data = JSON.parse(e.data);
      const data = json_parsed_data.data;
      if (data.status === 'created') {
        setNewVolunteerDetailsUrl(`/api/volunteers/${data.id}/`);
      }
    };
    ws.onopen = () => {
      setIsSocketClose(false);
    };
    ws.onclose = () => {
      setIsSocketClose(true);
    };
    return () => {
      ws && ws.close();
    }
  }, [setIsSocketClose, setNewVolunteerDetailsUrl, roomId]);


  useState(() => {
    if(!id || !datetimeId) return;
     setRoomId(`${id}_${datetimeId}`);
  }, [id , datetimeId])

  useEffect(() => {
    if (!newVolunteer) return;
    setVolunteerList(prevList => [newVolunteer, ...prevList]);
  }, [newVolunteer]);

  const volunteerListData = useMemo(() => {
    if (!volunteerList) return [];
    return volunteerList.map(r => (<PopulateAvatar key={r.id} record={r}/>));
  }, [volunteerList]);

  const deleteItemAction = () => {
    DeleteFetch(`/api/slots/${slot.id}/`).then(() => {
      setShowDeleteModal(false);
    }).catch(err => {
      console.log('got error', err);
    })
  }


  const onCancle = () => {
    setShowDeleteModal(false);
  }

  return <List.Item actions={editable ? [<Button icon={<EditOutlined/>}/>,
    <Button icon={<DeleteOutlined/>} onClick={() => setShowDeleteModal(true)}/>] : []}>
    <List.Item.Meta
      title={<Tag color={generateColor(slot.id)}>
      <span style={{color: getInvertColor(generateColor(slot.id))}}>
        {slot.title} ({volunteerListData.length}/{slot.required_volunteers})
      </span>
      </Tag>}
      description={<Space direction="vertical">
        {slot.description}
        <Space>{volunteerListData}</Space>
      </Space>}
    />

    <DeleteModal
      deleteItemAction={deleteItemAction}
      showModal={showDeleteModal}
      onCancle={onCancle}
    />
  </List.Item>
}

const constructColumns = (editable, setVisibleTimeModal, datetimes) => {
  const dateRow = {
    title: 'Date',
    width: 100,
    render: (text, record) => (
      <Typography.Text>{formatDate(record.date)}</Typography.Text>
    )
  };
  const timeRow = {
    title: 'Time',
    render: (text, record) => (
      <Typography.Text>{formatTime(record.start_time) + " to " + formatTime(record.end_time)}</Typography.Text>
    )
  };

  const actionRow = {
    title: 'Actions',
    render: (text, record) => {
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
        renderItem={slot => <SlotItem slot={slot} datetimeId={record.id} editable={editable}/>}
      />
    )
  };

  const columns = [dateRow, timeRow];
  if (editable == true) {
    columns.push(actionRow);
  }
  columns.push(slotsRow);
  return columns;
}

export default function DateTimeSlots(props) {
  const {editable, setVisibleTimeModal, setVisibleSlotModal, datetimes} = props;
  const columns = useMemo(() => {
    return constructColumns(editable, setVisibleTimeModal, datetimes);
  }, [editable, setVisibleTimeModal, datetimes])
  return (
    <Card title="Date-Time and Slots" extra={editable && <Space>
      <Button type="primary" onClick={() => setVisibleTimeModal(true)}>Add Date & Time</Button>
      <Button type="primary" onClick={() => setVisibleSlotModal(true)} disabled={!datetimes}>Add Slot</Button>
    </Space>}>
      <Table columns={columns} dataSource={datetimes.map((d, i) => ({key: i, ...d}))}/>
    </Card>
  )
}