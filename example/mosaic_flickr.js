var fs = require('fs')
var path = require('path')
var request = require('request')
var JPEGDecoder = require('jpg-stream/decoder')
var JPEGEncoder = require('jpg-stream/encoder')

var Mosaic = require('../')

var reqUrl = 'https://api.flickr.com/services/rest/?' +
  'method=flickr.photos.search&' +
  'api_key=ea621d507593aa247dcaa792268b93d7&' +
  'tags=portrait&' +
  'sort=interestingness-desc&' +
  'media=photos&' +
  'extras=url_q&' +
  'format=json&' +
  'nojsoncallback=1&' +
  'per_page=500'

// One of the images Flickr returns does not have a height of 150px, even though the Flickr API thinks it does
var badUrl = 'https://farm2.staticflickr.com/1554/24516806801_084046c4dc_q.jpg'

var size = [15, 15]

request(reqUrl, function (err, resp, body) {
  if (err) return console.error(err)
  var urls = JSON.parse(body).photos.photo
    .map(d => d.url_q)
    .filter(d => d !== badUrl)
  var factories = Array(size[0]).fill().map((v, i) => {
    var count = 0
    return function (cb) {
      var url = urls[count + i * size[1]]
      if (++count > size[1]) return cb(null, null)
      cb(null, request(url).pipe(new JPEGDecoder()))
    }
  })

  Mosaic(factories, size[1] * 150)
    .on('error', console.error)
    .pipe(new JPEGEncoder())
    .pipe(fs.createWriteStream(path.join(__dirname, 'flickr_mosaic.jpg')))
})
