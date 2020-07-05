import React, {useState, Children} from "react";
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
    setdateTimeResponseUrl,
    showMultipleTimeAddSlot,
    setShowMultipleTimeAddSlot
    } = props;
  const [errors, setErrors] = useState({
    date: false,
    time_0: false
  });
  const [totalTimeSlot, setTotalTimeSlot] = useState(1);
  const [savingDatetime, setSavingDatetime] = useState(false);
  
  const handleTimeModalOk = (values, url = null, method = null) => {
    const { date } = values;
    const times = [];
    let raiseError = false;
    for( let i = 0 ; i < totalTimeSlot ; i++ ) {
      let idx = `time_${i}`;
      let time = values[idx];
      if( !time ) {
        raiseError = true;
       setErrors({
        idx: true
       });
      } else {
        let start_time =  time[0].format("HH:mm:ss");
        let end_time = time[1].format("HH:mm:ss");
        times.push({
          start_time,
          end_time
        });
    }
    }
    console.log('times', times, 'length', times.length);
   
    const fetchUrl = url || `/api/datetimes/`;
    const fetchMethod =  method || 'POST';
    if (raiseError || !date) {
      if(raiseError) return;
      setErrors(errors => ({
        date: !date,
      }));
    } else {
      setErrors(errors => ({
        date: false,
        time_0: false
      }));
      const data =  {
        signup: signUpId,
        date: date.format("YYYY-MM-DD"),
      }

      if( method ) { // for put request 
        data['start_time'] = times[0]['start_time']
        data['end_time'] = times[0]['end_time']
      } else { 
        data['times'] = times

      }

      console.log('data', data);
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
          setUpdateDatetimeUrl(null);
          setShowMultipleTimeAddSlot(false);
          setTotalTimeSlot(1);
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

  const getTimeSlots = () => {
    const children = [];
    for( let i = 0 ; i < totalTimeSlot ; i++ ) { 
        children.push(
          <Form.Item label="Time" name={`time_${i}`}  key={i} validateStatus={errors.time && "error"}
              help={errors.time && "Please select the time"}>
            <TimePicker.RangePicker use12Hours={true} format={'HH:mm'} minuteStep={15}/>
          </Form.Item>
        );
    }
    return children;
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

      {getTimeSlots()}
      { showMultipleTimeAddSlot ? (  <Form.Item>
        <Button
          type="dashed"
          style={{width: '60%'}}
          onClick={()=> setTotalTimeSlot(totalTimeSlot + 1 )}
        >
          <PlusOutlined/> Add another time slot
        </Button>
      </Form.Item>) : '' }
    
    </Form>
  </Modal>
}