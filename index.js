var StitchImageStream = require('./lib/stitch-image-stream')
var PixelMultiStream = require('./lib/pixel-multi-stream')

function MosaicStream (tiles, height) {
  if (!height) throw new Error('Must specify the height of the mosaic')
  var pixelStreams = tiles.map(streams => PixelMultiStream(streams, height))
  return StitchImageStream(pixelStreams)
}

module.exports = MosaicStream
