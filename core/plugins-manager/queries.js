import gql from 'graphql-tag';

const INSTALL_PLUGIN = gql`
mutation (
  $plugin: String!,
  $url: String!,
  $version: String!,
  $initialConfiguration: String,
  $initialContent: InputContent,
  $chatbotId: String
  ) {
  installPlugin(
    plugin: $plugin,
    url: $url,
    version: $version,
    initialConfiguration: $initialConfiguration,
    initialContent: $initialContent,
    chatbotId: $chatbotId
  ) {
    id,
    plugin,
    filename,
    version
  }
}`;

const UPDATE_PLUGIN = gql`
mutation (
  $plugin: String!,
  $url: String!,
  $version: String!,
  $initialConfiguration: String,
  $chatbotId: String
  ) {
  updatePlugin(
    plugin: $plugin,
    url: $url,
    version: $version,
    initialConfiguration: $initialConfiguration,
    chatbotId: $chatbotId
  ) {
    id,
    plugin,
    filename,
    version
  }
}`;

const UNISTALL_PLUGIN = gql`
mutation($plugin: String!, $chatbotId: String) {
  uninstallPlugin(plugin: $plugin, chatbotId: $chatbotId) {
    id
  }
}`;

const CHATBOT = gql`
query($chatbotId: String) {
  chatbot(chatbotId: $chatbotId) {
    id,
    name,
    description,
    plugins {
      id,
      plugin,
      filename,
      version
    }
  }
}`;

export { INSTALL_PLUGIN, CHATBOT, UNISTALL_PLUGIN, UPDATE_PLUGIN };