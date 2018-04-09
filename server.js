const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient
const multer = require('multer');//needed for image upload

var db

MongoClient.connect('mongodb://demo:demo@ds125146.mlab.com:25146/savage', (err, database) => {
  if (err) return console.log(err)
  db = database
  app.listen(process.env.PORT || 8000, () => {
    console.log('listening on 8000')
  })
})

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(express.static('public'))

//---------------------------------------
// IMAGE CODE
//---------------------------------------
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/images/uploads')
    },
    filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now())
    }
});
var upload = multer({storage: storage});

app.post('/up', upload.single('file-to-upload'), (req, res, next) => {

    insertDocuments(db, 'public/images/uploads/' + req.file.filename, () => {
        db.close();
        res.json({'message': 'File uploaded successfully'});
    });
});

var insertDocuments = function(db, filePath, callback) {
    var collection = db.collection('user');
    collection.insertOne({'imagePath' : filePath }, (err, result) => {
        //assert.equal(err, null);
        callback(result);
    });
}
//---------------------------------------
// IMAGE CODE END
//---------------------------------------


app.get('/', (req, res) => {
  db.collection('messages').find().toArray((err, result) => {
    if (err) return console.log(err)
    res.render('index.ejs', {messages: result})
  })
})

app.get('/react', (req, res) => {
  db.collection('messages').find().toArray((err, result) => {
    if (err) return console.log(err)
    res.json(result)
  })
})

app.post('/messages', (req, res) => {
  db.collection('messages').save({name: req.body.name, msg: req.body.msg, thumbUp: 0, thumbDown:0}, (err, result) => {
    if (err) return console.log(err)
    console.log('saved to database')
    res.redirect('/')
  })
})

app.put('/messages', (req, res) => {
  db.collection('messages')
  .findOneAndUpdate({name: req.body.name, msg: req.body.msg}, {
    $set: {
      thumbUp:req.body.thumbUp + 1
    }
  }, {
    sort: {_id: -1},
    upsert: true
  }, (err, result) => {
    if (err) return res.send(err)
    res.send(result)
  })
})

app.delete('/messages', (req, res) => {
  db.collection('messages').findOneAndDelete({name: req.body.name, msg: req.body.msg}, (err, result) => {
    if (err) return res.send(500, err)
    res.send('Message deleted!')
  })
})
