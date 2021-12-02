/* eslint-disable no-console */
const serveStatic = require('serve-static');
const path = require('path');
const events = require('events');
const WebSocket = require('ws');
const fs = require('fs');
const moment = require('moment');
const passport = require('passport');
const express = require('express');
const http = require('http');
const { BasicStrategy } = require('passport-http');
const _ = require('lodash');
const fileupload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;
const fetch = require('node-fetch');

const lcd = require('./lib/lcd/index');
const { hash } = require('./lib/utils/index');
const DatabaseSchema = require('./database/index');
const Settings = require('./src/settings');
const validators = require('./lib/helpers/validators');
const uploadFromBuffer = require('./lib/helpers/upload-from-buffer');

const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');

let initialized = false;
const Events = new events.EventEmitter();


module.exports = function(RED) {
  if (!initialized) {
    initialized = true;
    bootstrap(RED.server, RED.httpNode || RED.httpAdmin, RED.log, RED.settings);
  }
  // exposed methods
  return {
    Events,
    sendMessage: sendMessage
  };
}

function sendMessage(topic, payload) {
  Events.emit('send', topic, payload);
}

// webpack https://webpack.js.org/guides/getting-started/
// from https://github.com/node-red/node-red-dashboard/blob/63da162998c421b43a6e5ebf447ed90e04040aa3/ui.js#L309

// web socket docs
// https://github.com/websockets/ws#api-docs

// design
// https://adminlte.io/themes/v3/index2.html

// Inspiration design
// https://colorlib.com/wp/free-dashboard-templates/
// clone schema https://demo.uifort.com/bamburgh-admin-dashboard-pro/
// React grid
// https://github.com/STRML/react-grid-layout#installation
// useQuery
// https://www.apollographql.com/docs/react/data/queries/


