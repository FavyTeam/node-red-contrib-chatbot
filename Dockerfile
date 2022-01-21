FROM nodered/node-red

RUN npm install node-red-contrib-chatbot@beta --unsafe-perm --no-update-notifier --no-fund --only=production