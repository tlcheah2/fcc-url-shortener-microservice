'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI, {useNewUrlParser: true});

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


const Schema = mongoose.Schema;

const URLSchema = new Schema({
  url:  String
});

var UrlModel = mongoose.model('Url', URLSchema); 


app.post('/api/shorturl/new', (req, res) => {
  let original_url = req.body.url; 
  const url = new URL(original_url);
  let short_url;
  console.log('url hostname', url.hostname);
  // Lookup URL to verify it is a valid url 
  dns.lookup(url.hostname, (err, addr, family) => {
    console.log('err', err);
    if(err) { 
      res.json({error: 'invalid URL'});
      return;
    }
    
    UrlModel.find({url: original_url}, (err, data) => {
      console.log('err', err);
      console.log('data', data);
      if(data.length > 0) {
        short_url = data[0]._id;
        res.json({original_url, short_url});
      } else {
        const url = new UrlModel({url: original_url});
        url.save((err, data) => {
          console.log('successfully saved', data);
          short_url = data._id;
          res.json({original_url, short_url});
        })
      }
    });  
  });
})


app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = req.params.short_url;
  console.log('shortUrl', shortUrl);
  UrlModel.findById(shortUrl, (err, data) => {
    if(data) {
      res.redirect(302, data.url);
    } else {
      res.json({error: 'invalid URL'})
    }
  })
  
})


app.listen(port, function () {
  console.log('Node.js listening ...');
});