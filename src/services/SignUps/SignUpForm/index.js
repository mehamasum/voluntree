import React, {useEffect, useState} from "react";
import {Button, Card, Descriptions, Drawer, Form, Input, Modal, Select, Typography} from "antd";
import {useParams} from "react-router-dom";
import {useFetch} from '../../../hooks';
import {formatDate, formatTime} from "../../../utils";
import _ from 'lodash';

import DateTimeSlots from './DateTimeSlots';
import TimeModal from './TimeModal';
import Magic from "../../../components/Magic";
import {EyeOutlined} from "@ant-design/icons";


export default function SignUpForm(props) {
  const {id} = useParams();
  const [signUpResponse] = useFetch(`/api/signups/${id}/`);
  const [dateTimesResponse, , setdateTimeResponseUrl] = useFetch(`/api/signups/${id}/date_times/`);
  const [datetimes, setDatetimes] = useState([]);
  const [slotForm] = Form.useForm();
  const [dateTimeForm] = Form.useForm();
  const [updateDatetimeUrl, setUpdateDatetimeUrl] = useState(null);
  const [errors, setErrors] = useState({
    date: false,
    time: false
  });

  const [visibleTimeModal, setVisibleTimeModal] = useState(false);
  const [visibleSlotModal, setVisibleSlotModal] = useState(false);
  const [visiblePreview, setVisiblePreview] = useState(false);
  const [savingSlot, setSavingSlot] = useState(false);
  const [savingSignup, setSavingSignup] = useState(false);
  const {editable} = props;

  useEffect(() => {
    if (!dateTimesResponse) return;
    setDatetimes(dateTimesResponse);
  }, [dateTimesResponse]);


  const handleSlotModalCancel = () => {
    setVisibleSlotModal(false);
    slotForm.resetFields();
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
        slotForm.resetFields();
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
      <Card title="About" extra={<Button icon={<EyeOutlined />} onClick={() => setVisiblePreview(true)}>Preview Slot Picker</Button>}>
      {
        editable ?
          <div>

            {signUpResponse &&
            (
              <Form name="signup" initialValues={signUpResponse} onFinish={handleUpdateSignUp} labelCol={{span: 4}}>
                <Form.Item label="Title" name="title" rules={[{required: true}]}>
                  <Input
                    placeholder="Provide an accurate title to increase relevancy"
                  />
                </Form.Item>

                <Form.Item label="Description" name="description" rules={[{required: true}]}>
                  <Input.TextArea
                    placeholder="Provide a clear, well-defined and easy-to-understand description"
                    autoSize={{minRows: 3, maxRows: 5}}/>
                </Form.Item>

                <Form.Item label="Facts" name="facts" rules={[{required: false}]}
                           extra={<> <Magic/>This will help Voluntree to automatically reply to frequently asked
                             questions </>}
                >
                  <Input.TextArea
                    placeholder="Provide some facts about the signup that Voluntree AI can learn"
                    autoSize={{minRows: 5, maxRows: 10}}/>
                </Form.Item>

                <Form.Item wrapperCol={{offset: 4}}>
                  <Button type="primary" htmlType="submit" loading={savingSignup}>
                    Save
                  </Button>
                </Form.Item>
              </Form>)

            }
          </div>

          :
          <div>
            <Descriptions>
              <Descriptions.Item label="Title">
                  {signUpResponse && signUpResponse.title}
              </Descriptions.Item>
            </Descriptions>
            <Descriptions>
              <Descriptions.Item label="Description">
                  {signUpResponse && signUpResponse.description}
              </Descriptions.Item>
            </Descriptions>
            <Descriptions>
              <Descriptions.Item label="Created">
                  {signUpResponse && formatDate(signUpResponse.created_at)}
              </Descriptions.Item>
            </Descriptions>
            <Descriptions>
              <Descriptions.Item label={<>Facts <Magic/></>}>
                  {signUpResponse && signUpResponse.facts}
              </Descriptions.Item>
            </Descriptions>
          </div>


      }
      </Card>

      <br/>

      <DateTimeSlots
        editable={editable}
        datetimes={datetimes}
        setVisibleTimeModal={setVisibleTimeModal}
        setVisibleSlotModal={setVisibleSlotModal}
        signUpId={id}
        visibleTimeModal={visibleTimeModal}
        setDatetimes={setDatetimes}
        setdateTimeResponseUrl={setdateTimeResponseUrl}
        slotForm={slotForm}
        dateTimeForm={dateTimeForm}
        setUpdateDatetimeUrl={setUpdateDatetimeUrl}
      />


      <TimeModal
        signUpId={id}
        visibleTimeModal={visibleTimeModal}
        setVisibleTimeModal={setVisibleTimeModal}
        datetimes={datetimes}
        setDatetimes={setDatetimes}
        dateTimeForm={dateTimeForm}
        updateDatetimeUrl={updateDatetimeUrl}
        setUpdateDatetimeUrl={setUpdateDatetimeUrl}
      />

      <Modal
        visible={visibleSlotModal}
        title="Create a new slot"
        onOk={slotForm.submit}
        onCancel={handleSlotModalCancel}
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
          form={slotForm}
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
      <Drawer
          width={400}
          placement="right"
          onClose={() => setVisiblePreview(false)}
          destroyOnClose
          visible={visiblePreview}
        >
        <div className="preview-container">
          <Typography.Text>Preview</Typography.Text>
          <iframe
            className="preview-frame"
            src={`/messenger/signup-preview/${id}/`}
            frameBorder="no"
            title="Slot Picker Preview"
            width="100%"
            height="100%"
          />
        </div>
      </Drawer>
    </div>
  );
}
