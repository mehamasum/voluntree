import React from 'react';
import {Card, Button} from 'antd';
import {useFetch} from '../../hooks';
import PageListView from './PageListView';
import FormLayoutDemo from "./Webhooks";


const Settings = props => {
    const [oauth_url] = useFetch('/api/voluntree/facebook/oauth_url/')

    const onClickConnect = () => {
        window.open(oauth_url, "Popup", "width=800,height=800");
    };

    return (
        <div>
            <div className="create-new-post">
                <Button type="primary" disabled={!oauth_url} onClick={onClickConnect}>
                    Connect Facebook Pages
                </Button>
            </div>
            <Card title="Connected Pages">
                <PageListView/>
            </Card>

            <br/>

            <div>
                <Card title="Webhooks">
                    <FormLayoutDemo/>
                </Card>
            </div>
        </div>
    );
};

export default Settings;
