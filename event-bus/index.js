const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const events = [];

async function postEvent(component, event) {
  const port = {
    posts: 4000,
    comments: 4001,
    query: 4002,
    moderation: 4003,
  }[component];

  const address = `http://${component}-clusterip-service:${port}/events`;

  await axios.post(address, event).catch((err) => {
    console.log(err.message);
  });
}

app.post('/events', async (req, res) => {
  const event = req.body;

  events.push(event);

  await postEvent('posts', event);
  await postEvent('comments', event);
  await postEvent('query', event);
  await postEvent('moderation', event);

  res.send({ status: 'OK' });
});

app.get('/events', (req, res) => {
  res.send(events);
});

app.listen(4005, () => {
  console.log('Listening on 4005.');
});
