const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const massive = require('massive');
const AWS = require('aws-sdk');
const axios = require('axios');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

//Controllers
const imageCtrl = require('./controllers/image_controller');
const scheduleCtrl = require('./controllers/schedule_controller');
const eventCtrl = require('./controllers/event_controller');

const app = express();
app.use( express.static( `${__dirname}/../build`) );

const { SERVER_PORT, SESSION_SECRET, CONNECTION_STRING, REACT_APP_DOMAIN, REACT_APP_CLIENT_ID, CLIENT_SECRET, } = process.env;

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
//Amazon S3 Setup
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });

const S3 = new AWS.S3();  

//Session Setup
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))

app.use((req, res, next) => {
    if (!req.session.user) {
        req.session.user = {
            full_name: '',
            email: '',
            profile_pic: '',
            auth_id: '',
            phone: null,
            permissions: '',
            user_id: null
        }
    }
    next()
})

//Massive Setup
massive(CONNECTION_STRING).then(dbInstance => {
    app.set('db', dbInstance)
})

//ENDPOINTS
//Auth0
app.get('/api/test', (req, res) => {
    res.status(200).json('It Worked!')
})

app.get('/auth/callback', async (req, res) => {
    let payload = {
        client_id: REACT_APP_CLIENT_ID,  
        client_secret: CLIENT_SECRET,
        code: req.query.code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.PROTOCOL}://${req.headers.host}/auth/callback`
    }
    let resWithToken = await axios.post(`https://${REACT_APP_DOMAIN}/oauth/token`, payload);
    let resWithUserData = await axios.get(`https://${REACT_APP_DOMAIN}/userinfo?access_token=${resWithToken.data.access_token}`);
    const db = req.app.get('db');
    let { sub, email, name, picture } = resWithUserData.data;
    let foundUser = await db.find_user([sub]);
    if (foundUser[0]) {
        req.session.user = foundUser[0];
        res.redirect('/#/')
    } else {
        let createdUser = await db.create_user([name, email, picture, sub]);
        req.session.user = createdUser[0];
        res.redirect('/#/')
    }
})

//Amazon S3
app.post('/api/s3', (req, res) => {
    // the body contains the string that is the photo
    const photo = req.body;
  
    // the photo string needs to be converted into a 'base 64' string for s3 to understand how to read the image
    const buf = new Buffer(photo.file.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  
    // this is the object that we will end to s3 with all the info about the photo, and the photo itself.
    const params = {
      Bucket: process.env.AWS_BUCKET,
      Body: buf,
      Key: photo.filename,
      ContentType: photo.filetype,
      ACL: 'public-read',
    };
  
    // using the S3 object we made above the endpoints we will pass it the image we want uploaded and the funciton to be run when the upload is finished.
    S3.upload(params, (err, data) => {
      let response, code;
      if (err) {
        response = err;
        code = 500;
      } else {
        response = data;
        code = 200;
      }
      // if the upload was sucessfull give them the data, if not send them the error
      res.status(code).send(response);
    });
  });

//SendGrid
app.post('/api/sendemail', (req, res) => {
    
    const msg = { 
        to: 'dylantkamauoha@gmail.com',
        from: req.body.email,
        subject: `Message from ${req.body.name}`,
        text: req.body.message
        // to: 'test@example.com',
        // from: 'test@example.com',
        // subject: 'Sending with SendGrid is Fun',
        // text: 'and easy to do anywhere, even with Node.js',
        // html: '<strong>and easy to do anywhere, even with Node.js</strong>',
    };
    sgMail.send(msg);
    res.sendStatus(200);
})

//App
app.get('/api/user', (req, res, next) => {
    res.send(req.session.user)
})

app.post('/api/image', imageCtrl.addImage);

app.get('/api/images', imageCtrl.getImages);

app.post('/api/appointment',scheduleCtrl.createAppointment);

app.post('/api/events', eventCtrl.getEvents);

app.post('/api/appointments', eventCtrl.getAllAppointments)

app.put('/api/event', eventCtrl.updateEvent);

app.delete('/api/event/:id', eventCtrl.deleteEvent);

app.get('/api/logout', (req, res, next) => {
    req.session.destroy();
    res.redirect('/#/');
})

app.listen(SERVER_PORT, () => console.log(`Server running on Port: ${SERVER_PORT}`));