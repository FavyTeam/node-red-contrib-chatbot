import React from 'react';
import { FlexboxGrid } from 'rsuite';
import gql from 'graphql-tag';
import { useQuery, useMutation } from 'react-apollo';
import { Notification } from 'rsuite';
import _ from 'lodash';

import PageContainer from '../../../src/components/page-container';
import Breadcrumbs from '../../../src/components/breadcrumbs';
import ShowError from '../../../src/components/show-error';

import ConfigurationForm from '../views/configuration-form';

const GET_CHATBOT = gql`
query {
  chatbot {
    id,
    name,
    description,
    guid
  }
}
`;

const UPDATE_CHATBOT = gql`
mutation($chatbot: InputChatbot!) {
  editChatbot(chatbot: $chatbot) {
    id,
    name,
    description,
    guid
  }
}
`;

const ConfigureChatbot = () => {

  const { loading, error: loadError, data } = useQuery(GET_CHATBOT, { fetchPolicy: 'network-only' });
  const [
    editChatbot,
    { loading: editLoading, error: editError },
  ] = useMutation(UPDATE_CHATBOT, {
    onCompleted: () => Notification.success({ title: 'Configuration', description: 'Configuration saved successful' })
  });

  const ready = !loading;
  const disabled = editLoading;
  const error = loadError || editError;

  return (
    <PageContainer className="page-configuration">
      <Breadcrumbs pages={['Chatbot']}/>
      {error != null && <ShowError error={error} />}
      <FlexboxGrid justify="space-between">
        <FlexboxGrid.Item colspan={17} style={{ paddingTop: '20px', paddingLeft: '20px' }}>
          {ready && (
            <ConfigurationForm
              value={_.omit(data.chatbot, ['id', 'updatedAt', 'createdAt', '__typename'])}
              disabled={disabled}
              onSubmit={chatbot => editChatbot({ variables: { chatbot } })}
            />
          )}
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={7} style={{ paddingTop: '20px', paddingLeft: '20px' }}>

        </FlexboxGrid.Item>
      </FlexboxGrid>
    </PageContainer>
  );
};

export default ConfigureChatbot;