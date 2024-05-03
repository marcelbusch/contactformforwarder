# Express Mailer

Node app accepting POST requests and sending the data as email.

Most basic node app for that that you could imagine.

Using [express.js](https://expressjs.com) and [nodemailer](https://nodemailer.com/).

Options set via `.env` file:

```sh
APIKEY=xxx
PORT=3000
MAILPASS="xxx"
MAILUSER=my@mail.address
MAILPORT=465
MAILSERVER=smtp.mail.server
SENDTO=receiving@email.adress
MESSAGE_TEMPLATE="replaces #var# with json body.var"
SUBJECT_TEMPLATE="replaces #var# with json body.var"
MESSAGE_TEMPLATE_VAR="if you want multiple templates, send a body.template = \"VAR\" variable"
SUBJECT_TEMPLATE_VAR="if you want multiple templates, send a body.template = \"VAR\" variable"
```

If no `SUBJECT_TEMPLATE` is given defaults to `Kontaktformular von #name#` if name is in body, or just `Kontaktformular`.
If no `MESSAGE_TEMPLATE` is given, defaults to enumerating all body vars in the form of

```yaml
var1: value1
var2: value2
...
```

## Deploy

### Uberspace

```sh
uberspace web backend set /contactformsubmit --http --port PORT
git clone git@github.com:marcelbusch/contactformforwarder.git
cd contactformforwarder
npm install

vim ~/etc/services.d/contactformforwarder.ini
```

```sh
# ~/etc/services.d/contactformforwarder.ini
[program:contactformforwarder]
directory=PATHTO/contactformforwarder
command=npm run start
autostart=true
autorestart=true
environment=NODE_ENV=production
```

```sh
$ supervisorctl restart contactformforwarder
```
