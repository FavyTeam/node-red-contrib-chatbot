import React from 'react';
import PropTypes from 'prop-types';

import { Input } from 'rsuite';

const SelectChatbots = ({ value, onChange = () => {} }) => {

  console.log('sel', value)
  return (
    <Input value={value} onChange={onChange} />
  );
};

SelectChatbots.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func
};

export default SelectChatbots;
