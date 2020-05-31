import React from 'react';
import {Form, Input, Typography} from 'antd';

const FormLayoutDemo = () => {
    const [form] = Form.useForm();
    return (
        <div>
            <div>
                <Typography.Text type="secondary">To receive messages and other events sent by Messenger users, the app should enable webhooks integration.</Typography.Text>
            </div>
            <br/>
            <Form
                layout={'vertical'}
                form={form}
                initialValues={{
                    layout: 'vertical',
                }}
            >
                <Form.Item label="Callback URL">
                    <Input
                        placeholder="input placeholder"
                        value="https://50be959a.ngrok.io/api/facebook/webhook:messenger/"
                        onChange={()=>{}}
                    />
                </Form.Item>
                <Form.Item label="Verify Token">
                    <Input
                        placeholder="input placeholder"
                        value="super-secret"
                        type="password"
                        onChange={()=>{}}
                    />
                </Form.Item>
            </Form>
        </div>
    );
};

export default FormLayoutDemo;
