var dbidx = 0

module.exports = {
  location: location,
  cleanup: cleanup,
  lastLocation: lastLocation,
  setUp: setUp,
  tearDown: tearDown,
  collectEntries: collectEntries,
  makeExistingDbTest: makeExistingDbTest
}

function location () {
  return '_leveldown_test_db_' + dbidx++
}

function lastLocation () {
  return '_leveldown_test_db_' + dbidx
}

function cleanup (callback) {
  callback()
}

function setUp (t) {
  cleanup(function (err) {
    t.notOk(err, 'cleanup returned an error')
    t.end()
  })
}

function tearDown (t) {
  setUp(t) // same cleanup!
}

function collectEntries (iterator, callback) {
  var data = []
  next()

  function next () {
    iterator.next(function (err, key, value) {
      if (err) return callback(err)
      if (!arguments.length) {
        return iterator.end(function (err) {
          callback(err, data)
        })
      }
      data.push({ key: key, value: value })
      process.nextTick(next)
    })
  }
}

function makeExistingDbTest (name, test, leveldown, testFn) {
  test(name, function (t) {
    cleanup(function () {
      var loc = location()
      var db = leveldown(loc)

      db.open(function (err) {
        t.notOk(err, 'no error from open()')
        db.batch([
          {type: 'put', key: 'one', value: '1'},
          {type: 'put', key: 'two', value: '2'},
          {type: 'put', key: 'three', value: '3'}
        ], function (err) {
          t.notOk(err, 'no error from batch()')
          testFn(db, t, done, loc)
        })
      })

      function done (close) {
        if (close === false) return cleanup(t.end.bind(t))
        db.close(function (err) {
          t.notOk(err, 'no error from close()')
          cleanup(t.end.bind(t))
        })
      }
    })
  })
}
