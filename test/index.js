var test = require('tape')
var suite = require('abstract-leveldown/test')
var memdown = require('memdown')
var encoding = require('encoding-down')
var concat = require('level-concat-iterator')
var after = require('after')
var subdown = require('../leveldown')
var subdb = require('..')
var levelup = require('levelup')
var reachdown = require('reachdown')
var memdb = require('memdb')
var abstract = require('abstract-leveldown')
var inherits = require('util').inherits

// Test abstract-leveldown compliance
function runSuite (factory) {
  suite({
    test: test,
    factory: factory,

    // Unsupported features
    seek: false,
    createIfMissing: false,
    errorIfExists: false,

    // Opt-in to new clear() tests
    clear: true
  })
}

// Test basic prefix
runSuite(function factory () {
  return subdown(levelup(memdown()), 'test')
})

// Test empty prefix
runSuite(function factory () {
  return subdown(levelup(memdown()), '')
})

// Test custom separator
runSuite(function factory () {
  return subdown(levelup(memdown()), 'test', { separator: '%' })
})

// Test without a user-provided levelup layer
runSuite(function factory () {
  return subdown(memdown(), 'test')
})

// Additional tests for this implementation
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

  t.test('error from open() bubbles up', function (t) {
    t.plan(1)

    var mockdb = {
      open: function (cb) {
        process.nextTick(cb, new Error('error from underlying store'))
      }
    }

    subdb(mockdb, 'test').on('error', (err) => {
      t.is(err.message, 'error from underlying store')
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

  t.test('can wrap a sublevel and reopen the wrapped sublevel', function (t) {
    var db = levelup(memdown())
    var sub1 = subdb(db, 'test1')
    var sub2 = subdb(sub1, 'test2')

    sub2.once('open', function () {
      verify()

      sub2.close(function (err) {
        t.ifError(err, 'no close error')

        // Prefixes should be the same after closing & reopening
        // See https://github.com/Level/subleveldown/issues/78
        sub2.open(function (err) {
          t.ifError(err, 'no open error')
          verify()
          t.end()
        })
      })
    })

    function verify () {
      t.is(sub1.db instanceof encoding, true, 'sub1 encoding-down')
      t.is(sub1.db.db.prefix, '!test1!', 'sub1 prefix ok')
      t.is(sub1.db.db.leveldown instanceof memdown, true, 'memdown')
      t.is(sub2.db instanceof encoding, true, 'sub2 encoding-down')
      t.is(sub2.db.db.prefix, '!test1!!test2!', 'sub2 prefix ok')
      t.is(sub2.db.db.type, 'subleveldown', '.type is subleveldown')
      t.is(sub2.db.db.leveldown instanceof memdown, true, 'memdown')
    }
  })

  // See https://github.com/Level/subleveldown/issues/78
  t.test('doubly nested sublevel has correct prefix', function (t) {
    t.plan(3)

    var db = levelup(encoding(memdown()))
    var sub1 = subdb(db, '1')
    var sub2 = subdb(sub1, '2')
    var sub3 = subdb(sub2, '3')
    var next = after(3, verify)

    sub1.put('a', 'value', next)
    sub2.put('b', 'value', next)
    sub3.put('c', 'value', next)

    function verify (err) {
      t.ifError(err)

      concat(db.iterator(), function (err, entries) {
        t.ifError(err)
        t.same(entries.map(getKey), [
          '!1!!2!!3!c',
          '!1!!2!b',
          '!1!a'
        ])
      })
    }
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

  t.test('errors from iterator bubble up', function (t) {
    t.plan(2)

    var mockdb = {
      open: function (cb) {
        process.nextTick(cb)
      },
      iterator: function () {
        return {
          next: function (cb) {
            process.nextTick(cb, new Error('next() error from underlying store'))
          },
          end: function (cb) {
            process.nextTick(cb, new Error('end() error from underlying store'))
          }
        }
      }
    }

    var sub = subdb(mockdb, 'test')
    var it = sub.iterator()

    it.next(function (err) {
      t.is(err.message, 'next() error from underlying store')

      it.end(function (err) {
        t.is(err.message, 'end() error from underlying store')
      })
    })
  })
  t.test('can arbitrarily seek', function (t) {
    t.plan(7)

    var db = levelup(memdown())
    var sub = subdb(db, 'sub')

    db.once('open', function () {
      var it = sub.iterator({ keyAsBuffer: false, valueAsBuffer: false })
      sub.batch([
        { type: 'put', key: 'a', value: 'A' },
        { type: 'put', key: 'b', value: 'B' },
        { type: 'put', key: 'c', value: 'C' },
        { type: 'put', key: 'd', value: 'D' },
        { type: 'put', key: 'e', value: 'E' }
      ], (err) => {
        t.error(err, 'no error')
        it.seek('c')
        it.next((err, key, value) => {
          t.error(err, 'no error')
          t.same(key, 'c', 'key is as expected')
          it.seek('d')
          it.next((err, key, value) => {
            t.error(err, 'no error')
            t.same(key, 'd', 'key is as expected')
            it.seek('a')
            it.next((err, key, value) => {
              t.error(err, 'no error')
              t.same(key, 'a', 'key is as expected')
              t.end()
            })
          })
        })
      })
    })
  })

  t.test('clear (optimized)', function (t) {
    var down = memdown()
    t.is(typeof down.clear, 'function', 'has clear()')
    testClear(t, down)
  })

  t.test('clear (with iterator-based fallback)', function (t) {
    var down = memdown()
    down.clear = undefined
    testClear(t, down)
  })

  function testClear (t, down) {
    const db = levelup(down)
    const sub1 = subdb(db, '1')
    const sub2 = subdb(db, '2')

    populate([sub1, sub2], ['a', 'b'], function (err) {
      t.ifError(err, 'no populate error')

      verify(['!1!a', '!1!b', '!2!a', '!2!b'], function () {
        clear([sub1], {}, function (err) {
          t.ifError(err, 'no clear error')

          verify(['!2!a', '!2!b'], function () {
            populate([sub1], ['a', 'b'], function (err) {
              t.ifError(err, 'no populate error')

              clear([sub2], { lt: 'b' }, function (err) {
                t.ifError(err, 'no clear error')
                verify(['!1!a', '!1!b', '!2!b'], t.end.bind(t))
              })
            })
          })
        })
      })
    })

    function populate (subs, items, callback) {
      const next = after(subs.length, callback)

      for (const sub of subs) {
        sub.batch(items.map(function (item) {
          return { type: 'put', key: item, value: item }
        }), next)
      }
    }

    function clear (subs, opts, callback) {
      const next = after(subs.length, callback)

      for (const sub of subs) {
        sub.clear(opts, next)
      }
    }

    function verify (expected, callback) {
      concat(db.iterator({ keyAsBuffer: false }), function (err, entries) {
        t.ifError(err, 'no concat error')
        t.same(entries.map(getKey), expected)

        if (callback) callback()
      })
    }
  }
})

// https://github.com/Level/subleveldown/issues/87
test('can store any key', function (t) {
  t.test('iterating buffer keys with bytes above 196', function (t) {
    t.plan(3)

    var db = levelup(memdown())
    var sub = subdb(db, 'test', { keyEncoding: 'binary' })

    sub.once('open', function () {
      const batch = sub.batch()

      for (let i = 0; i < 256; i++) {
        batch.put(Buffer.from([i]), 'test')
      }

      batch.write(function (err) {
        t.ifError(err, 'no write error')

        concat(sub.iterator(), function (err, entries) {
          t.ifError(err, 'no concat error')
          t.is(entries.length, 256, 'sub yields all entries')
        })
      })
    })
  })

  t.test('range logic', function (t) {
    const db = levelup(memdown())
    const a = subdb(db, 'a', { separator: '#' })
    const aA = subdb(a, 'a', { separator: '#' })
    const b = subdb(db, 'b', { separator: '#' })
    const next = after(3, verify)

    a.once('open', next)
    aA.once('open', next)
    b.once('open', next)

    function wrapper (sub) {
      return reachdown(sub, 'subleveldown')._wrap
    }

    function verify () {
      const ranges = [
        wrapper(a).gt(),
        wrapper(aA).gt(),
        wrapper(aA).lt(),
        wrapper(a).lt(),
        wrapper(b).gt(),
        wrapper(b).lt()
      ]

      t.same(ranges, ['#a#', '#a##a#', '#a##a$', '#a$', '#b#', '#b$'])
      t.same(ranges.slice().sort(), ranges)
      t.end()
    }
  })

  t.end()
})

// Test that we peel off the levelup, deferred-leveldown and encoding-down
// layers from db, but stop at any other intermediate layer like encrypt-down,
// cachedown, etc.
test('subleveldown on intermediate layer', function (t) {
  t.plan(7)

  function Intermediate (db) {
    abstract.AbstractLevelDOWN.call(this)
    this.db = db
  }

  inherits(Intermediate, abstract.AbstractLevelDOWN)

  Intermediate.prototype._put = function (key, value, options, callback) {
    t.pass('got _put call')
    this.db._put('mitm' + key, value, options, callback)
  }

  Intermediate.prototype._get = function (key, options, callback) {
    t.pass('got _get call')
    this.db._get('mitm' + key, options, callback)
  }

  var db = levelup(encoding(new Intermediate(memdown())))
  var sub = subdb(db, 'test')

  sub.put('key', 'value', function (err) {
    t.error(err, 'no err')

    db.get('!test!key', function (err, value) {
      t.ifError(err, 'no levelup get error')
      t.is(value, 'value')
    })

    reachdown(db).get('mitm!test!key', { asBuffer: false }, function (err, value) {
      t.ifError(err, 'no memdown get error')
      t.is(value, 'value')
    })
  })
})

test('legacy memdb (old levelup)', function (t) {
  t.plan(7)

  // Should not result in double json encoding
  var db = memdb({ valueEncoding: 'json' })
  var sub = subdb(db, 'test', { valueEncoding: 'json' })

  // Integration with memdb still works because subleveldown waits to reachdown
  // until the (old levelup) db is open. Reaching down then correctly lands on
  // the memdown db. If subleveldown were to reachdown immediately it'd land on
  // the old deferred-leveldown (which when unopened doesn't have a reference to
  // the memdown db yet) so we'd be unable to persist anything.
  t.is(Object.getPrototypeOf(reachdown(db)).constructor.name, 'DeferredLevelDOWN')

  sub.put('key', { a: 1 }, function (err) {
    t.ifError(err, 'no put error')

    sub.get('key', function (err, value) {
      t.ifError(err, 'no get error')
      t.same(value, { a: 1 })
    })

    t.is(Object.getPrototypeOf(reachdown(db)).constructor.name, 'MemDOWN')

    reachdown(db).get('!test!key', { asBuffer: false }, function (err, value) {
      t.ifError(err, 'no get error')
      t.is(value, '{"a":1}')
    })
  })
})

function getKey (entry) {
  return entry.key
}
