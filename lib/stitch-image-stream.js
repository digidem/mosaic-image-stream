var from = require('from2')

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
  var count = streams.length
  var widths = Array(count)
  var bufs = Array(count).fill(new Buffer(0))
  var lineLen
  var feedMe
  var format
  var readable = Array(count)
  var pending = count
  var mosaicedStream = from(read)

  streams.forEach(setupStream)

  return mosaicedStream

  function read (size, next) {
    var lineAvailable = true
    for (var i = 0; i < count; i++) {
      if (!widths[i] || bufs[i].length < widths[i]) {
        lineAvailable = false
        break
      }
    }
    if (lineAvailable) {
      var chunks = Array(count)
      for (i = 0; i < count; i++) {
        chunks[i] = bufs[i].slice(0, widths[i])
        bufs[i] = bufs[i].slice(widths[i])
      }
      next(null, Buffer.concat(chunks, lineLen))
    } else if (pending) {
      feedMe = next
      readInternal()
    } else {
      next(null, null)
    }
  }

  function readInternal () {
    for (var i = 0; i < count; i++) {
      var isBufferFull = bufs[i].length >= widths[i]
      if (isBufferFull || !readable[i]) continue
      var chunk = streams[i].read()
      if (chunk === null) continue // console.log(i, 'null')
      bufs[i] = Buffer.concat([bufs[i], chunk])
    }
    if (feedMe) {
      setImmediate(feedMe)
      feedMe = null
    }
  }

  function setupStream (stream, i) {
    stream.on('readable', onReadable)
      .on('format', onFormat)
      .on('error', onError)
      .on('end', onEnd)

    function onReadable () {
      readable[i] = true
      readInternal()
    }

    function onStream (stream) {
      stream.on('format', onFormat)
    }

    function onEnd () {
      stream.removeListener('readable', onReadable)
      stream.removeListener('stream', onStream)
      stream.removeListener('format', onFormat)
      pending--
      readInternal()
    }

    function onFormat (inputFormat) {
      if (!format) {
        format = Object.assign({}, inputFormat)
      } else {
        if (inputFormat.height !== format.height) onError(new Error('input heights must be the same'))
        if (inputFormat.colorSpace !== format.colorSpace) onError(new Error('input color spaces must be the same'))
        format.width += inputFormat.width
      }
      widths[i] = widths[i] || inputFormat.width * COMPONENTS[format.colorSpace]
      if (widths.filter(Boolean).length === count) {
        lineLen = widths.reduce((p, w) => p + w)
        mosaicedStream.emit('format', Object.assign({}, format))
      }
    }
  }

  function onError (err) {
    mosaicedStream.emit('error', err)
  }
}
