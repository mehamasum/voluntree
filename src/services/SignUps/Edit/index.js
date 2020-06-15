import React, {useEffect, useState} from "react";
import {Button, Card, DatePicker, Form, Input, Modal, Space, Table, TimePicker, Typography} from "antd";
import _ from 'lodash';
import {useHistory, useParams} from "react-router-dom";
import {useFetch} from '../../../hooks';
import {formatDate, formatTime} from "../../../utils";


export default function SignUpEdit(props) {
  const {id} = useParams();
  const history = useHistory();
  const [signUpResponse] = useFetch(`/api/signups/${id}/`);
  const [dateTimesResponse] = useFetch(`/api/signups/${id}/date_times/`);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [datetimes, setDatetimes] = useState([]);
  const [dateTimeForm] = Form.useForm();
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

  useEffect(() => {
    if (!dateTimesResponse) return;
    setDatetimes(dateTimesResponse);
  }, [dateTimesResponse]);


  const columns = [
    {
      title: 'Date',
      render: (text, record) => (
        <Typography.Text>{formatDate(record.date)}</Typography.Text>
      )
    },
    {
      title: 'Time',
      render: (text, record) => (
        <Typography.Text>{formatTime(record.start_time) + " to " + formatTime(record.end_time)}</Typography.Text>
      )
    },

    {
      title: 'Slots',
      render: (text, record) => (
        <Typography.Text>Slots</Typography.Text>
      )
    },

    {
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

  const onSubmitSignUp = values => {
  };

  const handleTimeModalOk = values => {
    const {date, time} = values;
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
      const data = {
        signup: id,
        date: date.format("YYYY-MM-DD"),
        start_time: time[0].format("HH:mm:ss"),
        end_time: time[1].format("HH:mm:ss"),
      };
      console.log("submit data", data);
      let status = null;
      fetch(`/api/datetimes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      })
        .then(response => {
          status = response.status;
          return response.json();
        })
        .then(result => {
          console.log("status", status);
          if (status === 201) {
            setDatetimes([
              ...datetimes,
              result
            ]);
            setVisibleTimeModal(false);
          }
        })
        .catch(err => {
          console.log("err", err);
        });
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

  const handleUpdateSignUp = values => {
    console.log("values", values);
    let status = null;
    fetch(`/api/signups/${id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(values)
    })
      .then(response => {
        status = response.status;
        return response.json();
      })
      .then(result => {
        if (status === 200) history.push(`/signups`);
      })
      .catch(err => {
        console.log("err", err);
      });
  };

  return (
    <div>
      <Card title="Edit Sign Up">

        {signUpResponse &&
        <Form name="signup" initialValues={signUpResponse} onFinish={handleUpdateSignUp} layout="vertical">
          <Form.Item label="Title" name="title" rules={[{required: true}]}>
            <Input.TextArea rows={2} placeholder="What is the title for your form?"/>
          </Form.Item>

          <Form.Item label="Description" name="description" rules={[{required: false}]}>
            <Input.TextArea rows={4} placeholder="What is the purpose of your form?"/>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={savingSignup}>
              Save
            </Button>
          </Form.Item>
        </Form>}
      </Card>

      <br/>

      <Card title="Date-Time and Slots" extra={<Space>
        <Button onClick={() => setVisibleTimeModal(true)}>Add New Date & Time</Button>
        <Button onClick={() => setVisibleTimeModal(true)}>Add New Slot</Button>
      </Space>}>
        <Table columns={columns} dataSource={datetimes.map((d, i) => ({key: i, ...d}))}/>
      </Card>

      <Modal
        visible={visibleTimeModal}
        title="Pick Date and Time"
        onOk={dateTimeForm.submit}
        onCancel={handleTimeModalCancel}
      >
        <Form name="" form={dateTimeForm} onFinish={handleTimeModalOk}>
          <Form.Item label="Date" name="date" validateStatus={errors.date && "error"}
                     help={errors.date && "Please select the correct date"}>
            <DatePicker/>
          </Form.Item>

          <Form.Item label="Time" name="time" validateStatus={errors.time && "error"}
                     help={errors.time && "Please select the time"}>
            <TimePicker.RangePicker use12Hours={true} format={'HH:mm'} minuteStep={15}/>
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
