'use strict'

const subdown = require('./leveldown')
const levelup = require('levelup')
const encoding = require('encoding-down')

module.exports = function (db, prefix, opts) {
  if (typeof prefix === 'object' && !opts) return module.exports(db, null, prefix)
  if (!opts) opts = {}

  return levelup(encoding(subdown(db, prefix, opts), opts), opts)
}
