var inherits = require('inherits')
var abstract = require('abstract-leveldown')
var wrap = require('level-option-wrap')
var reachdown = require('reachdown')
var matchdown = require('./matchdown')

var rangeOptions = 'start end gt gte lt lte'.split(' ')
var defaultClear = abstract.AbstractLevelDOWN.prototype._clear
var hasOwnProperty = Object.prototype.hasOwnProperty

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
  if (maybeError(this.db.leveldown, cb)) return

  var self = this
  this.iterator.next(function (err, key, value) {
    if (err) return cb(err)
    if (key) key = key.slice(self.prefix.length)
    cb(err, key, value)
  })
}

SubIterator.prototype._seek = function (key) {
  this.iterator.seek(concat(this.prefix, key))
}

SubIterator.prototype._end = function (cb) {
  if (maybeError(this.db.leveldown, cb)) return
  this.iterator.end(cb)
}

function SubDown (db, prefix, opts) {
  if (!(this instanceof SubDown)) return new SubDown(db, prefix, opts)
  if (typeof opts === 'string') opts = { separator: opts }
  if (!opts) opts = {}

  var separator = opts.separator

  if (!prefix) prefix = ''
  if (!separator) separator = '!'
  if (prefix[0] === separator) prefix = prefix.slice(1)
  if (prefix[prefix.length - 1] === separator) prefix = prefix.slice(0, -1)

  var code = separator.charCodeAt(0) + 1
  var ceiling = String.fromCharCode(code)

  Buffer.from(prefix).forEach(function (byte) {
    if (byte <= code) {
      throw new RangeError('Prefix must sort after ' + code)
    }
  })

  this.db = db
  this.prefix = separator + prefix + separator
  this._beforeOpen = opts.open

  var self = this
  var manifest = db.supports || {}

  // The parent db must open itself or be (re)opened by the user because a
  // sublevel can't (shouldn't) initiate state changes on the rest of the db.
  if (!manifest.deferredOpen && !reachdown.is(db, 'levelup')) {
    throw new Error('Parent database must support deferredOpen')
  }

  var subdb = reachdown(db, 'subleveldown')

  if (subdb) {
    // Old subleveldown doesn't know its prefix and leveldown until opened
    if (!subdb.prefix || !subdb.leveldown) {
      throw new Error('Incompatible with subleveldown < 5.0.0')
    }

    this.prefix = subdb.prefix + this.prefix
    this.leveldown = subdb.leveldown
  } else {
    this.leveldown = reachdown(db, matchdown, false)
  }

  if (reachdown.is(this.leveldown, 'deferred-leveldown')) {
    // Old deferred-leveldown doesn't expose its underlying db until opened
    throw new Error('Incompatible with deferred-leveldown < 2.0.0')
  } else if (!this.leveldown.status) {
    // Old abstract-leveldown doesn't have a status property
    throw new Error('Incompatible with abstract-leveldown < 2.4.0')
  }

  this._wrap = {
    gt: function (x) {
      return concat(self.prefix, x || '', true)
    },
    lt: function (x) {
      if (!x || isEmptyBuffer(x)) {
        return self.prefix.slice(0, -1) + ceiling
      } else {
        return concat(self.prefix, x)
      }
    }
  }

  abstract.AbstractLevelDOWN.call(this)
}

inherits(SubDown, abstract.AbstractLevelDOWN)

SubDown.prototype.type = 'subleveldown'

// TODO: remove _open() once abstract-leveldown supports deferredOpen,
// because that means we can always do operations on this.leveldown.
// Alternatively have the sublevel follow the open state of this.db.
SubDown.prototype._open = function (opts, cb) {
  var self = this

  // TODO: make _isOpening public in levelup or add a method like
  // ready(cb) which waits for - but does not initiate - a state change.
  var m = typeof this.db.isOpening === 'function' ? 'isOpening' : '_isOpening'

  if (this.db[m]()) {
    this.db.once('open', onopen)
  } else {
    this._nextTick(onopen)
  }

  function onopen () {
    if (!self.db.isOpen()) return cb(new Error('Parent database is not open'))
    if (self.leveldown.status !== 'open') return cb(new Error('Inner database is not open'))

    // TODO: add hooks to abstract-leveldown
    if (self._beforeOpen) return self._beforeOpen(cb)

    cb()
  }
}

SubDown.prototype._serializeKey = function (key) {
  return Buffer.isBuffer(key) ? key : String(key)
}

SubDown.prototype._put = function (key, value, opts, cb) {
  if (maybeError(this.leveldown, cb)) return
  this.leveldown.put(concat(this.prefix, key), value, opts, cb)
}

SubDown.prototype._get = function (key, opts, cb) {
  if (maybeError(this.leveldown, cb)) return
  this.leveldown.get(concat(this.prefix, key), opts, cb)
}

SubDown.prototype._del = function (key, opts, cb) {
  if (maybeError(this.leveldown, cb)) return
  this.leveldown.del(concat(this.prefix, key), opts, cb)
}

SubDown.prototype._batch = function (operations, opts, cb) {
  if (maybeError(this.leveldown, cb)) return

  // No need to make a copy of the array, abstract-leveldown does that
  for (var i = 0; i < operations.length; i++) {
    operations[i].key = concat(this.prefix, operations[i].key)
  }

  this.leveldown.batch(operations, opts, cb)
}

SubDown.prototype._clear = function (opts, cb) {
  if (maybeError(this.leveldown, cb)) return

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

function isEmptyBuffer (key) {
  return Buffer.isBuffer(key) && key.length === 0
}

// Before any operation, check if the inner db is open. Needed
// because we don't follow open state of the parent db atm.
// TODO: move to abstract-leveldown
function maybeError (leveldown, callback) {
  if (leveldown.status !== 'open') {
    // Same error message as levelup
    // TODO: use require('level-errors').ReadError
    process.nextTick(callback, new Error('Database is not open'))
    return true
  }

  return false
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
