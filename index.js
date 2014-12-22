var subdown = require('./subdown')
var levelup = require('levelup')

module.exports = function(db, prefix, opts) {
  if (!opts) opts = {}

  opts.db = function() {
    return subdown(db, prefix, opts.separator)
  }

  return levelup(opts)
}