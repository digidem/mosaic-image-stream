var MultiStream = require('multistream')
var inherits = require('inherits')

function PixelMultiStream (streams, opts) {
  if (!(this instanceof PixelMultiStream)) return new PixelMultiStream(streams, opts)
  this.height = opts && opts.height
  MultiStream.call(this, streams, opts)
}

inherits(PixelMultiStream, MultiStream)

PixelMultiStream.prototype._gotNextStream = function (stream) {
  var self = this
  if (stream) {
    setImmediate(() => self.emit('stream', stream))
    if (stream.format && stream.format.height) {
      self._onFormat(stream.format)
    } else {
      stream.on('format', function (format) {
        self._onFormat(format)
      })
    }
  } else if (self._actualHeight !== self.format.height) {
    self.emit('error', new Error('Total height of mosaiced images (' + self._actualHeight +
      'px) did not match specified height (' + self.format.height + 'px)'))
  }
  MultiStream.prototype._gotNextStream.call(self, stream)
}

PixelMultiStream.prototype._onFormat = function (format) {
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
