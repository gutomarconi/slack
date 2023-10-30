const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const dotenv = require("dotenv")
const axios = require('axios')

dotenv.config()

const PORT = process.env.PORT || 5000
const SLACK_TOKEN = process.env.SLACK_TOKEN || ''

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

app.post('/api/slack/events', async (req, res) => {
  res.send(req.body.challenge);

  await axios.post('https://slack.com/api/chat.postMessage', {
    channel: 'U01BE2EU58F',
    text: 'teste new message '
  },
  {
    headers: { Authorization: `Bearer ${SLACK_TOKEN}` },
    
  })

  res.end();
});

app.listen(PORT, function () {
  console.log(`Express app listening on port ${PORT}`)
})