var util = require('util')
var abstract = require('abstract-leveldown')
var wrap = require('level-option-wrap')

var concat = function(prefix, key) {
  if (typeof key === 'string' && key.length) return prefix+key
  if (Buffer.isBuffer(key) && key.length) return Buffer.concat([new Buffer(prefix), key])
  return key
}

var SubIterator = function(ite, prefix) {
  this.iterator = ite
  this.prefix = prefix
}

SubIterator.prototype.next = function(cb) {
  var self = this
  this.iterator.next(cb && function(err, key, value) {
    if (err) return cb(err)
    if (key) key = key.slice(self.prefix.length)
    cb.apply(null, arguments)
  })
}

SubIterator.prototype.end = function(cb) {
  this.iterator.end(cb)
}

var SubDown = function(db, prefix, separator) {
  if (!(this instanceof SubDown)) return new SubDown(db, prefix)

  if (!prefix) prefix = ''
  if (!separator) separator = '!'
  if (prefix[0] === separator) prefix = prefix.slice(1)
  if (prefix[prefix.length-1] === separator) prefix = prefix.slice(0, -1)

  this.db = db
  this.leveldown = null
  this.prefix = separator+prefix+separator

  var self = this

  this._wrap = {
    gt: function(x) {
      return concat(self.prefix, (x || ''))
    },
    lt: function(x) {
      return concat(self.prefix, (x || '\xff'))
    }
  }

  abstract.AbstractLevelDOWN.call(this, 'no-location')
}

util.inherits(SubDown, abstract.AbstractLevelDOWN)

SubDown.prototype.type = 'subdown'

SubDown.prototype._open = function(opts, cb) {
  if (this.db.isOpen()) {
    if (this.db.db.type === 'subdown' && this.db.db.prefix) {
      this.prefix = this.db.db.prefix.slice(0, -1) + this.prefix
      this.leveldown = this.db.db.leveldown
    } else {
      this.leveldown = this.db.db
    }
    return cb()
  }

  this.db.on('open', this.open.bind(this, opts, cb))
}

SubDown.prototype.close = function() {
  this.leveldown.close.apply(this.leveldown, arguments)
}

SubDown.prototype.setDb = function() {
  this.leveldown.setDb.apply(this.leveldown, arguments)
}

SubDown.prototype.put = function(key, value, opts, cb) {
  this.leveldown.put(concat(this.prefix, key), value, opts, cb)
}

SubDown.prototype.get = function(key, opts, cb) {
  this.leveldown.get(concat(this.prefix, key), opts, cb)
}

SubDown.prototype.del = function(key, opts, cb) {
  this.leveldown.del(concat(this.prefix, key), opts, cb)
}

SubDown.prototype.batch =
SubDown.prototype._batch = function(operations, opts, cb) {
  if (arguments.length === 0) return new abstract.AbstractChainedBatch(this)
  if (!Array.isArray(operations)) return this.leveldown.batch.apply(null, arguments)

  var subops = new Array(operations.length)
  for (var i = 0; i < operations.length; i++) {
    var o = operations[i]
    subops[i] = {type:o.type, key:concat(this.prefix, o.key), value:o.value}
  }

  this.leveldown.batch(subops, opts, cb)
}

SubDown.prototype.approximateSize = function(start, end, cb) {
  this.leveldown.approximateSize.apply(this.leveldown, arguments)
}

SubDown.prototype.getProperty = function() {
  return this.leveldown.getProperty.apply(this.leveldown, arguments)
}

SubDown.prototype.destroy = function() {
  return this.leveldown.destroy.apply(this.leveldown, arguments)
}

SubDown.prototype.repair = function() {
  return this.leveldown.repair.apply(this.leveldown, arguments)
}

var extend = function(xopts, opts) {
  xopts.keys = opts.keys
  xopts.values = opts.values
  xopts.createIfMissing = opts.createIfMissing
  xopts.errorIfExists = opts.errorIfExists
  xopts.keyEncoding = opts.keyEncoding
  xopts.valueEncoding = opts.valueEncoding
  xopts.compression = opts.compression
  xopts.db = opts.db
  xopts.limit = opts.limit
  xopts.keyAsBuffer = opts.keyAsBuffer
  xopts.valueAsBuffer = opts.valueAsBuffer
  xopts.reverse = opts.reverse
  return xopts
}

var fixRange = function(opts) {
  return (!opts.reverse || (!opts.end && !opts.start)) ? opts : {start:opts.end, end:opts.start}
}

SubDown.prototype.iterator = function(opts) {
  if (!opts) opts = {}
  var xopts = extend(wrap(fixRange(opts), this._wrap), opts)
  return new SubIterator(this.leveldown.iterator(xopts), this.prefix)
}

module.exports = SubDown