var block = require('block-stream2')
var interleave = require('interleave-stream')
var pumpify = require('pumpify')
var BufferPeekStream = require('buffer-peek-stream').BufferPeekStream

// color space component counts
var COMPONENTS = {
  rgb: 3,
  rgba: 4,
  cmyk: 4,
  gray: 1,
  graya: 2,
  indexed: 1
}

/**
 * Stitches together multiple images horizontally.
 * @param {Array} streams Array of image pixel-streams to merge
 * @return {ReadableStream}
 */
module.exports = function StitchImageStream (streams) {
  var pending = streams.length
  var blockStreams = streams.map(createBlockStream)
  var outputFormat

  var mosaicedStream = interleave(blockStreams)
  var output = pumpify()
  return output

  function createBlockStream (stream, i) {
    var buffer = new BufferPeekStream({peekBytes: 2})
    var blockStream = pumpify()
    stream.on('format', onFormat)
    stream.on('error', onError)
    stream.pipe(buffer)
    return blockStream

    function onFormat (inputFormat) {
      if (!outputFormat) {
        outputFormat = Object.assign({}, inputFormat)
      } else {
        if (inputFormat.height !== outputFormat.height) onError(new Error('input heights must be the same'))
        if (inputFormat.colorSpace !== outputFormat.colorSpace) onError(new Error('input color spaces must be the same'))
        outputFormat.width += inputFormat.width
      }
      var inputBlockSize = inputFormat.width * COMPONENTS[outputFormat.colorSpace]
      blockStream.setPipeline(buffer, block(inputBlockSize))
      if (--pending === 0) {
        var outputBlockSize = outputFormat.width * COMPONENTS[outputFormat.colorSpace]
        output.emit('format', Object.assign({}, outputFormat))
        output.setPipeline(mosaicedStream, block(outputBlockSize))
      }
    }
  }

  function onError (err) {
    mosaicedStream.destroy(err)
  }
}
