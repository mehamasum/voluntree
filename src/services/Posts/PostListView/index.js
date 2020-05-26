import './index.css';

import React, {useMemo, useState, useCallback, useEffect} from 'react';
import {useFetch} from '../../../hooks';
import {Avatar, Card, Typography, Button} from 'antd';
import {Link} from "react-router-dom";
import {Table, Space} from 'antd';
import {
    LinkOutlined,
} from '@ant-design/icons';
import {truncateString, formatTime} from '../../../utils';



const columns = [
    {
        title: 'Status',
        dataIndex: 'status',
        width: '40%',
        render: (text, record) => (
            <Typography.Text>{truncateString(record.status, 240)}</Typography.Text>
        )
    },
    {
        title: 'Page',
        render: (text, record) => (
            <div>
                <Avatar
                    src={`https://graph.facebook.com/${record.facebook_page_id}/picture`}
                    size="small"
                />
                <Typography.Text className="page-name">{record.page_name}</Typography.Text>
            </div>
        )
    },
    {
        title: 'Publish Time',
        dataIndex: 'created_at',
        render: (text, record) => (
            <Typography.Text>{formatTime(record.created_at)}</Typography.Text>
        )
    },
    {
        title: 'Published Post',
        render: (text, record) => (
            <Space size="middle">
                <a target="_blank" rel="noopener noreferrer"
                   href={`https://facebook.com/${record.facebook_page_id}/posts/${record.facebook_post_id}`}><LinkOutlined/> View
                    on Facebook</a>
            </Space>
        ),
    },
    {
        title: 'Actions',
        render: (text, record) => (
            <Space size="middle">
                <Link to={`/posts/${record.id}`}>Details</Link>
            </Space>
        ),
    },
];

const PostListView = props => {
    const [posts_response, , setUrl] = useFetch('/api/voluntree/posts/?limit=25&offset=0');
    const [pagination, setPagination] = useState({current: 1, pageSize: 25, showSizeChanger: false});
    const [total, setTotal] = useState(0);

    const tableData = useMemo(() => {
        if (!posts_response) return [];
        return posts_response.results.map(r => ({...r, key: r.id}));
    }, [posts_response]);

    const onChangeTable = useCallback((pag) => {
        setPagination(pag);
        const offset = (pag.current - 1) * 25;
        setUrl(`/api/voluntree/posts/?limit=25&offset=${offset}`);
    }, [setPagination, setUrl]);

    useEffect(() => {
        if (!posts_response) return;
        setTotal(posts_response.count);
    }, [posts_response]);

    return (
        <div>
            <div className="create-new-post">
                <Button type="primary"><Link to={`/posts/create`}>Create New Post</Link></Button>
            </div>

            <Card title="Created Posts">
                <Table columns={columns} dataSource={tableData} pagination={{...pagination, total}}
                       onChange={onChangeTable}/>
            </Card>
        </div>
    );
};

export default PostListView;
