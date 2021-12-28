import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import gravatar from 'gravatar';
import { Tooltip, Whisper, Header, Navbar, Dropdown, Nav, Icon, IconButton, Avatar, SelectPicker } from 'rsuite';
import { useCodePlug } from 'code-plug';
import { Link, useHistory } from 'react-router-dom';
import _ from 'lodash';
import useFetch from 'use-http';

import AppContext from '../common/app-context';
import useCurrentUser from '../hooks/current-user';
import useLocalStorage from '../hooks/use-local-storage';

const initials = user => {
  if (user.firstName != null && user.firstName.length !== 0 && user.lastName != null && user.lastName.length !== 0) {
    return user.firstName.substr(0, 1) + user.lastName.substr(0, 1);
  } else if (user.firstName != null && user.firstName.length !== 0 ) {
    return user.firstName.substr(0, 2);
  } else if (user.lastName != null && user.lastName.length !== 0) {
    return user.lastName.substr(0, 2);
  }
  return '';
}

const extendedName = user => {
  const names = [];
  if (!_.isEmpty(user.firstName)) {
    names.push(user.firstName);
  }
  if (!_.isEmpty(user.lastName)) {
    names.push(user.lastName);
  }
  return !_.isEmpty(names) ? names.join(' ') : user.username;
}

const sortBy = (a, b) => {
  if (a.order == null && b.order == null) {
    return 0;
  } else if (b.order == null) {
    return -1;
  } else if (a.order == null) {
    return 1;
  } else if (a.order < b.order) {
    return -1;
  } else if (a.order > b.order) {
    return 1;
  }
  return 0;
};


const renderButton = (props, ref) => {
  console.log('prop button', props)
  return (
    <div style={{

      paddingRight: '20px'

    }}>
      <button ref={ref} style={{
        fontSize: '14px',
        backgroundColor: '#ffffff',
        height: '56px',
        color: '#000000',
        paddingRight: '20px'

      }}>
        {props}
      </button>
    </div>
  );
};

const ChatbotsSelector = ({ chatbots, value, onChange }) => {
  const chatbot = chatbots.find(({ chatbotId }) => chatbotId === value);

  return (
    <SelectPicker
      style={{ marginTop: '11px', marginRight: '15px' }}
      value={value}
      data={chatbots.map(({ chatbotId, name }) => ({ value: chatbotId, label: name }))}
      appearance="subtle"
      placeholder="Select chatbot"
      cleanable={false}
      searchable={false}
      menuStyle={{ zIndex: 100000000 }}
      onChange={onChange}
    />
  )
};

const AppHeader = () => {
  const [, setChatbotId] = useLocalStorage('chatbotId', undefined);
  const { post } = useFetch('/mc/logout');
  const { user } = useCurrentUser();
  const { state, dispatch } = useContext(AppContext);
  const history = useHistory();
  const { permissionQuery } = useCurrentUser();
  const { props } = useCodePlug('menu', permissionQuery);
  const { needRestart } = state;

  return (
    <Header className="mc-header">
      <Navbar appearance="inverse">
        <Navbar.Body>
          <Nav>
            <Nav.Item renderItem={() => <Link className="rs-nav-item-content" to="/">Home</Link>} />
            {props
              .sort(sortBy)
              .map(({ label, onClick = () => {}, url, id }) => {
                return (
                  <Nav.Item
                    key={id}
                    renderItem={() => <Link className="rs-nav-item-content" to={url}>{label}</Link>}
                  />
                );
              })
            }
          </Nav>
          <Nav pullRight>
            <ChatbotsSelector
              chatbots={state.chatbots}
              value={state.chatbotId}
              onChange={(chatbotId => {
                dispatch({ type: 'selectChatbot', chatbotId });
                setChatbotId(chatbotId);
              })}
            />
            {user.isEmptyPassword && (
              <Whisper
                placement="left"
                trigger="hover"
                speaker={<Tooltip>Current user has no password!</Tooltip>}
              >
                <IconButton
                  circle
                  style={{ marginTop: '7px', marginRight: '7px'}}
                  color="red"
                  size="lg"
                  onClick={() => history.push('/admins')}
                  icon={<Icon icon="exclamation-triangle" />}
                />
              </Whisper>
            )}
            {needRestart && (
              <Whisper
                placement="left"
                trigger="hover"
                speaker={<Tooltip>Reload page to see installed plugins</Tooltip>}
              >
                <IconButton
                  circle
                  style={{ marginTop: '7px', marginRight: '7px'}}
                  color="red"
                  size="lg"
                  onClick={() => window.location.reload()}
                  icon={<Icon icon="refresh" />}
                />
              </Whisper>
            )}
            <Dropdown
              className="mc-avatar"
              placement="bottomEnd"
              renderTitle={()=> (
                <Avatar src={user.avatar || gravatar.url(user.email)} circle>{initials(user)}</Avatar>)}
            >
              <Dropdown.Item><b>{extendedName(user)}</b></Dropdown.Item>
              <Dropdown.Item onSelect={() => window.location = '/'}>Node-RED</Dropdown.Item>
              <Dropdown.Item divider />
              <Dropdown.Item
                onSelect={async () => {
                  await post();
                  window.location.reload();
                }}
              >Logout</Dropdown.Item>
            </Dropdown>
          </Nav>
        </Navbar.Body>
      </Navbar>
    </Header>
  );
}
AppHeader.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    avatar: PropTypes.string,
    email: PropTypes.string
  })
};

export default AppHeader;