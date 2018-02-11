var test = require('tape')
var memdown = require('memdown')
var subdown = require('../leveldown')
var levelup = require('levelup')
var testCommon = require('./common')

require('abstract-leveldown/abstract/open-test').args(down, test, testCommon)
require('abstract-leveldown/abstract/del-test').all(down, test, testCommon)
require('abstract-leveldown/abstract/get-test').all(down, test, testCommon)
require('abstract-leveldown/abstract/put-test').all(down, test, testCommon)
require('abstract-leveldown/abstract/put-get-del-test').all(down, test, testCommon)
require('abstract-leveldown/abstract/batch-test').all(down, test, testCommon)
require('abstract-leveldown/abstract/chained-batch-test').all(down, test, testCommon)
require('abstract-leveldown/abstract/close-test').close(down, test, testCommon)
require('abstract-leveldown/abstract/iterator-test').all(down, test, testCommon)
require('abstract-leveldown/abstract/iterator-range-test').all(down, test, testCommon)

function down (loc) {
  return subdown(levelup(memdown()), 'test')
}
