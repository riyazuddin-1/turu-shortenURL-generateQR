const express = require('express');
const path = require('path');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const { MongoClient } = require('mongodb');
const shortId = require('shortid');
const qr = require('qrcode');

const app = express();

app.use(express.static(__dirname+'/public'));
app.use(express.static(__dirname, { extensions: ['html', 'css', 'png', 'fonts']}));

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true }));

app.use(cookieParser());

var uri = "URI to connect to MongoDB";
const client = new MongoClient(uri);
client.connect().then(() => {console.log('Connected successfully to server');});

app.get('/', (req, res) => {
  var shorturl = '';
  if(req.cookies.shorturl) {
    shorturl = req.cookies.shorturl;
  }
  res.render('home', {shorturl});
});

app.post('/', async (req, res) => {
  var url = req.body.url;
  const regexp = new RegExp(/^(https?|chrome):\/\//, 'i');
  const regurl = new RegExp(/[^\s$.?#]+\..+/);
  if(!regexp.test(url)) {
    url = 'http://' + url;
  }
  if(!regurl.test(url)) {
    res.send('url is invalid');
  } else {
  const db = client.db('url');
  const collection = db.collection('links');
  const shortUrl = shortId.generate();
  await collection.insertOne({ 'url': url, 'shorturl': shortUrl });
  res.cookie('shorturl', 'turu.vercel.app/' + shortUrl, {maxAge: 60*1000,httpOnly: true});
  res.redirect('/');
  }
});

app.get('/getqr', (req, res) => {
  if(!req.query.qrurl) {
    res.redirect('/');
  } else {
    qr.toDataURL(req.query.qrurl,{ errorCorrectionLevel: 'H' }, (err,src) => {
      res.render('test', {src});
    })
  }
})

app.get('/:short', async (req,res) => {
  const db = client.db('url');
  const collection = db.collection('links');

  const result = await collection.findOne({ shorturl: req.params.short});
  if( result == null) {
    res.send('page not found');
  } else {
  res.redirect(result.url);
  }
})

app.listen(process.env.PORT || 3000);