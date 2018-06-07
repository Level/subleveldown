var dbidx = 0

module.exports = {
  location: location,
  cleanup: cleanup,
  lastLocation: lastLocation,
  setUp: setUp,
  tearDown: tearDown,
  collectEntries: collectEntries
}

function location () {
  return '_leveldown_test_db_' + dbidx++
}

function lastLocation () {
  return '_leveldown_test_db_' + dbidx
}

function cleanup (callback) {
  process.nextTick(callback)
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
