# mosaic-image-stream

[![npm](https://img.shields.io/npm/v/mosaic-image-stream.svg)](https://www.npmjs.com/package/mosaic-image-stream)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?maxAge=2592000)](http://standardjs.com/)

> Streaming mosaic of multiple images into a single image

Take a 2-D array of input [`pixel-streams`](https://github.com/devongovett/pixel-stream) and mosaic them together into a single image. Everything is streams, so you can theoretically mosaic thousands of images into a megapixel image without much memory usage.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
- [Contribute](#contribute)
- [License](#license)

## Install

```
npm i mosaic-image-stream
```

## Usage

See [examples](./example).

Mosaic local file streams:

```js
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

Mosaic(streams, {height: 300})
  .pipe(new PNGEncoder())
  .pipe(fs.createWriteStream(path.join(__dirname, 'file_mosaic.png')))
```

Mosaic a whole bunch of images from Flickr:

```js
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

  Mosaic(factories, {height: size[1] * 150})
    .on('error', console.error)
    .pipe(new JPEGEncoder())
    .pipe(fs.createWriteStream(path.join(__dirname, 'flickr_mosaic.jpg')))
})
```

Input streams must be [`pixel-streams`](https://github.com/devongovett/pixel-stream). If you want to stream raw image data, stream it through a `pixel-stream` constructed with your image width, height and color space:

```js
myRawImageStream.pipe(new PixelStream(myImageWidth, myImageHeight, {colorSpace: myImageColorSpace}))
```

## API

```js
var Mosaic = require('mosaic-image-stream')
```

### Mosaic(streams, height)

Where:

- `streams` - a 2-d array of input stream, columns, then rows.
- `height` - the total height of the input streams (width can be calculated on the fly from input images)

All input streams *must* have the same dimensions and color space - the output stream will throw an error if they differ, or if the total height of the input streams does not match the height specified.

Returns a [`pixel-stream`](https://github.com/devongovett/pixel-stream).

## Contribute

PRs accepted.

Small note: If editing the Readme, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

MIT © Gregor MacLennan / Digital Democracy
