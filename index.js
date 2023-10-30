const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const dotenv = require("dotenv")
const axios = require('axios')
const OpenAI = require("openai");

dotenv.config()

const PORT = process.env.PORT || 5000
const SLACK_TOKEN = process.env.SLACK_TOKEN || '' // if we need to
const BOT_TOKEN = process.env.SLACK_BOT_TOKEN || ''
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express()
app.use(cors({
  origin: "*"
}))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

const KMS_EMOJI = 'dog';
const SLACK_POST_MESSAGE_ENDPOINT = 'https://slack.com/api/chat.postMessage';

const EventTypes = {
  UrlVerification: 'url_verification',
  ReactionAdded: 'reaction_added'
}

app.post('/api/slack/events', async (req, res) => {
  if (req.body.type === EventTypes.UrlVerification) {
    res.send(req.body.challenge)
  }
  const { event: { type, reaction, item } } = req.body;

  if (type === EventTypes.ReactionAdded && reaction === KMS_EMOJI) {
    const { channel, ts } = item;
    await axios.post(SLACK_POST_MESSAGE_ENDPOINT, { // DOCS: https://api.slack.com/methods/chat.postMessage
      channel,
      text: 'I see you added our little dog, we will see what we can find', // this can be a block of texts (as collections) or attachments,
      reply_broadcast: true, // visibility
      thread_ts: ts // Indicates if it will reply as a thread
    },
    {
      headers: { Authorization: `Bearer ${BOT_TOKEN}` },
    })
  }
  res.end();
});

app.post('/api/slack/slash', async (req, res) => {
  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: "user", content: req.body }],
      model: "gpt-3.5-turbo",
    });
    const [choice] = chatCompletion.choices;
    res.send(choice.message);
  
  } catch(error) {
    console.log(error)
  }
  res.end();
});

app.get('/api/slack/chat', async (req, res) => {
  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: "user", content: "Who are the last 10 FIFA world cup champtions" }],
      model: "gpt-3.5-turbo",
    });
    console.log('deu')
    chatCompletion.choices.map(choice => console.log(choice))
  
  } catch(error) {
    console.log(error)
  }
  res.send('ok')

  res.end();
  
  
})

app.listen(PORT, function () {
  console.log(`Express app listening on port ${PORT}`)
})