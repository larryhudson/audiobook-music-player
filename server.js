// call all the required packages
const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer');
const process = require('./segment');
const mm = require("music-metadata");
 
//CREATE EXPRESS APP
const app = express();
app.use(bodyParser.urlencoded({extended: true})) 

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });  

//ROUTES WILL GO HERE
app.get('/', function(req, res) {
    res.json({ message: 'WELCOME' });   
});

var audiobookStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/audiobook')
    },
    filename: function (req, file, cb) {
        let splitAtDot = file.originalname.split('.')
        let ext = splitAtDot[splitAtDot.length - 1]
      cb(null, file.fieldname + '-' + Date.now() + '.' + ext)
    }
})
   
var audiobookUpload = multer({ storage: audiobookStorage })

var musicStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/music')
    },
    filename: function (req, file, cb) {
        let splitAtDot = file.originalname.split('.')
        let ext = splitAtDot[splitAtDot.length - 1]
      cb(null, file.fieldname + '-' + Date.now() + '.' + ext)
    }
})

var musicUpload = multer({ storage: musicStorage })

// app.post('/uploadfile', upload.single('myFile'), (req, res, next) => {
//     const file = req.file
//     if (!file) {
//       const error = new Error('Please upload a file')
//       error.httpStatusCode = 400
//       return next(error)
//     }
//       res.send(file)
    
//   })

  app.post('/upload-audiobook', audiobookUpload.array('audiobookFiles', 12), (req, res, next) => {
    const {files} = req
    if (!files) {
      const error = new Error('Please choose files')
      error.httpStatusCode = 400
      return next(error)
    }
    res.send(files)
    
})

app.post('/upload-music', musicUpload.array('musicFiles', 12), (req, res, next) => {
    const {files} = req
    if (!files) {
      const error = new Error('Please choose files')
      error.httpStatusCode = 400
      return next(error)
    }
    res.send(files)

    mm.parseFile(req.files[0].path).then(result => console.log(result))

    
})
 
app.listen(3000, () => console.log('Server started on port 3000'));