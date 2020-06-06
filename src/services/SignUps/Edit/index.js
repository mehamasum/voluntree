import React, {useState} from "react";
import {Button, Card, DatePicker, Form, Input, Modal, Table, TimePicker, Typography} from "antd";
import _ from 'lodash';


export default function SignUpEdit(props) {
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [datetimes, setDatetimes] = useState([]);
  const [errors, setErrors] = useState({
    date: false,
    time: false
  });
  const [visibleTimeModal, setVisibleTimeModal] = useState(false);
  const [visibleSlotModal, setVisibleSlotModal] = useState(false);
  const [savingDatetime, setSavingDatetime] = useState(false);
  const [savingSlot, setSavingSlot] = useState(false);
  const [savingSignup, setSavingSignup] = useState(false);

  const [selectedDatetime, setSelectedDatetime] = useState(null);


  const columns = [
    {
      title: 'Date & Time',
      render: (text, record) => (
        <Typography.Text>{record.date + " (" + record.time_start + " - " + record.time_end + ")"}</Typography.Text>
      )
    },
    {
      title: 'Slots',
      render: (text, record) => {
        return (<div>
          {record.slots.map((r, i) => <div key={i}>{`${r.title} (${r.required_volunteers})`}</div>)}
        </div>);
      },
    },
    {
      title: 'Actions',
      render: (text, record) => {
        return <div>
          <Button type="default" size="small" onClick={() => onSlotAdd(record)}>
            Add Slot
          </Button>
          <Button type="default" danger size="small">
            Delete Time & Date
          </Button>
        </div>;
      },
    }
  ];

  function onSlotAdd(row) {
    console.log('row', row);
    setSelectedDatetime(row);
    setVisibleSlotModal(true);
  }


  function onDateChange(date, dateString) {
    console.log(date, dateString);
    setDate(date);
  }

  function onTimeRangeChange(dates, dateStrings) {
    console.log(dates, dateStrings);
    setTime(dates);
  }

  const handleTimeModalOk = () => {
    if (!date || !time) {
      setErrors(errors => ({
        date: !date,
        time: !time
      }));
    } else {
      setErrors(errors => ({
        date: false,
        time: false
      }));
      setDatetimes([
        ...datetimes,
        {
          id: Math.random() * 100,
          date: date,
          time_start: time[0],
          time_end: time[1],
          slots: []
        }
      ])
    }
  }

  const handleTimeModalCancel = () => {
    setVisibleTimeModal(false);
  }

  const handleSlotModalOk = () => {

  }

  const handleSlotModalCancel = () => {
    setVisibleSlotModal(false);
  }

  const onSlotCreateSubmit = fieldsValue => {
    console.log('Received values of form: ', fieldsValue, datetimes, selectedDatetime);
    const clonedDateTimes = _.clone(datetimes);
    const idx = _.findIndex(datetimes, 'id', selectedDatetime);
    clonedDateTimes[idx].slots = [
      ...clonedDateTimes[idx].slots,
      fieldsValue
    ]
    setDatetimes(clonedDateTimes);
  }


  return (
    <div>
      <Card title="Edit Sign Up">
        <Form name="signup" initialValues={{}} onFinish={() => {
        }} layout="vertical">
          <Form.Item label="Title" name="title" rules={[{required: true}]}>
            <Input.TextArea rows={2} placeholder="What is the title for your form?"/>
          </Form.Item>

          <Card title="Date-Times" extra={<Button onClick={() => setVisibleTimeModal(true)}>Add New</Button>}>
            <Table columns={columns} dataSource={datetimes.map((d, i) => ({key: i, ...d}))}/>
          </Card>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={savingSignup}>
              Save
            </Button>
          </Form.Item>
        </Form>
      </Card>
      <Modal
        visible={visibleTimeModal}
        title="Pick Date and Time"
        onOk={handleTimeModalOk}
        onCancel={handleTimeModalCancel}
        footer={[
          <Button key="back" onClick={handleTimeModalCancel}>
            Return
          </Button>,
          <Button key="submit" type="primary" loading={savingDatetime} onClick={handleTimeModalOk}>
            Save and Add Another
          </Button>,
        ]}
      >
        <Form name="datetime">
          <Form.Item label="Date" validateStatus={errors.date && "error"}
                     help={errors.date && "Please select the correct date"}>
            <DatePicker onChange={onDateChange}/>
          </Form.Item>

          <Form.Item label="Time" validateStatus={errors.time && "error"}
                     help={errors.time && "Please select the time"}>
            <TimePicker.RangePicker onChange={onTimeRangeChange} format={'HH:mm'} minuteStep={15}/>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        visible={visibleSlotModal}
        title="Create a new slot"
        onOk={handleSlotModalOk}
        onCancel={handleSlotModalCancel}
        footer={[
          <Button key="back" onClick={handleSlotModalCancel}>
            Return
          </Button>,
          <Button key="submit" type="primary" loading={savingSlot} onClick={handleSlotModalOk} htmlType="submit"
                  form="slot">
            Save and Add Another
          </Button>,
        ]}
      >
        <Form
          name="slot"
          labelCol={{
            xs: {span: 24},
            sm: {span: 8},
          }}
          wrapperCol={{
            xs: {span: 24},
            sm: {span: 16},
          }}
          onFinish={onSlotCreateSubmit}
        >
          <Form.Item
            label="Title"
            name="title"
            rules={[{required: true, message: 'Please input a title'}]}
          >
            <Input/>
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{required: true, message: 'Please add a description'}]}
          >
            <Input.TextArea rows={2}/>
          </Form.Item>

          <Form.Item
            label="Required volunteers"
            name="required_volunteers"
            rules={[{required: true, message: 'Please select how many volunteers are required'}]}
          >
            <Input type="number"/>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}