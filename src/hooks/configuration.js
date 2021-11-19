import gql from 'graphql-tag';
import { useQuery, useMutation } from 'react-apollo';

import useSocket from './socket';

const GET_CONFIGURATION = gql`
query($namespace: String) {
  configurations(namespace: $namespace) {
    id
    namespace
    payload
  }
}
`;

const UPDATE_CONFIGURATION = gql`
mutation($configuration: NewConfiguration!) {
  createConfiguration(configuration: $configuration) {
    id,
    namespace,
    payload
  }
}
`;

const useConfiguration = ({
  namespace,
  onCompleted = () => {},
  onLoaded = () => {}
}) => {
  const { loading, error, data } = useQuery(GET_CONFIGURATION, {
    variables: { namespace },
    onCompleted: data => {
      let configurationValue;
      if (data != null && data.configurations != null && data.configurations.length !== 0) {
        try {
        configurationValue = JSON.parse(data.configurations[0].payload);
        } catch(e) {
          // do nothing
        }
      }
      onLoaded(configurationValue);
    }
  });
  const { sendMessage } = useSocket();

  let configurationValue;
  let parsingError;
  if (data != null && data.configurations != null && data.configurations.length !== 0) {
    try {
    configurationValue = JSON.parse(data.configurations[0].payload);
    } catch(e) {
      parsingError = `Invalid JSON in configuration "${namespace}"`;
    }
  }

  const [
    updateConfiguration,
    { loading: mutationLoading, error: mutationError },
  ] = useMutation(UPDATE_CONFIGURATION, { onCompleted });

  return {
    loading: loading,
    saving: mutationLoading,
    error: error || mutationError || parsingError,
    data: configurationValue,
    update: configuration => {
      updateConfiguration({
        variables: {
          configuration: {
            namespace,
            payload: JSON.stringify(configuration)
          }
        }
      });
      sendMessage('mc.configuration', { namespace, ...configuration });
    }
  };
};

export default useConfiguration;