import express from 'express'
import nodemailer from 'nodemailer'
import cors from 'cors'
import dotenv from 'dotenv'
import DOMPurify from "isomorphic-dompurify";

dotenv.config()

const app = express();
if (process.env.CORS) {
  const origin = process.env.CORS.split(' ')
  console.log('cors origin:', origin)
  app.use(cors({
    origin: origin
  }))
} else {
  app.use(cors());
}
app.use(express.json());

const port = process.env.PORT;
const apikey = process.env.APIKEY;

app.post("/log", async (req, res) => {
  console.log(req?.body);
  res.send("success");
});

app.post("/contactformsubmit", async (req, res) => {
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
    console.log(req);
    res.send("only send json");
    return;
  }
  // console.log(body);
  if (!body || !body.apikey || !body.apikey === apikey) {
    res.send("apikey missing or incorrect");
    return;
  }

  const success = await sendmail(body).catch(console.error);
  console.log(`success: ${success ? "true" : "false"}`);
  if (success === true) {
    res.send("success");
  } else {
    res.send("error");
  }
});

app.listen(port, () => {
  console.log(`Contact form forwarding server listening on port ${port}`);
});

app.use(function (err, req, res, next) {
  console.log(err);
  console.log(req);
  res.status(500).send("error");
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
    let message = "";
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
  // console.log(data);
  // console.log(transporter);
  delete data.apikey;
  let messagetemplate, subjecttemplate, message, subject;
  if (data.subject && data.message) {
    message = data.message;
    subject = data.subject;
  } else {
    if (data.template) {
      messagetemplate = process.env.hasOwnProperty(
        `MESSAGE_TEMPLATE_${data.template}`,
      )
        ? process.env[`MESSAGE_TEMPLATE_${data.template}`]
        : null;
      subjecttemplate = process.env.hasOwnProperty(
        `SUBJECT_TEMPLATE_${data.template}`,
      )
        ? process.env[`SUBJECT_TEMPLATE_${data.template}`]
        : null;
    } else if (
      data.singletontemplate &&
      data.singletontemplate.hasOwnProperty("body") &&
      data.singletontemplate.hasOwnProperty("subject")
    ) {
      messagetemplate = data.singletontemplate.body;
      subjecttemplate = data.singletontemplate.subject;
    } else {
      messagetemplate = null;
      subjecttemplate = null;
    }
    if (data.singletontemplate) {
      delete data.singletontemplate;
    }
    if (data.hasOwnProperty("template")) {
      delete data.template;
    }
    message = createMessage(data, messagetemplate);
    subject = createMessage(
      data,
      subjecttemplate
        ? subjecttemplate
        : data.hasOwnProperty("name")
          ? "Kontaktformular von #name#"
          : "Kontaktformular",
    );
  }
  const sendto = process.env.ENVIRONMENT === 'DEVELOPMENT' && data?.to || process.env.SENDTO;
  const msgdata = {
    from: `"Kontaktformular" <${process.env.MAILUSER}>`, // sender address
    to: sendto, // list of receivers
    subject: DOMPurify.sanitize(subject), // Subject line
    text: DOMPurify.sanitize(message), // plain text body
  };
  if (data.email) {
    msgdata.replyTo = DOMPurify.sanitize(data.email);
  }
  const info = await transporter.sendMail(msgdata);
  console.log("Message sent: %s", info.messageId);

  if (data.confirmation) {
    let send = true;
    const confirmation = data.confirmation;
    msgdata.replyTo = process.env.SENDTO;
    if (typeof confirmation === "string") {
      msgdata.to = DOMPurify.sanitize(confirmation);
    } else if (
      typeof confirmation === "object" &&
      "email" in confirmation &&
      "message" in confirmation &&
      "subject" in confirmation
    ) {
      msgdata.to = DOMPurify.sanitize(confirmation.email);
      msgdata.subject = DOMPurify.sanitize(confirmation.subject);
      msgdata.text = DOMPurify.sanitize(confirmation.message);
      if (confirmation?.replyTo) {
        msgdata.replyTo = DOMPurify.sanitize(confirmation.replyTo);
      }
    } else {
      send = false;
    }
    if (send === true) {
      const confirmationInfo = await transporter.sendMail(msgdata);
      console.log('confirmation sent info:', confirmationInfo)
    }
  }

  return true;
}
