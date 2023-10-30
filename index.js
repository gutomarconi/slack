const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const dotenv = require("dotenv")
const axios = require('axios')

dotenv.config()

const PORT = process.env.PORT || 5000
const SLACK_TOKEN = process.env.SLACK_TOKEN || ''
const BOT_TOKEN = process.env.SLACK_BOT_TOKEN || ''

const app = express()
app.use(cors({
  origin: "*"
}))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/api/slack', async (req, res) => {
  await axios.post('https://slack.com/api/chat.postMessage', {
    channel: 'C063CCU9Q7M',
    text: 'new message'
  },
  {
    headers: { Authorization: `Bearer ${SLACK_TOKEN}` },
    
  })
  res.end();
})

app.post('/api/slack/events', async (req, res) => {
  if (req.body.type === 'url_verification') {
    res.send(req.body.challenge)
  }
  const { event: { type, reaction, item } } = req.body;

  if (type === 'reaction_added' && reaction === 'dog') {
    const { channel, ts } = item;
    console.log(ts);
    const { data } = await axios.post('https://slack.com/api/chat.postMessage', {
      channel,
      text: 'I see you added our little dog, we will see what we can find', // this can be a block of texts (as collections) or attachments,
      reply_broadcast: true,
      thread_ts: ts
    },
    {
      headers: { Authorization: `Bearer ${BOT_TOKEN}` },
    })
    console.log(data);
  }
  
  res.send('ok')
  res.end();
});

app.post('/api/slack/slash', async (req, res) => {
  res.send('We will see what we can find')
  res.end();
});

app.listen(PORT, function () {
  console.log(`Express app listening on port ${PORT}`)
})