var fs = require('fs')
var path = require('path')
var request = require('request')
var JPGDecoder = require('jpg-stream/decoder')
var JPGEncoder = require('jpg-stream/encoder')
var tilebelt = require('@mapbox/tilebelt')

var MAPBOX_TOKEN = 'pk.eyJ1IjoiZ21hY2xlbm5hbiIsImEiOiJSaWVtd2lRIn0.ASYMZE2HhwkAw4Vt7SavEg'
var urlBase = 'https://api.mapbox.com/v4/mapbox.streets/'

var Mosaic = require('../')

var zoom = 8
var tl = tilebelt.pointToTile(24, 48, zoom)
var br = tilebelt.pointToTile(72, 9, zoom)

var size = [br[0] - tl[0] + 1, br[1] - tl[1] + 1]
var factories = Array(size[0]).fill().map((v, i) => {
  var count = 0
  return function (cb) {
    var x = tl[0] + i
    var y = tl[1] + count
    if (++count > size[1]) return cb(null, null)
    var url = urlBase + zoom + '/' + x + '/' + y + '@2x.jpg?access_token=' + MAPBOX_TOKEN
    cb(null, request(url).pipe(new JPGDecoder()).on('error', err => {
      console.error(url)
      console.error(err)
    }))
  }
})

Mosaic(factories, size[1] * 512)
  .on('error', console.error)
  .pipe(new JPGEncoder())
  .pipe(fs.createWriteStream(path.join(__dirname, 'map_mosaic.jpg')))
