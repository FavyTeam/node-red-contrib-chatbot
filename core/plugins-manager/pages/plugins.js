import React, { useMemo, useState, Fragment } from 'react';
import { Notification, Message, FlexboxGrid, Input, Checkbox } from 'rsuite';
import { useMutation, useApolloClient } from 'react-apollo';
import useFetch from 'use-http';

import ModalLoader from '../../../src/components/loader-modal';
import PageContainer from '../../../src/components/page-container';
import Breadcrumbs from '../../../src/components/breadcrumbs';
import Confirm from '../../../src/components/confirm';
import ShowError from '../../../src/components/show-error';
import useSettings from '../../../src/hooks/settings';
import { TableFilters } from '../../../src/components';

import { INSTALL_PLUGIN, CHATBOT, UNISTALL_PLUGIN, UPDATE_PLUGIN } from '../queries';
import PluginPanel from './plugin-panel';


const usePlugins = ({ onCompleted = () => {} } = {}) => {
  const [
    install,
    { loading: installLoading, error: installError },
  ] = useMutation(INSTALL_PLUGIN, { onCompleted });
  const [
    uninstall,
    { loading: uninstallLoading, error: uninstallError },
  ] = useMutation(UNISTALL_PLUGIN, { onCompleted });
  const [
    update,
    { loading: updateLoading, error: updateError },
  ] = useMutation(UPDATE_PLUGIN, { onCompleted });

  return {
    saving: installLoading || uninstallLoading || updateLoading,
    error: installError || uninstallError || updateError,
    install,
    uninstall,
    update
  };
};

const filtersSchema = [
  {
    name: 'Name',
    type: 'string',
    name: 'name',
    control: Input,
    label: 'Search plugin'
  }
];

const CheckTree = ({ value = [], onChange, data }) => {
  return (
    <div>
      {data.map(item => (
        <Checkbox
          key={item.value}
          checked={value != null && value.includes(item.value)}
          onChange={() => {
            if (value != null && value.includes(item.value)) {
              onChange(value.filter(keyword => keyword != item.value))
            } else if (value != null && !value.includes(item.value)) {
              onChange([...value, item.value]);
            } else {
              onChange([item.value]);
            }
          }}
        >
          <span className="plugin-keyword">
            {item.label} <span className="count">{item.count}</span>
          </span>
        </Checkbox>
      ))}
    </div>
  );
};



