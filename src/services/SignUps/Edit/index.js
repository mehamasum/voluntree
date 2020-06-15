import React, {useEffect, useState} from "react";
import {Button, Card, DatePicker, Form, Input, Modal, Select, Space, Table, TimePicker, Typography} from "antd";
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
      setSavingDatetime(true);
      fetch(`/api/datetimes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      })
        .then(response => {
          return response.json();
        })
        .then(result => {
          setDatetimes([
            ...datetimes,
            result
          ]);
          setVisibleTimeModal(false);
          setSavingDatetime(false);

        })
        .catch(err => {
          console.log("err", err);
          setSavingDatetime(false);
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
    setSavingSlot(true);
    fetch(`/api/slots/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(fieldsValue)
    })
      .then(response => {
        return response.json();
      })
      .then(result => {
        setVisibleSlotModal(false);
        setSavingSlot(false);

      })
      .catch(err => {
        console.log("err", err);
        setSavingSlot(false);

      });
  }

  const handleUpdateSignUp = values => {
    setSavingSignup(true);
    fetch(`/api/signups/${id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(values)
    })
      .then(response => {
        return response.json();
      })
      .then(result => {
        setSavingSignup(false);
      })
      .catch(err => {
        console.log("err", err);
        setSavingSignup(false);
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
        <Button onClick={() => setVisibleSlotModal(true)} disabled={!datetimes}>Add New Slot</Button>
      </Space>}>
        <Table columns={columns} dataSource={datetimes.map((d, i) => ({key: i, ...d}))}/>
      </Card>

      <Modal
        visible={visibleTimeModal}
        title="Pick Date and Time"
        onOk={dateTimeForm.submit}
        onCancel={handleTimeModalCancel}
        footer={[
          <Button key="back" onClick={handleTimeModalCancel}>
            Return
          </Button>,
          <Button key="submit" type="primary" loading={savingDatetime} onClick={dateTimeForm.submit} htmlType="submit"
                  form="datetime">
            Add Date & Time
          </Button>,
        ]}
      >
        <Form name="datetime" form={dateTimeForm} onFinish={handleTimeModalOk}>
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
            Add Slot
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
            label="Date & times"
            name="date_times"
            rules={[{required: true, message: 'Please select at least one Date & Time'}]}
          >
            <Select
              mode="multiple"
              placeholder="Please select date & time"
            >
              {datetimes.map(dt => <Select.Option key={dt.id} value={dt.id}>
                {formatDate(dt.date)} ({formatTime(dt.start_time) + " to " + formatTime(dt.end_time)})
              </Select.Option>)}
            </Select>
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
