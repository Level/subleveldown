# subleveldown

Sublevels implemented using leveldowns

```
npm install subleveldown
```

## Usage

``` js
var sub = require('subleveldown')
var level = require('level')

var db = level('db')

var test = sub(db, 'test') // test is just a regular levelup
var test2 = sub(db, 'test2')
var nested = sub(test, 'nested')

test.put('hello', 'world', function() {
  nested.put('hi', 'welt', function() {
    // will print {key:'hello', value:'world'}
    test.createReadStream().on('data', console.log)
  })
})
```

## License

MIT
