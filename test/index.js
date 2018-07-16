var test = require('tape')
var memdown = require('memdown')
var encoding = require('encoding-down')
var subdown = require('../leveldown')
var subdb = require('..')
var levelup = require('levelup')
var testCommon = require('./common')

require('abstract-leveldown/abstract/open-test').args(down, test, testCommon)
require('abstract-leveldown/abstract/open-test').open(down, test, testCommon)
require('abstract-leveldown/abstract/del-test').all(down, test, testCommon)
require('abstract-leveldown/abstract/get-test').all(down, test, testCommon)
require('abstract-leveldown/abstract/put-test').all(down, test, testCommon)
require('abstract-leveldown/abstract/put-get-del-test').all(down, test, testCommon)
require('abstract-leveldown/abstract/batch-test').all(down, test, testCommon)
require('abstract-leveldown/abstract/chained-batch-test').all(down, test, testCommon)
require('abstract-leveldown/abstract/close-test').close(down, test, testCommon)
require('abstract-leveldown/abstract/iterator-test').all(down, test, testCommon)
require('abstract-leveldown/abstract/iterator-range-test').all(down, test, testCommon)

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

test('SubDb main function', function (t) {
  t.test('opts.open hook', function (t) {
    t.plan(1)
    subdb(levelup(memdown()), 'test', {
      open: function (cb) {
        t.pass('opts.open called')
      }
    })
  })

  t.test('levelup *down is set to subdown which has correct storage', function (t) {
    var db = levelup(memdown())
    var sub = subdb(db, 'test')
    sub.once('open', function () {
      t.is(sub.db instanceof encoding, true, 'is encoding-down instance')
      t.is(sub.db.db instanceof subdown, true, 'is subdown instance')
      t.is(sub.db.db.type, 'subleveldown', '.type is subleveldown')
      t.is(sub.db.db.leveldown instanceof memdown, true, 'memdown')
      t.end()
    })
  })

  t.test('different sub levels can have different encodings', function (t) {
    t.plan(6)
    var db = levelup(memdown())
    var sub1 = subdb(db, 'test1', {
      valueEncoding: 'json'
    })
    var sub2 = subdb(db, 'test2', {
      keyEncoding: 'binary',
      valueEncoding: 'binary'
    })
    sub1.put('foo', { some: 'json' }, function (err) {
      t.error(err, 'no error')
      sub1.get('foo', function (err, value) {
        t.error(err, 'no error')
        t.same(value, { some: 'json' })
      })
    })
    sub2.put(Buffer.from([1, 2]), Buffer.from([2, 3]), function (err) {
      t.error(err, 'no error')
      sub2.get(Buffer.from([1, 2]), function (err, value) {
        t.error(err, 'no error')
        t.deepEqual(value, Buffer.from([2, 3]))
      })
    })
  })

  t.test('wrap a closed levelup and re-open levelup', function (t) {
    t.plan(3)
    var db = levelup(memdown())
    db.once('open', function () {
      db.close(function (err) {
        t.error(err, 'no error')
        var sub = subdb(db, 'test')
        sub.once('open', function () {
          t.pass('subdb openen')
        })
        db.open(function (err) {
          t.error(err, 'no error')
        })
      })
    })
  })

  t.test('wrapping a sub level', function (t) {
    var db = levelup(memdown())
    var sub1 = subdb(db, 'test1')
    var sub2 = subdb(sub1, 'test2')
    sub2.once('open', function () {
      t.is(sub1.db instanceof encoding, true, 'sub1 encoding-down')
      t.is(sub1.db.db.prefix, '!test1!', 'sub1 prefix ok')
      t.is(sub1.db.db.leveldown instanceof memdown, true, 'memdown')
      t.is(sub2.db instanceof encoding, true, 'sub2 encoding-down')
      t.is(sub2.db.db.prefix, '!test1!!test2!', 'sub2 prefix ok')
      t.is(sub2.db.db.type, 'subleveldown', '.type is subleveldown')
      t.is(sub2.db.db.leveldown instanceof memdown, true, 'memdown')
      t.end()
    })
  })

  t.test('iterator options are forwarded (issue #1)', function (t) {
    t.plan(4)
    var enc = { keyEncoding: 'utf8', valueEncoding: 'json' }
    var db = levelup(encoding(memdown(), enc))
    var sub = subdb(db, 'test', enc)
    var key = 'foo'
    var value = { hello: 'world' }
    sub.once('open', function () {
      sub.put(key, value, function () {
        db.createReadStream().on('data', function (r) {
          t.is(r.key, '!test!' + key, 'db key is utf8')
          t.deepEqual(r.value, value, 'db value is json')
        })
        sub.createReadStream().on('data', function (r) {
          t.is(r.key, key, 'sub db key is utf8')
          t.deepEqual(r.value, value, 'db value is json')
        })
      })
    })
  })

  t.test('concatenating Buffer keys', function (t) {
    t.plan(1)
    var db = levelup(memdown())
    var sub = subdb(db, 'test', { keyEncoding: 'binary' })
    var key = Buffer.from('00ff', 'hex')
    sub.once('open', function () {
      sub.put(key, 'bar', function () {
        db.createReadStream().on('data', function (r) {
          t.deepEqual(r.key, Buffer.concat([Buffer.from('!test!'), key]))
        })
      })
    })
  })

  t.test('subdb with no prefix', function (t) {
    t.plan(1)
    var db = levelup(memdown())
    var sub = subdb(db, { valueEncoding: 'json' })
    t.equal(sub.db._db.db.prefix, '!!')
  })
})

function down (loc) {
  return subdown(levelup(memdown()), 'test')
}
