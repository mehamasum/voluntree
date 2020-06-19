import React, {useEffect, useState} from "react";
import {Button, Card, Descriptions, Form, Input, Modal, Select, Typography} from "antd";
import {useParams} from "react-router-dom";
import {useFetch} from '../../../hooks';
import {formatDate, formatTime, makeColorGenerator} from "../../../utils";
import _ from 'lodash';

import DateTimeSlots from './DateTimeSlots';
import TimeModal from './TimeModal';

const generateColor = makeColorGenerator();

export default function SignUpForm(props) {
  const {id} = useParams();
  const [signUpResponse] = useFetch(`/api/signups/${id}/`);
  const [dateTimesResponse] = useFetch(`/api/signups/${id}/date_times/`);
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
  const {editable} = props;

  useEffect(() => {
    if (!dateTimesResponse) return;
    setDatetimes(dateTimesResponse);
  }, [dateTimesResponse]);


  const onSubmitSignUp = values => {
  };

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

        const clonedDateTimes = _.clone(datetimes);
        const ids = _.map(_.filter(datetimes, datetime => _.includes(result.date_times, datetime.id)), 'id');
        _.forEach(ids, id => {
          const index = _.findIndex(clonedDateTimes, ['id', id]);
          clonedDateTimes[index].slots = [
            ...clonedDateTimes[index].slots,
            result
          ]
        })
        setDatetimes(clonedDateTimes);
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
      {
        editable ?
          <Card title="Sign Up">

            {signUpResponse &&
            (
              <Form name="signup" initialValues={signUpResponse} onFinish={handleUpdateSignUp} layout="vertical">
                <Form.Item label="Title" name="title" rules={[{required: editable}]}>
                  <Input.TextArea rows={2} disabled={!editable} placeholder="What is the title for your form?"/>
                </Form.Item>

                <Form.Item label="Description" name="description" rules={[{required: false}]}>
                  <Input.TextArea rows={4} disabled={!editable} placeholder="What is the purpose of your form?"/>
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={savingSignup}>
                    Save
                  </Button>
                </Form.Item>
              </Form>)

            }
          </Card>

          :
          <div>
            <Descriptions>
              <Descriptions.Item label="Title">
                <Typography.Paragraph>
                  {signUpResponse && signUpResponse.title}
                </Typography.Paragraph>
              </Descriptions.Item>
            </Descriptions>
            <Descriptions>
              <Descriptions.Item label="Description">
                <Typography.Paragraph>
                  {signUpResponse && signUpResponse.description}
                </Typography.Paragraph>
              </Descriptions.Item>
            </Descriptions>
            <Descriptions>
              <Descriptions.Item label="Created">
                <Typography.Paragraph>
                  {signUpResponse && formatDate(signUpResponse.created_at)}
                </Typography.Paragraph>
              </Descriptions.Item>
            </Descriptions>
          </div>


      }
      <br/>

      <DateTimeSlots
        editable={editable}
        datetimes={datetimes}
        setVisibleTimeModal={setVisibleTimeModal}
        setVisibleSlotModal={setVisibleSlotModal}
        signUpId={id}
        visibleTimeModal={visibleTimeModal}
        setDatetimes={setDatetimes}
      />


      <TimeModal
        signUpId={id}
        visibleTimeModal={visibleTimeModal}
        setVisibleTimeModal={setVisibleTimeModal}
        datetimes={datetimes}
        setDatetimes={setDatetimes}
      />

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
