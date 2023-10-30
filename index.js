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
  apiKey: OPENAI_API_KEY,
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

const getChatGPTAnswer = async (question) => {
  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: "user", content: question }],
    model: "gpt-3.5-turbo",
    n: 1,
    // best_of: 1,
  });
    
  const [choice] = chatCompletion.choices;
  const { content } = choice.message;
  return content;
}

const getSlackMessage = async (channel, ts) => {
  const messageData = await axios({
    url: 'https://slack.com/api/conversations.history', 
    params: {
      channel,
      latest: ts,
      "limit": 1,
      "inclusive": true
    }, 
    headers: { Authorization: `Bearer ${BOT_TOKEN}` },
  });
  const [originalMessage] = messageData.data.messages;
  return originalMessage.text;
}

const postMessageToSlack = async (channel, ts, text) => {
  await axios.post(SLACK_POST_MESSAGE_ENDPOINT, { // DOCS: https://api.slack.com/methods/chat.postMessage
    channel,
    text, // this can be a block of texts (as collections) or attachments,
    reply_broadcast: true, // visibility
    thread_ts: ts // Indicates if it will reply as a thread
  },
  {
    headers: { Authorization: `Bearer ${BOT_TOKEN}` },
  })
}

const handleSlashEvent = async (channel, question) => {
  const answer = await getChatGPTAnswer(question);
  postMessageToSlack(channel, undefined, answer);
}

const handleReactionEvent = async (channel, ts) => {
  const question = await getSlackMessage(channel, ts)
  const answer = await getChatGPTAnswer(question);
  postMessageToSlack(channel, ts, answer);
}

app.post('/api/slack/events', async (req, res) => {
  if (req.body.type === EventTypes.UrlVerification) {
    res.send(req.body.challenge)
  }
  const { event: { type, reaction, item } } = req.body;

  if (type === EventTypes.ReactionAdded && reaction === KMS_EMOJI) {
    const { channel, ts } = item;
    handleReactionEvent(channel, ts)
  }
  res.end();
});

app.post('/api/slack/slash', async (req, res) => {
  try {
    const { body: { channel_id, text}} = req;
    handleSlashEvent(channel_id, text)
  } catch(error) {
    res.send(error);
  }
  res.end();
});

app.listen(PORT, function () {
  console.log(`Express app listening on port ${PORT}`)
})