import React, {useEffect, useState} from 'react';
import {Avatar, Card, Layout, Select, Typography} from 'antd';
import {useFetch} from '../../../hooks';
import VolunteerList from "./VolunnteerList";

const VolunteerListView = props => {
  const [pages] = useFetch('/api/pages/?limit=25&offset=0');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if(!pages) return;
    setSelected(pages.results[0].id);
  }, [pages])

  function handleChange(value) {
    console.log(`selected ${value}`);
    setSelected(value);
  }

  return (
    <React.Fragment>
      <Layout.Content className="center-content">
        <Card title="Connected Volunteers" extra={
          pages ? <Select
            loading={!pages}
            onChange={handleChange}
            defaultValue={pages.results[0] ? pages.results[0].id : ""}
          >
            {pages.results.map(p => (
              <Select.Option value={p.id} key={p.id}>
                <Avatar
                  src={`https://graph.facebook.com/${p.facebook_page_id}/picture`}
                  size="small"
                />
                <Typography.Text className="page-name">{p.name}</Typography.Text>
              </Select.Option>)
            )}
          </Select> : null
        }>
          {selected ? <VolunteerList pageId={selected}/> : null}
        </Card>
      </Layout.Content>
    </React.Fragment>
  );
};

export default VolunteerListView;
