const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT;
const apikey = process.env.APIKEY;

app.post('/contactformsubmit', async (req, res) => {
  console.log(req.body)
  if (!req.body || !req.body.apikey || !req.body.apikey == apikey) {
    res.send('apikey missing or incorrect');
    return;
  }

  const success = await sendmail(req.body).catch(console.error);
  console.log(`success: ${success ? 'true' : 'false'}`)
  if (success === true) {
    res.send("success")
  } else {
    res.send("error")
  }
});

app.listen(port, () => {
  console.log(`Contact form forwarding server listening on port ${port}`);
});


const transporter = nodemailer.createTransport({
  host: process.env.MAILSERVER,
  port: process.env.MAILPORT,
  secure: true,
  auth: {
    user: process.env.MAILUSER,
    pass: process.env.MAILPASS,
  },
});

async function sendmail(data) {
  console.log(data)
  console.log(transporter)
  const info = await transporter.sendMail({
    from: `"Kontaktformular" <${process.env.MAILUSER}>`, // sender address
    to: 'me@marcelbusch.de', // list of receivers
    subject: `Kontaktformular von ${data.name}`, // Subject line
    text: `name: ${data.name}
mail: ${data.email}
message: ${data.message}`, // plain text body
  });

  console.log('Message sent: %s', info.messageId);
  return true;
}
