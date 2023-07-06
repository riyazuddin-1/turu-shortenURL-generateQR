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
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
})

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true }));

app.use(cookieParser());

var uri = "mongodb://test:test@ac-trgrc9k-shard-00-00.k173qks.mongodb.net:27017,ac-trgrc9k-shard-00-01.k173qks.mongodb.net:27017,ac-trgrc9k-shard-00-02.k173qks.mongodb.net:27017/?ssl=true&replicaSet=atlas-11jyzg-shard-0&authSource=admin&retryWrites=true&w=majority";
const client = new MongoClient(uri);
client.connect().then(
  () => {console.log('Connected successfully to server');
}).catch(e => {
  console.log(e);
})

app.get('/', (req, res) => {
  res.render('home');
});

app.post('/urlapi', async (req, res)=> {
    const db = client.db('url');
    const collection = db.collection('links');
    const shortUrl = shortId.generate();
    await collection.insertOne({ 'url': req.body.queryUrl, 'shorturl': shortUrl });
    res.send('turu.vercel.app/' + shortUrl);
})

app.get('/getqr', (req, res) => {
  if(!req.query.qrurl) {
    res.redirect('/');
  } else {
    qr.toDataURL(req.query.qrurl,{ errorCorrectionLevel: 'H' }, (err,src) => {
      res.render('qr', {src});
    })
  }
})

app.post('/getqr', (req, res) => {
  if(req.body.qrurl) {
    qr.toDataURL(req.body.qrurl,{ errorCorrectionLevel: 'H' }, (err,src) => {
      res.send(src);
    })
  }
})

app.get('/chrome-extension', (req, res) => {
  res.render('chrome_extension');
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