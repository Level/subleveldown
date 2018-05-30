var test = require('tape')
var memdown = require('memdown')
var subdown = require('../leveldown')
var levelup = require('levelup')
var testCommon = require('./common')
var testBuffer = Buffer.from('this-is-test-data')

require('abstract-leveldown/abstract/open-test').args(down, test, testCommon)
require('abstract-leveldown/abstract/open-test').open(down, test, testCommon)
require('abstract-leveldown/abstract/del-test').all(down, test, testCommon)
require('abstract-leveldown/abstract/get-test').all(down, test, testCommon)
require('abstract-leveldown/abstract/put-test').all(down, test, testCommon)
require('abstract-leveldown/abstract/put-get-del-test').all(down, test, testCommon, testBuffer)
require('abstract-leveldown/abstract/batch-test').all(down, test, testCommon)
require('abstract-leveldown/abstract/chained-batch-test').all(down, test, testCommon)
require('abstract-leveldown/abstract/close-test').close(down, test, testCommon)
require('abstract-leveldown/abstract/iterator-test').all(down, test, testCommon)
require('abstract-leveldown/abstract/ranges-test').all(down, test, testCommon)

test('SubDown constructor', function (t) {
  t.test('can be called without new', function (t) {
    var sub = subdown()
    t.is(sub instanceof subdown, true, 'instanceof subdown')
    t.end()
  })
  t.test('missing prefix and missing separator', function (t) {
    var sub = subdown()
    t.is(sub.prefix, '!!')
    t.end()
  })
  t.test('prefix and missing separator', function (t) {
    var sub = subdown({}, 'prefix')
    t.is(sub.prefix, '!prefix!')
    t.end()
  })
  t.test('prefix and separator (as string)', function (t) {
    var sub = subdown({}, 'prefix', '%')
    t.is(sub.prefix, '%prefix%')
    t.end()
  })
  t.test('prefix and separator (as options)', function (t) {
    var sub = subdown({}, 'prefix', { separator: '%' })
    t.is(sub.prefix, '%prefix%')
    t.end()
  })
  t.test('prefix with same initial character as separator is sliced', function (t) {
    var sub = subdown({}, '!prefix')
    t.is(sub.prefix, '!prefix!')
    t.end()
  })
  t.test('prefix with same ending character as separator is sliced', function (t) {
    var sub = subdown({}, 'prefix!')
    t.is(sub.prefix, '!prefix!')
    t.end()
  })
  // TODO we're currently not guarded by multiple separators in the prefix
  // t.test('repeated separator is slices off from prefix parameter', function (t) {
  //   var sub = subdown({}, '!!prefix!!')
  //   t.is(sub.prefix, '!prefix!')
  //   t.end()
  // })
})

function down (loc) {
  return subdown(levelup(loc, {db: memdown}), 'test')
}
