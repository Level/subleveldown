var inherits = require('inherits')
var abstract = require('abstract-leveldown')
var wrap = require('level-option-wrap')
var reachdown = require('reachdown')
var matchdown = require('./matchdown')

var rangeOptions = 'start end gt gte lt lte'.split(' ')
var defaultClear = abstract.AbstractLevelDOWN.prototype._clear
var hasOwnProperty = Object.prototype.hasOwnProperty
var END = Buffer.from([0xff])

function concat (prefix, key, force) {
  if (typeof key === 'string' && (force || key.length)) return prefix + key
  if (Buffer.isBuffer(key) && (force || key.length)) {
    return Buffer.concat([Buffer.from(prefix), key])
  }
  return key
}

function SubIterator (db, ite, prefix) {
  this.iterator = ite
  this.prefix = prefix

  abstract.AbstractIterator.call(this, db)
}

inherits(SubIterator, abstract.AbstractIterator)

SubIterator.prototype._next = function (cb) {
  var self = this
  this.iterator.next(function (err, key, value) {
    if (err) return cb(err)
    if (key) key = key.slice(self.prefix.length)
    cb.apply(null, arguments)
  })
}

SubIterator.prototype._seek = function (key) {
  this.iterator.seek(concat(this.prefix, key))
}

SubIterator.prototype._end = function (cb) {
  this.iterator.end(cb)
}

function SubDown (db, prefix, opts) {
  if (!(this instanceof SubDown)) return new SubDown(db, prefix, opts)
  if (typeof opts === 'string') opts = { separator: opts }
  if (!opts) opts = {}

  if (!db) {
    throw new Error('The db argument is required')
  }

  var separator = opts.separator
  var self = this

  if (!prefix) prefix = ''
  if (!separator) separator = '!'
  if (prefix[0] === separator) prefix = prefix.slice(1)
  if (prefix[prefix.length - 1] === separator) prefix = prefix.slice(0, -1)

  this.prefix = separator + prefix + separator
  this._beforeOpen = opts.open || process.nextTick
  this._externalOpener = reachdown(db, 'levelup') === db ? db : null

  var subdb = reachdown(db, 'subleveldown')

  if (subdb && subdb.prefix) {
    this.prefix = subdb.prefix + this.prefix
    this.leveldown = subdb.leveldown
  } else {
    this.leveldown = reachdown(db, matchdown, false)
  }

  // For compatibility with reachdown
  // TODO (next major): remove this.leveldown in favor of this.db
  this.db = this.leveldown

  this._wrap = {
    gt: function (x) {
      return concat(self.prefix, x || '', true)
    },
    lt: function (x) {
      if (Buffer.isBuffer(x) && !x.length) x = END
      return concat(self.prefix, x || '\xff')
    }
  }

  abstract.AbstractLevelDOWN.call(this)
}

inherits(SubDown, abstract.AbstractLevelDOWN)

SubDown.prototype.type = 'subleveldown'

SubDown.prototype._open = function (opts, cb) {
  var self = this

  if (this.leveldown.status === 'open') {
    process.nextTick(finish)
  } else if (this.leveldown.status === 'opening') {
    if (!this._externalOpener) {
      return process.nextTick(cb, new Error('Database was opened by third party'))
    }

    this._externalOpener.once('open', finish)
  } else if (this.leveldown.status === 'closing') {
    if (!this._externalOpener) {
      return process.nextTick(cb, new Error('Database was closed by third party'))
    }

    this._externalOpener.once('closed', function () {
      self._open(opts, cb)
    })
  } else {
    // TODO: pass levelup options?
    this.leveldown.open(finish)
  }

  function finish (err) {
    if (err) return cb(err)
    self._beforeOpen(cb)
  }
}

SubDown.prototype._close = function (cb) {
  var self = this

  if (this.leveldown.status === 'new' || this.leveldown.status === 'closed') {
    process.nextTick(cb)
  } else if (this.leveldown.status === 'closing') {
    if (!this._externalOpener) {
      return process.nextTick(cb, new Error('Database was closed by third party'))
    }

    this._externalOpener.once('closed', cb)
  } else if (this.leveldown.status === 'opening') {
    if (!this._externalOpener) {
      return process.nextTick(cb, new Error('Database was opened by third party'))
    }

    this._externalOpener.once('open', function () {
      self._close(cb)
    })
  } else {
    this.leveldown.close(cb)
  }
}

SubDown.prototype._serializeKey = function (key) {
  return Buffer.isBuffer(key) ? key : String(key)
}

SubDown.prototype._put = function (key, value, opts, cb) {
  this.leveldown.put(concat(this.prefix, key), value, opts, cb)
}

SubDown.prototype._get = function (key, opts, cb) {
  this.leveldown.get(concat(this.prefix, key), opts, cb)
}

SubDown.prototype._del = function (key, opts, cb) {
  this.leveldown.del(concat(this.prefix, key), opts, cb)
}

SubDown.prototype._batch = function (operations, opts, cb) {
  // No need to make a copy of the array, abstract-leveldown does that
  for (var i = 0; i < operations.length; i++) {
    operations[i].key = concat(this.prefix, operations[i].key)
  }

  this.leveldown.batch(operations, opts, cb)
}

SubDown.prototype._clear = function (opts, cb) {
  if (typeof this.leveldown.clear === 'function') {
    // Prefer optimized implementation of clear()
    opts = addRestOptions(wrap(opts, this._wrap), opts)
    this.leveldown.clear(opts, cb)
  } else {
    // Fall back to iterator-based implementation
    defaultClear.call(this, opts, cb)
  }
}

function addRestOptions (target, opts) {
  for (var k in opts) {
    if (hasOwnProperty.call(opts, k) && !isRangeOption(k)) {
      target[k] = opts[k]
    }
  }

  return target
}

function isRangeOption (k) {
  return rangeOptions.indexOf(k) !== -1
}

// TODO (refactor): use addRestOptions instead
function extend (xopts, opts) {
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
  xopts.fillCache = opts.fillCache
  return xopts
}

function fixRange (opts) {
  return (!opts.reverse || (!opts.end && !opts.start)) ? opts : { start: opts.end, end: opts.start }
}

SubDown.prototype._iterator = function (opts) {
  var xopts = extend(wrap(fixRange(opts), this._wrap), opts)
  return new SubIterator(this, this.leveldown.iterator(xopts), this.prefix)
}

module.exports = SubDown