async function bootstrap(server, app, log, redSettings) {


  // print version
  const jsonPackage = fs.readFileSync(__dirname + '/package.json');
  let package;
  try {
    package = JSON.parse(jsonPackage.toString());
    // eslint-disable-next-line no-console
    console.log(lcd.white(moment().format('DD MMM HH:mm:ss')
      + ' - [info] RedBot Mission Control version:')
      + ' ' + lcd.green(package.version) + lcd.grey(' (node-red-contrib-chatbot-mission-control)'));
  } catch(e) {
    lcd.error('Unable to open node-red-contrib-chatbot-mission-control/package.json');
  }

  // get mission control configurations
  console.log(lcd.timestamp() + 'Red Bot Mission Control configuration:');
  const mcSettings = redSettings.missionControl || {};
  mcSettings.version = package.version;
    if (process.env.DEV != null && (process.env.DEV.toLowerCase() === 'true' || process.env.DEV.toLowerCase() === 'dev')) {
    mcSettings.environment = 'development';
  } else if (process.env.DEV != null && process.env.DEV.toLowerCase() === 'plugin') {
    mcSettings.environment = 'plugin';
  } else {
    mcSettings.environment = 'production';
  }
  console.log(lcd.timestamp() + '  ' + lcd.green('environment: ') + lcd.grey(mcSettings.environment));
  // get the database path
  if (mcSettings.dbPath == null) {
    mcSettings.dbPath = path.join(__dirname, 'mission-control.sqlite');
  } else {
    mcSettings.dbPath = mcSettings.dbPath.replace(/\/$/, '') + '/mission-control.sqlite';
  }
  console.log(lcd.timestamp() + '  ' + lcd.green('dbPath: ') + lcd.grey(mcSettings.dbPath));
  if (mcSettings.dbPath === path.join(__dirname, 'mission-control.sqlite')) {
    // check is not using the default database
    console.log(lcd.timestamp() + '  ' + lcd.orange('Warning: *.sqlite dataase  is the default one in the npm package, the database file'));
    console.log(lcd.timestamp() + '  ' + lcd.orange('will be overwritten if the package is reinstalled, this is good for development but dangerous'));
    console.log(lcd.timestamp() + '  ' + lcd.orange('for production. Select a different directory to store the database.'))
  }
  // get plugin path
  if (mcSettings.pluginsPath == null && !fs.existsSync(mcSettings.pluginsPath)) {
    mcSettings.pluginsPath = path.join(__dirname, 'dist-plugins');
  }
  console.log(lcd.timestamp() + '  ' + lcd.green('pluginsPath: ') + lcd.grey(mcSettings.pluginsPath));
  if (mcSettings.pluginsPath == path.join(__dirname, 'dist-plugins')) {
    console.log(lcd.timestamp() + '  ' + lcd.orange('Warning: external plugin path is the default one in the npm package, the external plugins'));
    console.log(lcd.timestamp() + '  ' + lcd.orange('will be overwritten if the package is reinstalled, this is good for development but dangerous'));
    console.log(lcd.timestamp() + '  ' + lcd.orange('for production. Select a different directory with permission rights.'))
  }
  // get root
  if (mcSettings.root == null) {
    mcSettings.root = '/mc';
  } else {
    mcSettings.root = mcSettings.root.replace(/\/$/, '');
  }
  console.log(lcd.timestamp() + '  ' + lcd.green('root: ') + lcd.grey(mcSettings.root));
  // get host
  if (mcSettings.host == null) {
    mcSettings.host = 'localhost';
  }
  console.log(lcd.timestamp() + '  ' + lcd.green('host: ') + lcd.grey(mcSettings.host));
  // get
  mcSettings.port = redSettings.uiPort;
  console.log(lcd.timestamp() + '  ' + lcd.green('port: ') + lcd.grey(mcSettings.port));
  if (mcSettings.salt == null) {
    mcSettings.salt = 'mysalt';
    console.log(lcd.timestamp() + '  ' + lcd.green('salt: ') + lcd.grey('default'));
  } else {
    console.log(lcd.timestamp() + '  ' + lcd.green('salt: ') + lcd.grey('****'));
  }
  if (mcSettings.googleMapsKey != null) {
    console.log(lcd.timestamp() + '  ' + lcd.green('googleMapsKey: ') + lcd.grey(mcSettings.googleMapsKey));
  }
  if (validators.credentials.cloudinary(mcSettings.cloudinary)) {
    console.log(lcd.timestamp() + '  ' + lcd.green('cloudinary name: ') + lcd.grey(mcSettings.cloudinary.cloudName));
    console.log(lcd.timestamp() + '  ' + lcd.green('cloudinary apiKey: ') + lcd.grey(mcSettings.cloudinary.apiKey));
    console.log(lcd.timestamp() + '  ' + lcd.green('cloudinary apiSecret: ') + lcd.grey('****'));
    cloudinary.config({
      cloud_name: mcSettings.cloudinary.cloudName,
      api_key: mcSettings.cloudinary.apiKey,
      api_secret: mcSettings.cloudinary.apiSecret
    });
  } else {
    mcSettings.cloudinary = null;
  }

  // todo put db schema here
  const databaseSchema = DatabaseSchema(mcSettings)
  const { Configuration, graphQLServer, graphQLSchema, Category, Content, Admin,  ChatBot, Plugin, sequelize } = databaseSchema;

  // if database doesn't exist, then create it and run sync to create blank tables
  if (!fs.existsSync(mcSettings.dbPath)) {
    await sequelize.sync({ force: true })
    await Admin.create({ username: 'admin', password: '', permissions: '*' });
    await ChatBot.create({ name: 'MyChatbot' });
    await Category.create({ name: 'A category', language: 'en', namespace: 'content' });
    await Content.create({
      title: 'A content',
      slug: 'my_slug',
      language: 'en',
      namespace: 'content',
      categoryId: 1,
      body: `A sample content.

Some **formatting** is _allowed_!`
    });
  }

  //passport authentication
  passport.use(new BasicStrategy(async function (username, password, done) {
    try {
      let user = await Admin.findOne({ where: { username } });
      if (user == null) {
        done(null, false);
      } else {
        const hashedPassword = hash(password, { salt: mcSettings.salt });
        if (_.isEmpty(user.password) || user.password === hashedPassword) {
          done(null, {
            id: user.id,
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name,
            avatar: user.avatar,
            email: user.email,
            isEmptyPassword: _.isEmpty(user.password),
            permissions: !_.isEmpty(user.permissions) ? user.permissions.split(',') : []
          });
        } else {
          done(null, false);
        }
      }
    } catch (e) {
      done(e);
    }
  }));
  app.use(passport.initialize());

  // mount graphql endpoints to Node-RED app
  graphQLServer.applyMiddleware({ app });

  // Start web socket subscription server (on different port than WS of node-red or will clash)
  const appSubscriptions = express();
  const httpServerSubscriptions = http.createServer(appSubscriptions);
  graphQLServer.installSubscriptionHandlers(httpServerSubscriptions);
  httpServerSubscriptions.listen(Settings.notificationPort, () => {
    console.log(`Starting Subscription Server at ${Settings.notificationPort}`);
  });

  // eslint-disable-next-line no-console
  console.log(lcd.white(moment().format('DD MMM HH:mm:ss')
  + ' - [info] GraphQL ready at :')
  + ' ' + lcd.green(`http://localhost:${mcSettings.port}${graphQLServer.graphqlPath}`));

  // handle upload file
  app.post(`${mcSettings.root}/api/upload`, fileupload(), async (req, res) => {
    if (mcSettings.cloudinary == null) {
      res.status(400).send('Missing or invalid Cloudinary credentials');
      return;
    }
    let result = await uploadFromBuffer(req.files.file.data, cloudinary);
    res.send({
      id: result.public_id,
      name: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes,
      url: result.url,
      secure_url: result.secure_url
    });
  });

  // serve a configuration given the namespace
  app.get(`${mcSettings.root}/api/configuration/:namespace`, (req, res) => {
    Configuration.findOne({ where: { namespace: req.params.namespace }})
      .then(found => {
        if (found == null) {
          res.send({});
          return;
        }
        let json;
        try {
          json = JSON.parse(found.payload);
        } catch(e) {
          //
        }
        if (json != null) {
          res.send({ ...json, namespace: req.params.namespace });
        } else {
          res.status(400).send('Invalid JSON');
        }
      });
  });

  // assets
  app.use(`${mcSettings.root}/main.js`, serveStatic(path.join(__dirname, 'dist/main.js')));
  // serve plugins chunk, only used in dev mode, it changes position everytime, that's the reason of the wildcard
  // not used in prod
  app.get(/plugins_js\.main\.js$/, async (req, res) => {
    const response = await fetch('http://localhost:8080/plugins_js.main.js');
    res.send(await response.text());
  });
  app.use(`${mcSettings.root}/plugins`, serveStatic(mcSettings.pluginsPath, {
    'index': false
  }));
  // serve mission control page and assets
  app.use(
    '^' + mcSettings.root,
    passport.authenticate('basic', { session: false }),
    async (req, res) => {
      const chatbot = await ChatBot.findOne();
      const plugins = await chatbot.getPlugins({ limit: 9999 });
      // inject user info into template
      fs.readFile(`${__dirname}/src/index.html`, (err, data) => {
        const template = data.toString();
        const bootstrap = {
          chatbot: {
            ...chatbot.toJSON(),
            plugins: plugins.map(plugin => plugin.toJSON())
          },
          user: req.user,
          settings: { ...mcSettings, environment: mcSettings.environment }
        };

        const assets = mcSettings.environment === 'development' || mcSettings.environment === 'plugin' ?
          'http://localhost:8080/main.js' : `${mcSettings.root}/main.js`;
        // link external plugin scripts only in plugin mode
        let pluginsScript = [];
        if (mcSettings.environment === 'plugin' || mcSettings.environment === 'production') {
          pluginsScript = plugins.map(plugin => `<script src="${mcSettings.root}/plugins/${plugin.filename}"></script>`);
        }
        const json = `<script>var bootstrap = ${JSON.stringify(bootstrap)};var mc_environment='${mcSettings.environment}';</script>`;
        res.send(template.replace('{{data}}', json).replace('{{assets}}', assets).replace('{{plugins}}', pluginsScript.join('')));
     });
    }
  );

  // Setup web socket
  console.log(`Starting WebSocket at ${Settings.wsPort}`);
  const wss = new WebSocket.Server({ port: Settings.wsPort });
  wss.on('connection', ws => {
    const sendHandler = (topic, payload) => ws.send(JSON.stringify({ topic, payload }));
    ws.on('message', message => {
      // console.log('received: %s', message);
      let parsed;
      try {
        parsed = JSON.parse(message);
      } catch(e) {
        // error
      }
      if (parsed != null) {
        Events.emit('message', parsed.topic, parsed.payload);
      }
    });
    ws.on('close', () => {
      Events.removeListener('send', sendHandler);
    });
    Events.on('send', (topic, payload) => {
      sendHandler(topic, payload);
    });
  });

};