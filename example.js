var sub = require('./')
var levelup = require('levelup')
var memdown = require('memdown')

var db = levelup(memdown())

var test = sub(db, 'test', { valueEncoding: 'utf-8', separator: '@' })
var test2 = sub(test, 'tester', { valueEncoding: 'utf-8', separator: '@' })

test.put('hi', 'der', function () {
  test.get('hi', function (err, value) {
    if (err) throw err
    console.log('hi value:', value)
  })
  test.put('hello', ['world'], function (err) {
    if (err) throw err
    test.get('hello', function (err, value) {
      if (err) throw err
      console.log('hello value:', value)
    })
    test2.put('nested', 'value', function (err) {
      if (err) throw err
      test2.get('nested', function (err, value) {
        if (err) throw err
        console.log('nested value:', value)
        console.log('streaming all values should show buffers')
        db.createReadStream().on('data', console.log)
      })
    })
  })
})
