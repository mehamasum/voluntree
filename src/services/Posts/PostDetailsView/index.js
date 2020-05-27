import React, {useMemo, useState} from 'react';
import Template from '../../../template';
import {useParams} from "react-router-dom";
import {useFetch} from '../../../hooks';
import {Avatar, Badge, Button, Card, Space} from 'antd';
import {Alert, Typography, Modal, Input} from 'antd';
import { Descriptions } from 'antd';
import {
    LinkOutlined,
} from '@ant-design/icons';
import {Layout} from 'antd';
import InterestedVolunteers from '../InterestedVolunteers';
import {formatTime} from "../../../utils";
import { Row, Col } from 'antd';
import { PageHeader } from 'antd';
import { Tag } from 'antd';
import { Checkbox } from 'antd';

const {Content} = Layout;
const {TextArea} = Input;

const PostEditView = props => {
    const {id} = useParams();
    const [post_response, , , , status] = useFetch(`/api/voluntree/posts/${id}`);
    const [interest_response, , setUrl] = useFetch(`/api/voluntree/posts/${id}/interests/`);
    const [showModal, setShowModal] = useState(false);
    const [modalValue, setModalValue] = useState('');
    const post = useMemo(() => {
        if (!post_response) return {};
        return post_response;
    }, [post_response]);

    const onModalOk = () => {
        // write code
        setModalValue('');
        setShowModal(false);
    }
 
    return (
        <React.Fragment>
            <PageHeader
                onBack={() => window.history.back()}
                title="Post Details"
                tags={[<Tag color="success">Published</Tag>, <Tag color="success">Collecting Response</Tag>]}
            />
            <Card title="Details" extra={
                <Button danger>Stop Collecting Responses</Button>
            }>
                <Descriptions>
                    <Descriptions.Item label="Posted to">
                        <Avatar
                            src={`https://graph.facebook.com/${post.facebook_page_id}/picture`}
                        />
                        &nbsp;&nbsp;
                        {post.page_name}
                    </Descriptions.Item>
                </Descriptions>


                <Descriptions>
                    <Descriptions.Item label="Posted at">{formatTime(post.created_at)}</Descriptions.Item>
                    <Descriptions.Item label="Facebook Link">
                        <Typography.Paragraph copyable>{`https://facebook.com/${post.facebook_page_id}/posts/${post.facebook_post_id}`}</Typography.Paragraph>
                    </Descriptions.Item>
                </Descriptions>

                <Descriptions>
                    <Descriptions.Item label="Status">
                        <Typography.Paragraph ellipsis={{ rows: 3, expandable: true }}>{post.status}</Typography.Paragraph>
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            <br/>

            <Row gutter={16}>
                <Col span={12}>
                    <Card title="Updates" extra={
                        <Button type="primary" className="messenger-btn" onClick={() => setShowModal(!showModal)}>
                            <svg className="messenger-icon" width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd"><path d="M12 0c-6.627 0-12 4.975-12 11.111 0 3.497 1.745 6.616 4.472 8.652v4.237l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111 0-6.136-5.373-11.111-12-11.111zm1.193 14.963l-3.056-3.259-5.963 3.259 6.559-6.963 3.13 3.259 5.889-3.259-6.559 6.963z"/></svg>
                            Send new update
                        </Button>
                    }>
                        Table of Notifications
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
                title="Message to All Volunteers"
                visible={showModal}
                onOk={onModalOk}
                onCancel={() => setShowModal(false)}
                >
                <TextArea
                    value={modalValue}
                    onChange={e => setModalValue(e.target.value)}
                    placeholder="Controlled autosize"
                    autoSize={{ minRows: 3, maxRows: 5 }}
                />
                </Modal>
            </div>
        </React.Fragment>
    );
};

export default PostEditView;
