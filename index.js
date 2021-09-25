'use strict'

const subdown = require('./leveldown')
const levelup = require('levelup')
const encoding = require('encoding-down')

module.exports = function (db, prefix, opts) {
  if (typeof prefix === 'object' && !opts) return module.exports(db, null, prefix)
  if (!opts) opts = {}

  const wrapped = levelup(encoding(subdown(db, prefix, opts), opts), opts)

  // Workaround for abstract-leveldown tests that expect db._nextTick
  // TODO: fix tests or add _nextTick to levelup for API parity
  if (!wrapped._nextTick) {
    wrapped._nextTick = subdown.prototype._nextTick
  }

  return wrapped
}
