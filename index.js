var subdown = require('./leveldown')
var levelup = require('levelup')

module.exports = function (db, prefix, opts) {
  if (typeof prefix === 'object' && !opts) return module.exports(db, null, prefix)
  if (!opts) opts = {}

  return levelup(subdown(db, prefix, opts), opts)
}
