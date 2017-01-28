var MultiStream = require('multistream')
var inherits = require('inherits')

/**
 * Takes an array of multiple [pixel-streams](https://github.com/devongovett/pixel-stream)
 * and returns a single pixel stream concatinating images vertically.
 * All input pixel-streams must be the same width and have the same colorSpace.
 *
 * @param {Array} streams Array of ReadableStream or functions that return a ReadableStream
 * @param {Number} height Total height of combined streams - must match actual height or will throw error
 * @param {Object} opts   Passed to MultiStream with in turn passes these opts to ReadableStream
 */
function PixelMultiStream (streams, height, opts) {
  if (!(this instanceof PixelMultiStream)) return new PixelMultiStream(streams, height, opts)
  this.height = height
  MultiStream.call(this, streams, opts)
}

inherits(PixelMultiStream, MultiStream)

/**
 * Wrap the `MultiStream.prototype._gotNextStream()` which is called for each new stream.
 * Reads the format from incoming streams and sets the format of the output stream
 * @param {ReadableStream} stream
 */
PixelMultiStream.prototype._gotNextStream = function (stream) {
  if (stream) {
    if (stream.format && stream.format.height) {
      onFormat.call(this, stream.format)
    } else {
      stream.on('format', onFormat.bind(this))
    }
  } else if (this._actualHeight !== this.format.height) {
    this.emit('error', new Error('Total height of mosaiced images (' + this._actualHeight +
      'px) did not match specified height (' + this.format.height + 'px)'))
  }
  MultiStream.prototype._gotNextStream.call(this, stream)
}

/**
 * When an incoming stream's format is available, read the width from the first stream and
 * ensure that subsequent streams share the same width and colorSpace.
 * @param {Object} format pixel-stream format object: `{ width, height, colorSpace }`
 */
function onFormat (format) {
  if (!this.format) {
    this.format = Object.assign({}, format, {height: this.height})
    this._actualHeight = format.height
    this.emit('format', this.format)
  } else {
    if (this.format.width !== format.width) this.emit('error', new Error('input widths must be the same'))
    if (this.format.colorSpace !== format.colorSpace) this.emit('error', new Error('input color spaces must be the same'))
    this._actualHeight += format.height
  }
}

module.exports = PixelMultiStream
