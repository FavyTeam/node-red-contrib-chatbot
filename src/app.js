import React, { useReducer, useEffect, useState, useMemo} from 'react';
import ReactDOM from 'react-dom';
import { ApolloProvider } from 'react-apollo';
import { Container, Content, Loader } from 'rsuite';
import {
  BrowserRouter as Router,
  Switch,
  Route
} from 'react-router-dom';
import { CodePlug, plug, useCodePlug } from 'code-plug';


// Define the global scope to store the components shared with plugins
if (window.globalLibs == null) {
  window.globalLibs = {};
}

import compose from './helpers/compose-reducers';
import AppContext from './common/app-context';
import Sidebar from './layout/sidebar';
import Header from './layout/header';
import HomePage from './pages/home';
import { WebSocket as WebSocketReact } from './hooks/socket';
import PageNotFound from './layout/page-not-found';
import useClient from './hooks/client';
import { ModalProvider } from './components/modal';

// add an empty configuration menu, on order to be the first
plug('sidebar', null, {
  id: 'configuration',
  label: 'Configuration',
  permission: 'configure',
  icon: 'cog',
  order: 0,
  options: []
});


// Import plugins
import './components/index';
import './permissions';
import './plugins-core';

// add global define to import dinamically plugins
window.define = function(requires, factory) {
  let resolvedRequires = requires.map(lib => {
    if (lib.includes('/components')) {
      return window.globalLibs.Components;
    } else if (lib.includes('/hooks/socket')) {
      return window.globalLibs['hooks-socket'];
    } else if (window.globalLibs[lib] != null) {
      return window.globalLibs[lib];
    } else {
      console.warn(`Library "${lib}" is not present in the global export list`);
      return {};
    }
  });
  factory(...resolvedRequires);
};

// export global libraries for plugins
import * as globalReact from 'react';
import * as globalPropTypes from 'prop-types';
import * as globalCodePlug from 'code-plug';
import * as globalLodash from 'lodash';
import * as globalRsuite from 'rsuite';
import * as globalUseHttp from 'use-http';
import * as globalGraphQLTag from 'graphql-tag';
import * as globalReactApollo from 'react-apollo';
import globalUseSocket from './hooks/socket';

window.globalLibs.react = globalReact;
window.globalLibs['prop-types'] = globalPropTypes;
window.globalLibs['code-plug'] = globalCodePlug;
window.globalLibs.lodash = globalLodash;
window.globalLibs.rsuite = globalRsuite;
window.globalLibs['use-http'] = globalUseHttp;
window.globalLibs['graphql-tag'] = globalGraphQLTag;
window.globalLibs['react-apollo'] = globalReactApollo;
window.globalLibs['hooks-socket'] = globalUseSocket;

const initialState = {
  user: null
};

const usePrefetchedData = () => {
  const [platforms, setPlatforms] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [messageTypes, setMessageTypes] = useState([]);
  const [activeChatbots, setActiveChatbots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/redbot/platforms')
      .then(response => response.json())
      .then(response => setPlatforms(response.platforms))
      .then(() => fetch('/redbot/globals'))
      .then(response => response.json())
      .then(response => {
        setEventTypes(response.eventTypes);
        setMessageTypes(response.messageTypes);
        setActiveChatbots(response.activeChatbots);
        setLoading(false);
      });
  }, []);

  return { platforms, eventTypes, messageTypes, activeChatbots, loading };
};


const AppRouter = ({ codePlug, bootstrap }) => {
  const client = useClient(bootstrap.settings);
  const { items } = useCodePlug('pages', { permission: { '$intersect': bootstrap.user.permissions }})
  const { platforms, eventTypes, messageTypes, activeChatbots, loading } = usePrefetchedData();

  const reducers = useMemo(() => compose(...codePlug.getItems('reducers').map(item => item.view )));
  const [state, dispatch] = useReducer(reducers, { ...initialState, ...bootstrap });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '250px' }}>
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <ApolloProvider client={client}>
      <AppContext.Provider value={{ state, dispatch, client, platforms, eventTypes, messageTypes, activeChatbots }}>
        <WebSocketReact dispatch={dispatch}>
          <ModalProvider>
            <Router basename="/mc">
              <div className="mission-control-app">
                <Container className="mc-main-container">
                  <Sidebar/>
                  <Container className="mc-inner-container">
                    <Header/>
                    <Content className="mc-inner-content">
                      <Switch>
                        {items.map(({ view: View, props }) => (
                          <Route key={props.url} path={props.url} children={<View {...props} dispatch={dispatch}/>} />
                        ))}
                        <Route exact path="/" children={<HomePage dispatch={dispatch} codePlug={codePlug} />}/>
                        <Route path="*" component={PageNotFound} />
                      </Switch>
                    </Content>
                  </Container>
                </Container>
              </div>
            </Router>
          </ModalProvider>
        </WebSocketReact>
      </AppContext.Provider>
    </ApolloProvider>
  );

};

const App = ({ bootstrap }) => (
  <CodePlug>
    {codePlug => <AppRouter codePlug={codePlug} bootstrap={bootstrap}/>}
  </CodePlug>
);


console.log(
  `Bootstrapping %cMissionControl%c (%cmode:%c${window.mc_environment}%c)`,
  'font-weight:bold',
  'font-weight:normal',
  'color:#999999',
  'color:#ff6633','color:#000000'
);
if (window.mc_environment === 'development') {
 console.log(`%cWarning: plugins are loaded from ./plugins file since in development mode.
The list of installed plugins will not have any effect in development mode, run the application with %cDEV=plugin node-red%c`,
  'color:#999999',
  'font-family: monospace'
 );
} else if (window.mc_environment === 'plugin') {
  console.log(`%cWarning: running in plugin mode, plugins code is loaded from repo and installed locally.
In order to develop plugins, run the application with %cDEV=dev node-red%c`,
  'color:#999999',
  'font-family: monospace'
 );
}

(async function() {
  if (window.mc_environment === 'development') {
    await import('../plugins')
  }
  ReactDOM.render(<App bootstrap={bootstrap}/>, document.querySelector('#mission-control'));
})();


export default App;