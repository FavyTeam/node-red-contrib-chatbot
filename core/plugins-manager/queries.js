import gql from 'graphql-tag';

const INSTALL_PLUGIN = gql`
mutation ($plugin: String!, $url: String!, $version: String!, $initialConfiguration: String, $initialContent: InputContent) {
  installPlugin(plugin: $plugin, url: $url, version: $version, initialConfiguration: $initialConfiguration, initialContent: $initialContent) {
    id,
    plugin,
    filename,
    version
  }
}`;

const UPDATE_PLUGIN = gql`
mutation ($plugin: String!, $url: String!, $version: String!, $initialConfiguration: String) {
  updatePlugin(plugin: $plugin, url: $url, version: $version, initialConfiguration: $initialConfiguration) {
    id,
    plugin,
    filename,
    version
  }
}`;

const UNISTALL_PLUGIN = gql`
mutation($plugin: String!) {
  uninstallPlugin(plugin: $plugin) {
    id
  }
}`;

const CHATBOT = gql`
query {
  chatbot {
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