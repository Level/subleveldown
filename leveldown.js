'use strict'

const inherits = require('inherits')
const abstract = require('abstract-leveldown')
const wrap = require('level-option-wrap')
const reachdown = require('reachdown')
const matchdown = require('./matchdown')

const rangeOptions = ['gt', 'gte', 'lt', 'lte']
const defaultClear = abstract.AbstractLevelDOWN.prototype._clear
const hasOwnProperty = Object.prototype.hasOwnProperty
const nextTick = abstract.AbstractLevelDOWN.prototype._nextTick

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

  this.iterator.next((err, key, value) => {
    if (err) return cb(err)
    if (key) key = key.slice(this.prefix.length)
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

  let separator = opts.separator

  if (!prefix) prefix = ''
  if (!separator) separator = '!'
  if (prefix[0] === separator) prefix = prefix.slice(1)
  if (prefix[prefix.length - 1] === separator) prefix = prefix.slice(0, -1)

  const code = separator.charCodeAt(0) + 1
  const ceiling = String.fromCharCode(code)

  Buffer.from(prefix).forEach(function (byte) {
    if (byte <= code) {
      throw new RangeError('Prefix must sort after ' + code)
    }
  })

  this.db = db
  this.prefix = separator + prefix + separator
  this._beforeOpen = opts.open

  let manifest = db.supports || {}

  // The parent db must open itself or be (re)opened by the user because a
  // sublevel can't (shouldn't) initiate state changes on the rest of the db.
  if (!manifest.deferredOpen && !reachdown.is(db, 'levelup')) {
    throw new Error('Parent database must support deferredOpen')
  }

  const subdb = reachdown(db, 'subleveldown')

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
    gt: (x) => {
      return concat(this.prefix, x || '', true)
    },
    lt: (x) => {
      if (!x || isEmptyBuffer(x)) {
        return this.prefix.slice(0, -1) + ceiling
      } else {
        return concat(this.prefix, x)
      }
    }
  }

  manifest = {
    // Inherit manifest from parent db
    ...manifest,

    // Disable unsupported features
    getMany: false,
    keyIterator: false,
    valueIterator: false,
    iteratorNextv: false,
    iteratorAll: false,

    // Unset additional methods (like approximateSize) which we can't support
    // here and should typically be called on the underlying store instead.
    additionalMethods: {}
  }

  abstract.AbstractLevelDOWN.call(this, manifest)
}

inherits(SubDown, abstract.AbstractLevelDOWN)

SubDown.prototype.type = 'subleveldown'

// TODO: remove _open() once abstract-leveldown supports deferredOpen,
// because that means we can always do operations on this.leveldown.
// Alternatively have the sublevel follow the open state of this.db.
SubDown.prototype._open = function (opts, cb) {
  // TODO: make _isOpening public in levelup or add a method like
  // ready(cb) which waits for - but does not initiate - a state change.
  const m = typeof this.db.isOpening === 'function' ? 'isOpening' : '_isOpening'

  const onopen = () => {
    if (!this.db.isOpen()) return cb(new Error('Parent database is not open'))
    if (this.leveldown.status !== 'open') return cb(new Error('Inner database is not open'))

    // TODO: add hooks to abstract-leveldown
    if (this._beforeOpen) return this._beforeOpen(cb)

    cb()
  }

  if (this.db[m]()) {
    this.db.once('open', onopen)
  } else {
    this._nextTick(onopen)
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
  for (let i = 0; i < operations.length; i++) {
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
  for (const k in opts) {
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
    nextTick(callback, new Error('Database is not open'))
    return true
  }

  return false
}

SubDown.prototype._iterator = function (opts) {
  const xopts = addRestOptions(wrap(opts, this._wrap), opts)
  return new SubIterator(this, this.leveldown.iterator(xopts), this.prefix)
}

module.exports = SubDown
