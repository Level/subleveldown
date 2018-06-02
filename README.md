# subleveldown

> Sublevels on top of [`levelup`][levelup] with different encodings for each sublevel.

[![level badge][level-badge]](https://github.com/level/awesome)
[![npm](https://img.shields.io/npm/v/subleveldown.svg)](https://www.npmjs.com/package/subleveldown)
![Node version](https://img.shields.io/node/v/subleveldown.svg)
[![Travis](https://img.shields.io/travis/Level/subleveldown.svg?style=flat)](http://travis-ci.org/Level/subleveldown)
[![dependencies](https://img.shields.io/david/Level/subleveldown.svg)](https://david-dm.org/level/subleveldown)
[![npm](https://img.shields.io/npm/dm/subleveldown.svg)](https://www.npmjs.com/package/subleveldown)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

**If you are upgrading:** please see [UPGRADING.md](UPGRADING.md).

## Install

```
npm i subleveldown -S
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

## API

### `subdb = sub(db, [prefix], [opts])`

Returns a `levelup` instance that uses subleveldown with `prefix` on top of the underlying \*down of `db`. Each sublevel is a `levelup` of its own which can have specific encodings.

In other words, it's possible to have e.g. one sublevel with Buffer keys and values and another sublevel with `'utf-8'` encoded keys and `json` encoded values.

The optional `opts` parameter has the following `subleveldown` specific properties:

* `opts.separator` *(string, default: `'!'`)* Character for separating sublevels
* `opts.open` *(function)* Optional open hook called when the underlying `levelup` instance has been opened. The hook has the signature `hook(cb)`, the callback must be called to finish opening

The `opts` argument is passed along to the underlying [`levelup`][levelup] and [`encoding-down`][encoding-down] constructors. See their documentation for further details.

## License

MIT

[level-badge]: http://leveldb.org/img/badge.svg
[levelup]: https://github.com/level/levelup
[encoding-down]: https://github.com/level/encoding-down
