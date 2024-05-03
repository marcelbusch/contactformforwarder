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
  let body = req.body;
  // console.log(req);
  // try {
  //   body = JSON.parse(req.body);
  // } catch (e) {
  //   console.log(e);
  //   res.send('only send json');
  //   return;
  // }
  // console.log(body)
  // console.log(!!body)
  // console.log(Object.keys(body))
  // console.log(Object.keys(body).length)
  if (!body || !Object.keys(body).length) {
    console.log(`res.body is empty. request:`);
    console.log(req)
    res.send('only send json');
    return;
  }
  // console.log(body);
  if (!body || !body.apikey || !body.apikey == apikey) {
    res.send('apikey missing or incorrect');
    return;
  }

  const success = await sendmail(body).catch(console.error);
  console.log(`success: ${success ? 'true' : 'false'}`);
  if (success === true) {
    res.send('success');
  } else {
    res.send('error');
  }
});

app.listen(port, () => {
  console.log(`Contact form forwarding server listening on port ${port}`);
});

app.use(function(err, req, res, next) {
  console.log(err)
  console.log(req)
  res.status(500).send('error')
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

function createMessage(data, template) {
  // console.log(template, data)
  if (!template) {
    let message = '';
    for (const key in data) {
      message = message + `${key}: ${data[key]}\n`;
    }
    return message;
  } else {
    let message = template;
    for (const key in data) {
      message = message.replaceAll(`#${key}#`, data[key]);
    }
    return message;
  }
}

async function sendmail(data) {
  console.log(data);
  console.log(transporter);
  delete data.apikey;
  const msgtmplt = data.template && process.env.hasOwnProperty(`MESSAGE_TEMPLATE_${data.template}`) ? process.env[`MESSAGE_TEMPLATE_${data.template}`] : process.env.MESSAGE_TEMPLATE
  const sbjttmplt = data.template && process.env.hasOwnProperty(`SUBJECT_TEMPLATE_${data.template}`) ? process.env[`SUBJECT_TEMPLATE_${data.template}`] : process.env.SUBJECT_TEMPLATE
  if (data.hasOwnProperty('template')) {
    delete data.template
  }
  const message = createMessage(data, msgtmplt);
  const subject = createMessage(data, sbjttmplt ? sbjttmplt : data.hasOwnProperty('name') ? 'Kontaktformular von #name#' : 'Kontaktformular');
  const info = await transporter.sendMail({
    from: `"Kontaktformular" <${process.env.MAILUSER}>`, // sender address
    to: process.env.SENDTO, // list of receivers
    subject: subject, // Subject line
    text: message, // plain text body
  });

  console.log('Message sent: %s', info.messageId);
  return true;
}
