import _ from 'lodash';
import { DataStore } from 'apollo-client/data/store';

export default (data, { percentile = false }) => {

  const sorted = data.events.sort((a, b) => a.count < b.count ? 1 : -1);
  
  const nodes = data.events
    .map(item => [item.name, item.source ]);
  
  const funnel =  {
    nodes:  
      /*[
        //{ id: 'Start' },
        ...sorted.map(event => ({ id: event.name, color: '#336699' }))
      ],*/
      _.uniq(_.compact(_.flatten(nodes))).map(name => ({ id: name })),

    links: _.compact(sorted.map((event, idx) => {
      let value = event.count;
      if (percentile) {
        if (idx !== 0) {
          value = Math.round((event.count / sorted[0].count) * 100);
        } else {
          value = 100;
        }
        
      }
      /*if (_.isEmpty(event.source)) {
        return null;
      }*/

      return {
        //source: idx > 0 ? _.capitalize(sorted[idx - 1].name) : 'Start',
        source: event.source,
        target: event.name,
        value
      };
    }))
  };

  return funnel
}