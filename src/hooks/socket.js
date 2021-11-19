import React, { useEffect, useReducer } from 'react';
import { Notification } from 'rsuite';

import useSettings from './settings';
import SocketListener from '../../lib/socket';
import AppContext from '../common/app-context';

const SocketContext = React.createContext({});

let socketListener;

class RawWebSocket extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      ws: null
    };
  }

  onMessage = (topic, payload) => this.props.dispatch({ type: 'socket.message', topic, payload });
  onOpen = () => {
    this.props.dispatch({ type: 'socket.open' });
    Notification.success({ title: 'Connected!'});
  }

  componentDidMount() {
    const { settings } = this.props;

    if (socketListener == null) {
      const webSocketProtol = window.location.protocol.includes('https') ? 'wss' : 'ws';
      console.log(`Created listening socket ${webSocketProtol}://${settings.host}:1942`)
      socketListener = new SocketListener({ url: `${webSocketProtol}://${settings.host}:1942` });
    }

    socketListener
      .on('message', this.onMessage)
      .on('open', () => this.onOpen());
  }

  componentWillUnmount() {
    socketListener
      .off('message', this.onMessage)
      .off('open', this.onOpen);
  }

  render() {
    const { ws } = this.state;
    return (
      <SocketContext.Provider value={{ socketListener }}>{this.props.children}</SocketContext.Provider>
    );
  }
}

const withSettings = Component => {
  return ({ children, ...props }) => (
    <AppContext.Consumer>
      {({ state }) => {
        return (
          <Component {...props} settings={state.settings}>
            {children}
          </Component>
        );
      }}
    </AppContext.Consumer>
  )
}

const WebSocket = withSettings(RawWebSocket);


const useSocket = ({ reducer = () => {}, initialState = {}, onMessage = () => {} } = {}) => {
  const { host } = useSettings();
  const handler = (topic, payload) => {
    dispatch({ type: 'socket.message', topic, payload });
    onMessage(topic, payload);
  };
  // connect socket
  useEffect(() => {
    if (socketListener == null) {
      const webSocketProtol = window.location.protocol.includes('https') ? 'wss' : 'ws';
      console.log(`Created listeing socket ${webSocketProtol}://${host}:1942`);
      socketListener = new SocketListener({ url: `${webSocketProtol}://${host}:1942` });
    }
    socketListener.on('message', handler);
    return () => socketListener.off('message', handler);
  }, []);
  const [state, dispatch] = useReducer(reducer, initialState);

  return {
    state,
    dispatch,
    // deprecated, bad name
    sendMessage: (topic, payload) => socketListener.send(JSON.stringify({ topic, payload })),
    sendToInput: (topic, payload) => socketListener.send(JSON.stringify({ topic, payload }))
  };
}

export { useSocket as default, WebSocket, SocketContext };