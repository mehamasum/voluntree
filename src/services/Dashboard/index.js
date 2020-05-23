import React from 'react';

import Template from '../../template';
import PostList from '../Posts/PostListView';

const Dashboard = ({...props}) => {
    return (
        <Template {...props}>
            <PostList />
        </Template>
    )
};


export default Dashboard;