const PluginsManager = ({ dispatch }) => {
  const { environment } = useSettings();
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const client = useApolloClient();
  // json id is hard coded, general users don't have market place plugin
  const { data: plugins, get, error: fetchError } = useFetch('https://api.jsonbin.io/b/5ed90ec1655d87580c43c899/latest', {}, []);
  const { install, uninstall, update, saving, error: pluginError } = usePlugins({
    onCompleted: async () => {
      try {
        const response = await client.query({ query: CHATBOT, fetchPolicy: 'network-only' });
        dispatch({ type: 'updateChatbot', chatbot: response.data.chatbot });
      } catch(e) {
        setError(e);
      }
    }
  });

  const pageError = error || fetchError || pluginError;
  const loading = plugins == null;

  // collect all keywords
  const keywordsData = useMemo(() => {
    if (plugins != null) {
      const keywords = {};
      plugins.forEach(plugin => {
        if (!_.isEmpty(plugin.keywords)) {
          plugin.keywords
            .forEach(keyword => keywords[keyword] = keywords[keyword] != null ? keywords[keyword] + 1 : 1);
        }
      });
      return Object.keys(keywords).sort().map(key => ({
        value: key,
        label: key,
        count: keywords[key]
      }));
    }
  }, [plugins]);

  return (
    <PageContainer className="page-plugins">
      <Breadcrumbs pages={['Plugins']}/>
      <FlexboxGrid justify="space-between">
        <FlexboxGrid.Item colspan={17} style={{ paddingTop: '20px', paddingLeft: '20px' }}>
          {pageError != null && (
            <ShowError
              onClear={() => window.location.reload()}
              error={pageError}
            />
          )}
          {environment === 'development' && (
            <Message
              type="warning"
              title="Development mode"
              description={<p>
                Your are in <strong>development mode</strong>, all plugins are loaded with <code>import ... from ... </code> defined in
                the file <code>./plugins.js</code>, this is a development mode, any changes to a plugin will cause reload, installing and uninstallig plugins
                in this page will not affect the plugins actually loaded.
              </p>}
            />
          )}
          {loading && pageError == null && <ModalLoader />}
          {!loading && !_.isEmpty(plugins) && (
            <Fragment>
              <div className="plugins">
                {plugins
                  .filter(plugin => _.isEmpty(filters.name) || plugin.name.toLowerCase().includes(filters.name.toLowerCase()))
                  .filter(plugin => _.isEmpty(filters.keywords) || _.isEmpty(plugin.keywords) || _.intersection(filters.keywords, plugin.keywords).length !== 0)
                  .map(plugin => (
                    <PluginPanel
                      key={plugin.id}
                      plugin={plugin}
                      plugins={plugins}
                      disabled={saving || loading}
                      onInstall={async plugin => {
                        if (await Confirm(
                          <div>Install plugin <strong>{plugin.name}</strong> ?</div>,
                          { okLabel: 'Ok, install'}
                        )) {
                          try {
                            await install({ variables: {
                              plugin: plugin.id,
                              url: plugin.url,
                              version: plugin.version,
                              initialConfiguration: plugin.initialConfiguration,
                              initialContent: plugin.content
                            }});
                            Notification.success({
                              placement: 'topStart',
                              title: 'Installed', description: `Plugin "${plugin.id}" installed succesfully` });
                          } catch(e) {
                            Notification.error({ placement: 'topStart', title: 'Error', description: `Something went wrong trying to install the plugin "${plugin.id}"` });
                          }
                        }
                      }}
                      onUpdate={async plugin => {
                        if (await Confirm(
                          <div>Update plugin <strong>{plugin.name}</strong> to version <em>{plugin.version}</em>?</div>,
                          { okLabel: 'Ok, update'}
                        )) {
                          try {
                            await update({ variables: {
                              plugin: plugin.id,
                              url: plugin.url,
                              version: plugin.version,
                              initialConfiguration: plugin.initialConfiguration
                            }});
                            Notification.success({
                              placement: 'topStart',
                              title: 'Updated', description: `Plugin "${plugin.id}" updated succesfully to version ${plugin.version}` });
                          } catch(e) {
                            Notification.error({ placement: 'topStart', title: 'Error', description: `Something went wrong trying to install the plugin "${plugin.id}"` });
                          }
                        }
                      }}
                      onUninstall={async plugin => {
                        if (await Confirm(
                          <div>Uninstall plugin <strong>{plugin.name}</strong> ?</div>,
                          { okLabel: 'Ok, uninstall'}
                        )) {
                          try {
                            await uninstall({ variables: { plugin: plugin.id }});
                            Notification.success({ placement: 'topStart', title: 'Unistalled', description: `Plugin "${plugin.name}" uninstalled succesfully` });
                          } catch(e) {
                            Notification.error({ placement: 'topStart', title: 'Error', description: `Something went wrong trying to uninstall the plugin "${plugin.name}"` });
                          }
                        }
                      }}
                    />
                  ))
                }
              </div>
            </Fragment>
          )}
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={7} className="right-column">
          {keywordsData != null && (
            <Fragment>
              <TableFilters
                filters={filters}
                schema={filtersSchema}
                onChange={filters => setFilters(filters)}
              />
              <div style={{ marginTop: '15px' }}>
                <strong>Keywords</strong>
                {!_.isEmpty(filters.keywords) && (
                  <span className="clear-button">
                    (<a href="#" onClick={e => {
                      e.preventDefault();
                      setFilters({ ...filters, keywords: null });
                    }}>clear</a>)
                  </span>
                )}
              </div>
              <CheckTree
                data={keywordsData}
                value={filters.keywords}
                onChange={keywords => setFilters({ ...filters, keywords })}
                renderTreeNode={item => (
                  <span className="plugin-keyword">
                    {item.label} <span className="count">{item.count}</span>
                  </span>
                )}
              />
            </Fragment>
          )}
        </FlexboxGrid.Item>
      </FlexboxGrid>
    </PageContainer>
  );
};

export default PluginsManager;