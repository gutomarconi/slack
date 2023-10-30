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

const getChatGPTAnswer = async (question) => {
  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: "user", content: question }],
    model: "gpt-3.5-turbo",
  });

  const [choice] = chatCompletion.choices;
  return choice.message.content;
}

app.post('/api/slack/events', async (req, res) => {
  if (req.body.type === EventTypes.UrlVerification) {
    res.send(req.body.challenge)
  }
  const { event: { type, reaction, item } } = req.body;

  if (type === EventTypes.ReactionAdded && reaction === KMS_EMOJI) {
    const { channel, ts } = item;

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

    console.log(messageData);
    const [originalMessage] = messageData.messages;

    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: "user", content: originalMessage.text }],
      model: "gpt-3.5-turbo",
    });
  
    console.log(chatCompletion.choices);
    const [choice] = chatCompletion.choices;
    console.log(choice);
    // res.send(choice.message.content);

    await axios.post(SLACK_POST_MESSAGE_ENDPOINT, { // DOCS: https://api.slack.com/methods/chat.postMessage
      channel,
      text: choice.message, // this can be a block of texts (as collections) or attachments,
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
    // const answer = await getChatGPTAnswer(req.body.text);
    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: "user", content: req.body.text }],
      model: "gpt-3.5-turbo",
    });
  
    console.log(chatCompletion.choices);
    const [choice] = chatCompletion.choices;
    console.log(choice);
    res.send(choice.message);
  } catch(error) {
    console.log(error)
    res.send(error);
  }
  res.end();
});

app.listen(PORT, function () {
  console.log(`Express app listening on port ${PORT}`)
})