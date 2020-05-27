import React, {useMemo} from 'react';
import Template from '../../../template';
import {useParams} from "react-router-dom";
import {useFetch} from '../../../hooks';
import {Avatar, Badge, Button, Card, Space} from 'antd';
import {Alert, Typography} from 'antd';
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

const PostEditView = props => {
    const {id} = useParams();
    const [post_response, , , , status] = useFetch(`/api/voluntree/posts/${id}`);
    const [interest_response, , setUrl] = useFetch(`/api/voluntree/posts/${id}/interests/`);

    const post = useMemo(() => {
        if (!post_response) return {};
        return post_response;
    }, [post_response]);

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
                        <Button type="primary" className="messenger-btn">
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

        </React.Fragment>
    );
};

export default PostEditView;
