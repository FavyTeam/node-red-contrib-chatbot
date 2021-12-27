import React from 'react';
import _ from 'lodash';
import ReactDOM from 'react-dom'

import 'rsuite/dist/styles/rsuite-default.css'
import './login/index.scss';
import LoginPanel from './login/index';

ReactDOM.render(<LoginPanel />, document.querySelector('#mission-control'));