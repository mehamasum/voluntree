import React, {useMemo, useState, useEffect} from 'react';
import {useParams} from "react-router-dom";
import {useFetch} from '../../../hooks';
import {postFetch} from '../../../actions';
import {Avatar, Button, Card, } from 'antd';
import {Typography, Modal, Input, Table} from 'antd';
import { Descriptions } from 'antd';
import InterestedVolunteers from '../InterestedVolunteers';
import {formatTime} from "../../../utils";
import { Row, Col } from 'antd';
import { PageHeader } from 'antd';
import { Tag } from 'antd';
import {truncateString} from '../../../utils';
import { Skeleton, } from 'antd';
const {TextArea} = Input;

const columns = [
    {
        title: 'Update',
        dataIndex: 'message',
        render: (text, record) => (
            <Typography.Text>{truncateString(record.message, 240)}</Typography.Text>
        )
    },
];

const PostEditView = props => {
    const {id} = useParams();
    const [post_response] = useFetch(`/api/voluntree/posts/${id}`);
    const [notification_response, setNotificationResponse] = useFetch(`/api/voluntree/posts/${id}/notifications/`);
    const [showModal, setShowModal] = useState(false);
    const [modalValue, setModalValue] = useState('');
    const [newNotificationFetch, setNewNotificationFetch] = useState(false);

    const post = useMemo(() => {
        if (!post_response) return {};
        return post_response;
    }, [post_response]);

    const tableData = useMemo(() => {
        if (!notification_response) return [];
        return notification_response.map(r => ({...r, key: r.id}));
    }, [notification_response]);

    useEffect(() => {
        if(newNotificationFetch) {
            fetch(`/api/voluntree/posts/${id}/notifications/`, {
                headers: {'Authorization': `Token ${localStorage.getItem('token')}` }
            }).then(results => {
                return results.json();
              })
              .then(response => {
                setNotificationResponse(response);
                return response;
            })
            setNewNotificationFetch(false);
        }
    }, [newNotificationFetch, id, setNotificationResponse])



    const onModalOk = () => {
        const postData = {
            'post': id,
            'message': modalValue
        }
        const[, , error] = postFetch(`/api/voluntree/notifications/`, postData);
        if(!error) {
            setNewNotificationFetch(true);
            setModalValue('');
            setShowModal(false);
        } else console.log('error', error);
    }

    return (
        <React.Fragment>
            <PageHeader
                onBack={() => window.history.back()}
                title="Post Details"
                tags={[<Tag color="success">Published</Tag>, <Tag color="success">Collecting Response</Tag>]}
            />

            <Card title="Post Details" extra={
                <Button danger>Stop Collecting Response</Button>
            }>

                <Descriptions>
                    <Descriptions.Item label="Facebook Link">
                        <Typography.Paragraph
                            copyable>{`https://facebook.com/${post.facebook_page_id}/posts/${post.facebook_post_id}`}</Typography.Paragraph>
                    </Descriptions.Item>
                </Descriptions>


                <div className="fb-post-embed-wrapper">
                    <div className="fb-post-embed">
                        <Card>
                            <Skeleton loading={!post_response} avatar active>
                                <Card.Meta
                                    avatar={
                                        <Avatar
                                            src={`https://graph.facebook.com/${post.facebook_page_id}/picture`}
                                        />
                                    }
                                    title={post.page_name}
                                    description={(
                                        <div>
                                            <Typography.Text type="secondary">{formatTime(post.created_at)}</Typography.Text>
                                            <br/>
                                            <br/>
                                            <Typography.Paragraph ellipsis={{rows: 10, expandable: true}}>{post.status}</Typography.Paragraph>
                                        </div>
                                    )}
                                />
                            </Skeleton>
                        </Card>
                    </div>
                </div>
            </Card>

            <br/>

            <Card title="Messenger Interaction">
                <Descriptions>
                    <Descriptions.Item label="Message for New Volunteer">
                        <Typography.Paragraph ellipsis={{rows: 2, expandable: true}}>{post.message_for_new_volunteer}</Typography.Paragraph>
                    </Descriptions.Item>
                </Descriptions>

                <Descriptions>
                    <Descriptions.Item label="Message for Returning Volunteer">
                        <Typography.Paragraph ellipsis={{rows: 2, expandable: true}}>{post.message_for_returning_volunteer}</Typography.Paragraph>
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            <br/>

            <Row gutter={16}>
                <Col span={12}>
                    <Card title="Sent Updates" extra={
                        <Button type="primary" className="messenger-btn" onClick={() => setShowModal(!showModal)}>
                            Send New Update
                        </Button>
                    }>
                        <Table columns={columns} dataSource={tableData}/>
                    </Card>
                </Col>
                <Col span={12}>
                    <Card title="Confirmed Volunteers">
                        <InterestedVolunteers id={id}/>
                    </Card>
                </Col>
            </Row>

            <div>
                <Modal
                    title="Send update to all volunteers of this event"
                    visible={showModal}
                    onOk={onModalOk}
                    onCancel={() => setShowModal(false)}
                >
                    <TextArea
                        value={modalValue}
                        onChange={e => setModalValue(e.target.value)}
                        placeholder="What do you want to share?"
                        autoSize={{minRows: 3, maxRows: 5}}
                    />
                </Modal>
            </div>
        </React.Fragment>
    );
};

export default PostEditView;
