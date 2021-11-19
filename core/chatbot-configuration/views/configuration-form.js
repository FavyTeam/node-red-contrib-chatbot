import React, { useState, useRef } from 'react';
import { Form, FormGroup, ControlLabel, FormControl, Schema, ButtonToolbar, Button, HelpBlock, FlexboxGrid } from 'rsuite';

import confirm from '../../../src/components/confirm';

const { StringType } = Schema.Types;

const chatbotModel = Schema.Model({
  name: StringType()
    .isRequired('Name is required'),
  guid: StringType()
    .rangeLength(36, 36, 'Wrong length (should be 36 chars)')
    .isRequired('Name is required')
});

const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    .replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
};

const ConfigurationForm = ({
  value,
  disabled = false,
  onSubmit = () => {}
}) => {
  const form = useRef(null);
  const [formValue, setFormValue] = useState(value);
  const [formError, setFormError] = useState();

  return (
    <div>
      <Form
        ref={form}
        checkTrigger="none"
        model={chatbotModel}
        formValue={formValue}
        formError={formError}
        onCheck={errors => setFormError(errors)}
        onChange={formValue => {
          setFormValue(formValue);
          setFormError(null);
        }}
        fluid autoComplete="off"
      >
        <FormGroup>
          <ControlLabel>Chatbot Id</ControlLabel>
          <FlexboxGrid justify="space-between">
            <FlexboxGrid.Item colspan={20}>
              <FormControl
                disabled={disabled}
                name="guid"
              />
            </FlexboxGrid.Item>
            <FlexboxGrid.Item colspan={3}>
              <Button
                onClick={() => {
                  setFormValue({ guid: uuidv4() })
                }}
                disabled={disabled}
              >Generate</Button>

            </FlexboxGrid.Item>
          </FlexboxGrid>

          <HelpBlock>
            This is a unique identifier of the chatbot.
          </HelpBlock>
        </FormGroup>
        <FormGroup>
          <ControlLabel>Name</ControlLabel>
          <FormControl
            disabled={disabled}
            name="name"
          />
        </FormGroup>
        <FormGroup>
          <ControlLabel>Description</ControlLabel>
          <FormControl
            disabled={disabled}
            name="description"
            componentClass="textarea"
          />
        </FormGroup>
        <FormGroup style={{ marginTop: '40px' }}>
          <ButtonToolbar>
            <Button
              disabled={disabled}
              appearance="primary"
              onClick={() => {
                if (!form.current.check()) {
                  return;
                }
                onSubmit(formValue);
              }}>
              Save configuration
              </Button>
            <Button
              disabled={disabled}
              appearance="default"
              onClick={async () => {
                if (await confirm('Reset configuration?')) {
                  setFormValue(value);
                }
              }}
            >
              Reset
            </Button>
          </ButtonToolbar>
        </FormGroup>
      </Form>
    </div>
  );
};

export default ConfigurationForm;