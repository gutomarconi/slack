const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const dotenv = require("dotenv")
const axios = require('axios')
const {
  createHmac,
} = require('node:crypto');

dotenv.config()

const PORT = process.env.PORT || 5000
const SLACK_TOKEN = process.env.SLACK_TOKEN || ''
const SLACK_SIGNIN_SECRET = process.env.MY_SLACK_SIGNING_SECRET;

const app = express()
app.use(cors({
  origin: "*"
}))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/api/slack', async (req, res) => {
  await axios.post('https://slack.com/api/chat.postMessage', {
    channel: 'U01BE2EU58F',
    text: 'new message'
  },
  {
    headers: { Authorization: `Bearer ${SLACK_TOKEN}` },
    
  })
  res.end();
})

app.post('/api/slack/events', (req, res) => {
  console.log(req.body);

  // const body = req.body();
  // const version = 'v0';
  // const signInSecret = SLACK_SIGNIN_SECRET;
  // const timestamp = req.headers['X-Slack-Request-Timestamp']

  // const baseString = `${version}:${timestamp}:${body}`;

  // const hmac = createHmac('sha256', signInSecret);

  // const my_signature = 'v0=' + hmac.update(baseString).digest()

  res.send(req.body.challenge);
  res.end();
});

app.listen(PORT, function () {
  console.log(`Express app listening on port ${PORT}`)
})