import React, { useState } from 'react';
import useFetch from 'use-http';

import {
  Content,
  Container,
  FlexboxGrid,
  Form,
  Button,
  Panel,
  ButtonToolbar,
  FormGroup,
  FormControl,
  HelpBlock,
  InputGroup,
  Icon
} from 'rsuite';

import { LogoFull } from '../components/logo';


const LoginPanel = () => {
  const [formValue, setFormValue] = useState({
    username: '',
    password: ''
  })
  const { post, loading, response} = useFetch('/mc/login');

  // it's pointless to useCallback
  const loginButton = async () => {
    await post(formValue)
    if (response.redirected) {
      if (response.url.includes('/login')) {
        alert('wrong login')
      } else {
        window.location = response.url;
      }
    }
  }

  return (
    <div className='container-login'>
      <Container>
        <Content>
          <FlexboxGrid justify="center">
            <FlexboxGrid.Item colspan={8} className="login-panel">
              <div className="logo"><LogoFull /></div>
              <Panel header={<h3>Mission Control</h3>} bordered>
                <Form fluid formValue={formValue} onChange={formValue => setFormValue(formValue)}>
                  <FormGroup>
                    <InputGroup inside>
                      <InputGroup.Addon>
                        <Icon icon="avatar" size="lg" />
                      </InputGroup.Addon>
                      <FormControl name="username" size="lg" />
                    </InputGroup>
                  </FormGroup>
                  <FormGroup>
                    <InputGroup inside>
                      <InputGroup.Addon>
                        <Icon icon="unlock-alt" size="lg" />
                      </InputGroup.Addon>
                      <FormControl
                        name="password"
                        type="password"
                        autoComplete="off"
                        size="lg"
                        onKeyUp={(e) => {
                          // auto login
                          if (e.keyCode === 13) {
                            loginButton();
                          }
                        }}
                      />
                    </InputGroup>
                  </FormGroup>
                  <FormGroup className="last">
                    <ButtonToolbar>
                      <Button appearance="primary" onClick={loginButton}>Login</Button>
                      <Button appearance="link">Forgot password?</Button>
                    </ButtonToolbar>
                  </FormGroup>
                </Form>
              </Panel>
            </FlexboxGrid.Item>
          </FlexboxGrid>
        </Content>
      </Container>
    </div>
  );
};

export default LoginPanel;
