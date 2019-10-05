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
var abstract = require('abstract-leveldown')
var inherits = require('util').inherits

// Test abstract-leveldown compliance
suite({
  test: test,
  factory: function () {
    return subdown(levelup(memdown()), 'test')
  },

  // Unsupported features
  seek: false,
  createIfMissing: false,
  errorIfExists: false,

  // Opt-in to new clear() tests
  clear: true
})

// Test without a user-provided levelup layer
suite({
  test: test,
  factory: function () {
    return subdown(memdown(), 'test')
  },

  // Unsupported features
  seek: false,
  createIfMissing: false,
  errorIfExists: false,

  // Opt-in to new clear() tests
  clear: true
})

// Additional tests for this implementation
test('SubDown constructor', function (t) {
  t.test('can be called without new', function (t) {
    var sub = subdown(memdown())
    t.is(sub instanceof subdown, true, 'instanceof subdown')
    t.end()
  })
  t.test('missing prefix and missing separator', function (t) {
    var sub = subdown(memdown())
    t.is(sub.prefix, '!!')
    t.end()
  })
  t.test('prefix and missing separator', function (t) {
    var sub = subdown(memdown(), 'prefix')
    t.is(sub.prefix, '!prefix!')
    t.end()
  })
  t.test('prefix and separator (as string)', function (t) {
    var sub = subdown(memdown(), 'prefix', '%')
    t.is(sub.prefix, '%prefix%')
    t.end()
  })
  t.test('prefix and separator (as options)', function (t) {
    var sub = subdown(memdown(), 'prefix', { separator: '%' })
    t.is(sub.prefix, '%prefix%')
    t.end()
  })
  t.test('prefix with same initial character as separator is sliced', function (t) {
    var sub = subdown(memdown(), '!prefix')
    t.is(sub.prefix, '!prefix!')
    t.end()
  })
  t.test('prefix with same ending character as separator is sliced', function (t) {
    var sub = subdown(memdown(), 'prefix!')
    t.is(sub.prefix, '!prefix!')
    t.end()
  })
  // TODO we're currently not guarded by multiple separators in the prefix
  // t.test('repeated separator is slices off from prefix parameter', function (t) {
  //   var sub = subdown(memdown(), '!!prefix!!')
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

    var mockdb = mock(abstract.AbstractLevelDOWN, {
      _open: function (opts, cb) {
        process.nextTick(cb, new Error('error from underlying store'))
      }
    })

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
      t.is(sub.db.db.db instanceof memdown, true, 'memdown')
      t.end()
    })
  })

  t.test('different sublevels can have different encodings', function (t) {
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

  t.test('cannot create a sublevel on a closed db', function (t) {
    t.plan(4)
    var db = levelup(memdown())
    db.once('open', function () {
      db.close(function (err) {
        t.error(err, 'no error')

        subdb(db, 'test').on('error', function (err) {
          t.is(err.message, 'Database is not open', 'sublevel not opened')
        })

        db.open(function (err) {
          t.error(err, 'no error')

          subdb(db, 'test').on('open', function () {
            t.pass('sublevel opened')
          })
        })
      })
    })
  })

  t.test('can close db and sublevel once opened', function (t) {
    t.plan(3)

    levelup(memdown(), function (err, db) {
      t.ifError(err, 'no open error')
      var sub = subdb(db, 'test')

      sub.once('open', function () {
        db.close(function (err) {
          t.ifError(err, 'no close error')
        })

        // Not needed, but shouldn't error
        sub.close(function (err) {
          t.ifError(err, 'no close error')
        })
      })
    })
  })

  t.test('cannot close db while sublevel is opening', function (t) {
    t.plan(5)

    levelup(memdown(), function (err, db) {
      t.ifError(err, 'no open error')
      var sub = subdb(db, 'test')

      sub.on('error', (err) => {
        t.is(err.message, 'Database is not open')
      })

      db.close(function (err) {
        t.ifError(err, 'no close error')
        t.is(reachdown(sub, 'subleveldown').status, 'new')
        t.is(reachdown(sub).status, 'closed')
      })

      sub.close(function () {
        t.fail('should not be called, because opening never finished')
      })
    })
  })

  t.test('cannot create sublevel while db is closing', function (t) {
    t.plan(6)

    levelup(memdown(), function (err, db) {
      t.ifError(err, 'no open error')

      db.close(function (err) {
        t.ifError(err, 'no close error')
        t.is(reachdown(sub, 'subleveldown').status, 'opening')
        t.is(reachdown(sub).status, 'closed')

        sub.on('error', (err) => {
          t.is(err.message, 'Database is not open')
          t.is(reachdown(sub, 'subleveldown').status, 'new')
        })
      })

      var sub = subdb(db, 'test')

      sub.on('open', function () {
        t.fail('should not open')
      })
    })
  })

  t.test('can reopen a sublevel without affecting encoding-down state of db', function (t) {
    t.plan(3)
    var db = levelup(encoding(memdown()))

    db.once('open', function () {
      var sub = subdb(db, 'test')

      sub.close(function (err) {
        t.ifError(err, 'no close error')

        // Previously, subleveldown would open a sublevel via levelup yet close
        // it via the innermost db (memdown). So at this point, the intermediate
        // encoding-down layer would still be open, leading levelup to believe
        // that encoding-down and its underlying memdown db need not be opened.
        // See https://github.com/Level/subleveldown/issues/60.
        sub.open(function (err) {
          t.error(err, 'no open error')
          t.is(reachdown(sub).status, 'open')
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
      t.is(sub1.db.db.db instanceof memdown, true, 'memdown')
      t.is(sub2.db instanceof encoding, true, 'sub2 encoding-down')
      t.is(sub2.db.db.prefix, '!test1!!test2!', 'sub2 prefix ok')
      t.is(sub2.db.db.type, 'subleveldown', '.type is subleveldown')
      t.is(sub2.db.db.db instanceof memdown, true, 'memdown')
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

    var mockdb = mock(abstract.AbstractLevelDOWN, {
      _iterator: function () {
        return {
          next: function (cb) {
            process.nextTick(cb, new Error('next() error from underlying store'))
          },
          end: function (cb) {
            process.nextTick(cb, new Error('end() error from underlying store'))
          }
        }
      }
    })

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

function getKey (entry) {
  return entry.key
}

function implement (ctor, methods) {
  function Test () {
    ctor.apply(this, arguments)
  }

  inherits(Test, ctor)

  for (var k in methods) {
    Test.prototype[k] = methods[k]
  }

  return Test
}

function mock (ctor, methods) {
  var Test = implement(ctor, methods)
  return new Test()
}
