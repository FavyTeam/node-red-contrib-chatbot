import { plug } from 'code-plug';

import FunnelWidget from './views/widget';

plug('widgets', FunnelWidget, { x: 0, y: 0, w: 2, h: 8, isResizable: true, id: 'funnel-widget' });