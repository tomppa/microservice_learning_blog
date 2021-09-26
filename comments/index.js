const express = require('express');
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const commentsByPostId = {};

async function postToEventBus(event) {
  await axios
    .post('http://event-bus-clusterip-service:4005/events', event)
    .catch((err) => {
      console.log(err.message);
    });
}

app.get('/posts/:id/comments', (req, res) => {
  res.send(commentsByPostId[req.params.id] || []);
});

app.post('/posts/:id/comments', async (req, res) => {
  const commentId = randomBytes(4).toString('hex');
  const { content } = req.body;

  const postId = req.params.id;
  const comments = commentsByPostId[postId] || [];

  comments.push({ id: commentId, content, status: 'pending' });

  commentsByPostId[postId] = comments;

  postToEventBus({
    type: 'CommentCreated',
    data: {
      id: commentId,
      content,
      postId,
      status: 'pending',
    },
  });

  res.status(201).send(comments);
});

app.post('/events', async (req, res) => {
  const { type, data } = req.body;

  console.log('Received Event', type);

  if (type === 'CommentModerated') {
    const { postId, id, status, content } = data;
    const comments = commentsByPostId[postId];

    const comment = comments.find((comment) => {
      return (comment.id = id);
    });
    comment.status = status;

    postToEventBus({
      type: 'CommentUpdated',
      data: {
        id,
        postId,
        content,
        status,
      },
    });
  }

  res.send({});
});

app.listen(4001, () => {
  console.log('Listening on 4001');
});
