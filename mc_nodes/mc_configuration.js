const _ = require('lodash');
const request = require('request').defaults({ encoding: null });
const minisearch = require('minisearch');
const prettyjson = require('prettyjson');

const lcd = require('../lib/lcd/index');

const saveConfiguration = (configuration, context, namespace) => {
  Object.keys(configuration)
    .filter(key => key !== 'translations')
    .forEach(key => context.set(`${namespace}_${key}`, configuration[key]));
  // save dictionary if present
  if (configuration != null && configuration.translations != null) {
    const currentDictionary = context.get('dictionary') || {};
    context.set('dictionary', { ...currentDictionary, ...configuration.translations });
    context.set('tx', tx.bind(context));
  }
};

const tx = function(key, language, predefined) {
  //console.log('--', this, key, predefined)

  const dictionary = this.get('dictionary') || {};

  if (typeof key !== 'string') {
    console.error('Error in TX function: "key" is not a string');
  }
  if (typeof language !== 'string') {
    console.error('Error in TX function: "language" is not a string');
  }

  if (dictionary[key] != null && dictionary[key][language] != null) {
    return dictionary[key][language];
  } else if (dictionary[key] != null && dictionary[key][predefined] != null) {
    return dictionary[key][predefined];
  }
  return key;
};


const RequestConfiguration = function({ url, poll = 2000, callback = () => {} }) {
  this.timerId = setInterval(() => {
    console.log(lcd.orange('Fetching configuration...'));

    request({ url }, (error, response, body) => {
      if (!error) {
        let json;
        try {
          json = JSON.parse(body.toString())
        } catch(e) {
          // do nothing
        }
        if (json != null) {
          callback(json);
          clearInterval(this.timerId);
        }
      }
    });
  }, poll);

  return {
    done: () => clearInterval(this.timerId)
  };
};

module.exports = function(RED) {
  const { Events } = require('../mc')(RED);

  function MissionControlConfiguration(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    this.namespace = config.namespace;
    this.debug = config.debug;

    // store globally the minisearch lib
    const global = this.context().global;
    global.set('minisearch', minisearch);

    // ask configuration until it comes online
    this.requestConfiguration = new RequestConfiguration({
      url: `http://localhost:${RED.settings.uiPort}/mc/api/configuration/${node.namespace}`,
      callback: configuration => {
        const payload = _.omit(configuration, 'namespace');
        if (node.debug) {
          console.log(lcd.green('Initial configuration received') + ' (' + lcd.grey(this.namespace) +')');
          console.log(lcd.prettify(_.omit(payload, 'translations'), { indent: 2 }));
        }
        saveConfiguration(payload, this.context().global, node.namespace);
        node.send({ payload });
      },
      context: this.context().global
    });

    const handler = (topic, payload) => {
      if (topic === 'mc.configuration') {
        const { namespace, ...rest } = payload;
        if (_.isEmpty(namespace)) {
          console.log('Error: configuration payload without namespace');
          return;
        }
        // skip different namespace
        if (namespace !== node.namespace) {
          return;
        }
        // clear interval
        if (this.timerId != null) {
          clearInterval(this.timerId);
        }
        saveConfiguration(rest, this.context().global, node.namespace);
        // pass through
        node.send({ payload: rest });
      }
    };
    Events.on('message', handler);

    this.on('close', done => {
      Events.removeListener('message', handler);
      done();
    });
  }

  RED.nodes.registerType('mc-configuration', MissionControlConfiguration);
};
