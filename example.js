var sub = require('./')
var memdb = require('memdb')

var db = memdb()

var test = sub(db, 'test', {valueEncoding:'utf-8'})
var test2 = sub(test, 'tester', {valueEncoding:'utf-8'})

test.put('hi', 'der')
test.put('hello', ['world'], function() {
  test2.put('nested', 'value', function() {
    db.createReadStream().on('data', console.log)
  })
})