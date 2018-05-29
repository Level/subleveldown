# subleveldown

Sublevels implemented using leveldowns

```
npm install subleveldown
```

[![Travis](http://img.shields.io/travis/Level/subleveldown.svg?style=flat)](http://travis-ci.org/Level/subleveldown)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

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

## API

#### `subdb = sub(db, [prefix], [options])`

Returns a levelup instance that uses the subleveldown with `prefix`.
The `options` argument is passed to the [levelup](https://github.com/rvagg/node-levelup) constructor

## License

MIT
