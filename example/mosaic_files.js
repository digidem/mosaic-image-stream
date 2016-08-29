var fs = require('fs')
var path = require('path')
var PNGDecoder = require('png-stream/decoder')
var PNGEncoder = require('png-stream/encoder')

var Mosaic = require('../')

var baseName = path.join(__dirname, 'images/image')

var streams = [
  [
    fs.createReadStream(baseName + '1.png').pipe(new PNGDecoder()),
    fs.createReadStream(baseName + '2.png').pipe(new PNGDecoder()),
    fs.createReadStream(baseName + '3.png').pipe(new PNGDecoder())
  ],
  [
    fs.createReadStream(baseName + '4.png').pipe(new PNGDecoder()),
    fs.createReadStream(baseName + '5.png').pipe(new PNGDecoder()),
    fs.createReadStream(baseName + '6.png').pipe(new PNGDecoder())
  ],
  [
    fs.createReadStream(baseName + '7.png').pipe(new PNGDecoder()),
    fs.createReadStream(baseName + '8.png').pipe(new PNGDecoder()),
    fs.createReadStream(baseName + '9.png').pipe(new PNGDecoder())
  ]
]

Mosaic(streams, 300)
  .pipe(new PNGEncoder())
  .pipe(fs.createWriteStream(path.join(__dirname, 'file_mosaic.png')))
