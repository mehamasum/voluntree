import React, {useState} from "react";
import {Button, DatePicker, Form, Modal, TimePicker,} from "antd";
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
export default function TimeModal(props) {

  const {
    visibleTimeModal,
    setVisibleTimeModal,
    signUpId,
    datetimes,
    setDatetimes,
    editable,
    dateTimeForm,
    updateDatetimeUrl,
    setUpdateDatetimeUrl,
    setdateTimeResponseUrl
    } = props;
  const [errors, setErrors] = useState({
    date: false,
    time: false
  });
  const [savingDatetime, setSavingDatetime] = useState(false);

  const handleTimeModalOk = (values, url = null, method = null) => {
    const {date, time} = values;
    const fetchUrl = url || `/api/datetimes/`;
    const fetchMethod =  method || 'POST';
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
        signup: signUpId,
        date: date.format("YYYY-MM-DD"),
        start_time: time[0].format("HH:mm:ss"),
        end_time: time[1].format("HH:mm:ss"),
      };
      setSavingDatetime(true);
      setdateTimeResponseUrl(null);
      fetch(fetchUrl, {
        method: fetchMethod,
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
          setdateTimeResponseUrl(`/api/signups/${signUpId}/date_times/`);
          setVisibleTimeModal(false);
          setSavingDatetime(false);
          dateTimeForm.resetFields();

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
  return <Modal
    visible={visibleTimeModal}
    title="Pick Date and Time"
    onOk={dateTimeForm.submit}
    onCancel={handleTimeModalCancel}
  >
    <Form
      name="datetime"
      form={dateTimeForm}
      onFinish={(values) => {
                  return handleTimeModalOk(values, updateDatetimeUrl, updateDatetimeUrl ? "PUT" : null)}
    }>
      <Form.Item label="Date" name="date" validateStatus={errors.date && "error"}
                 help={errors.date && "Please select the correct date"}>
        <DatePicker/>
      </Form.Item>

      <Form.Item label="Time" name="time" validateStatus={errors.time && "error"}
                 help={errors.time && "Please select the time"}>
        <TimePicker.RangePicker use12Hours={true} format={'HH:mm'} minuteStep={15}/>
      </Form.Item>

      <Form.Item>
        <Button
          type="dashed"
          style={{width: '60%'}}
        >
          <PlusOutlined/> Add another time slot
        </Button>
      </Form.Item>
    </Form>
  </Modal>
}