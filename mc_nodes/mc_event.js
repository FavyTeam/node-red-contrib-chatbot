const _ = require('lodash');
const gql = require('graphql-tag');

const Client = require('../database/client');
const {
  isValidMessage,
  isSimulator,
  extractValue,
  when
} = require('../lib/helpers/utils');

const CREATE_EVENT = gql`
mutation ($event: NewEvent!) {
	createEvent(event: $event) {
    id,
    count,
    sources
  }
}
`;

module.exports = function(RED) {
  const client = Client(RED);
  const { Events } = require('../mc')(RED);

  function MissionControlEvent(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.flow = config.flow;
    node.name = config.name;

    this.on('input', async function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };

      // check if valid redbot message or simulator, pass thru
      if (!isValidMessage(msg, node, { silent: true }) || isSimulator(msg)) {
        send(msg);
        done();
        return;
      }

      const flow = extractValue('string', 'flow', node, msg, false);
      const name = extractValue('string', 'name', node, msg, false);

      const chat = msg.chat();
      const global = node.context().global;

      try {
        let previousEvents = await when(chat.get('previous_events'));
        // default stack message
        if (_.isEmpty(previousEvents) || !_.isArray(previousEvents)) {
          previousEvents = [];
        }

        // if events are delete, then the stacks ok events stored "previousEvents" must be deleted
        // it cannot be done sinchronously but detecting a changed timestamp, a global one and a chat
        // context one. The global one is changed at every reset, the context one is aligned if empty or
        // different
        const contextTimestamp = await when(chat.get('mc_events_timestamp'));
        const globalTimestamp = global.get('mc_events_timestamp');
        if (!_.isEmpty(globalTimestamp)) {
          if (_.isEmpty(contextTimestamp) || contextTimestamp !== globalTimestamp) {
            previousEvents = [];
            await when(chat.set('mc_events_timestamp', globalTimestamp));
          }
        }

        const newEvent = await client.mutate({
          mutation: CREATE_EVENT,
          variables: {
            event: {
              flow,
              name,
              sources: previousEvents
            }
          }
        });
        if (newEvent != null) {
          await when(chat.set('previous_events', newEvent.data.createEvent.sources ));
        }

        send(msg);
        done();
      } catch(error) {
        // TODO cleanup
        console.log(error)
        console.log('erro saving event', error)
        done(error)
      }

    });

    // listen to changes to events timestamp
    const handler = (topic, payload) => {
      const global = this.context().global;
      if (topic === 'mc.events.timestamp') {
        global.set('mc_events_timestamp', payload.eventsTimestamp);
      }
    };
    Events.on('message', handler);

    this.on('close', done => {
      Events.removeListener('message', handler);
      done();
    });
  }

  RED.nodes.registerType('mc-event', MissionControlEvent);
};
