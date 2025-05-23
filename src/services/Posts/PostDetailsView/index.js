import React, {useMemo} from 'react';
import {Avatar, Button, Card, Descriptions, Skeleton, Space, Tabs, Tag, Typography} from 'antd';
import {Link, useParams} from "react-router-dom";
import {useFetch} from '../../../hooks';
import {formatRelativeTime} from "../../../utils";
import InterestedVolunteers from "../InterestedVolunteers";

const {TabPane} = Tabs;

const PostDetailsView = () => {
  const {id} = useParams();
  const [postResponse, setPostResponse] = useFetch(`/api/posts/${id}/`);

  const post = useMemo(() => {
    if (!postResponse) return {};
    return postResponse;
  }, [postResponse]);


  return (
    <React.Fragment>
      <Card
        title={
          <Space>
            Post Details
            <Tag color="success" key="tag1">Published</Tag>
          </Space>
        }
        extra={
          <Space>
            {post.signup ? <Button type="default"><Link to={`/signups/${post.signup}/`}>View Sign Up</Link></Button> : null}

            <Button type="primary"><a target="_blank" rel="noopener noreferrer"
                       href={`https://facebook.com/${post.facebook_page_id}/posts/${post.facebook_post_id}`}>Open on Facebook</a></Button>
          </Space>
        }
      >

        <Tabs defaultActiveKey="1">
          <TabPane tab="Post" key="1">
            <div>
              <Descriptions>
                <Descriptions.Item label="Facebook Link">
                  <Typography.Paragraph copyable>
                    {`https://facebook.com/${post.facebook_page_id}/posts/${post.facebook_post_id}`}
                  </Typography.Paragraph>
                </Descriptions.Item>
              </Descriptions>
              <div>
                <div className="fb-post-embed">
                  <Card>
                    <Skeleton loading={!postResponse} avatar active>
                      <Card.Meta
                        avatar={<Avatar src={`https://graph.facebook.com/${post.facebook_page_id}/picture`}/>}
                        title={post.page_name}
                        description={(
                          <div>
                            <Typography.Text type="secondary">{formatRelativeTime(post.created_at)}</Typography.Text>
                            <br/>
                            <br/>
                            <Typography.Paragraph
                              className="fb-status"
                              ellipsis={{rows: 3, expandable: true}}>
                              {post.status}
                            </Typography.Paragraph>
                            {post.image ?
                              <img src={post.image} alt="Attached Image" className="fb-preview-image"/> : null}
                          </div>)}/>
                    </Skeleton>
                  </Card>
                </div>
              </div>
            </div>
          </TabPane>
          {post.signup && <TabPane tab="Volunteers" key="2">
            <InterestedVolunteers id={id}/>
          </TabPane>}
        </Tabs>


      </Card>

    </React.Fragment>);
};

export default PostDetailsView;
