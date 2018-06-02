# subleveldown

> Sublevels on top of [`levelup`][levelup] with different encodings for each sublevel.

[![level badge][level-badge]](https://github.com/level/awesome)
[![npm](https://img.shields.io/npm/v/subleveldown.svg)](https://www.npmjs.com/package/subleveldown)
![Node version](https://img.shields.io/node/v/subleveldown.svg)
[![Travis](https://img.shields.io/travis/Level/subleveldown.svg?style=flat)](http://travis-ci.org/Level/subleveldown)
[![dependencies](https://img.shields.io/david/Level/subleveldown.svg)](https://david-dm.org/level/subleveldown)
[![npm](https://img.shields.io/npm/dm/subleveldown.svg)](https://www.npmjs.com/package/subleveldown)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Table of Contents

<details><summary>Click to expand</summary>

- [Usage](#usage)
- [Background](#background)
- [API](#api)
- [Install](#install)
- [License](#license)

</details>

## Usage

**If you are upgrading:** please see [UPGRADING.md](UPGRADING.md).

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

## Background

`subleveldown` separates a [`levelup`][levelup] database into sections - or *sublevels* from here on out. Think SQL tables, but evented, ranged and realtime!

Each sublevel is a `levelup` of its own. This means it has the exact same interface as its parent database, but its own keyspace and [events](https://github.com/Level/levelup#events). In addition, sublevels are individually wrapped with [`encoding-down`][encoding-down], giving us per-sublevel encodings. For example, it's possible to have one sublevel with Buffer keys and another with `'utf8'` encoded keys. The same goes for values. Like so:

```js
sub(db, 'one', { valueEncoding: 'json' })
sub(db, 'two', { keyEncoding: 'binary' })
```

There is one limitation, however: keys must *encode to* either strings or Buffers. This is not likely to affect you, unless you use custom encodings or the `id` encoding (which bypasses encodings and thus makes it your responsibility to ensure keys are either strings or Buffers).

Authored by [@mafintosh](https://github.com/mafintosh) and inspired by [`level-sublevel`][level-sublevel] by [@dominictarr](https://github.com/dominictarr), `subleveldown` has become an official part of [Level][level-org]. As `level-sublevel` is no longer under active development, we recommend switching to `subleveldown` to get the latest and greatest of the Level ecosystem. These two modules largely offer the same functionality, except for [hooks](https://github.com/dominictarr/level-sublevel#hooks) and [per-batch prefixes](https://github.com/dominictarr/level-sublevel#batches).

## API

### `subdb = sub(db[, prefix][, options])`

Returns a `levelup` instance that uses subleveldown to prefix the keys of the underlying store of `db`. The required `db` parameter must be a `levelup` instance. Any layers that this instance may have (like `encoding-down` or `subleveldown` itself) are peeled off to get to the innermost [`abstract-leveldown`][abstract-leveldown] compliant store (like `leveldown`). This ensures there is no double encoding step.

The `prefix` must be a string. If omitted, the effective prefix is two separators, e.g. `'!!'`. If `db` is already a subleveldown-powered instance, the effective prefix is a combined prefix, e.g. `'!one!!two!'`.

The optional `options` parameter has the following `subleveldown` specific properties:

* `separator` *(string, default: `'!'`)* Character for separating sublevel prefixes from user keys and each other. Should be outside the character (or byte) range of user keys.
* `open` *(function)* Optional open hook called when the underlying `levelup` instance has been opened. The hook receives a callback which must be called to finish opening.

Any other `options` are passed along to the underlying [`levelup`][levelup] and [`encoding-down`][encoding-down] constructors. See their documentation for further details.

## Install

With [npm](https://npmjs.org) do:

```
npm i subleveldown -S
```

## License

MIT © 2014-present [Mathias Buus](https://github.com/mafintosh) and [contributors](https://github.com/Level/subleveldown/graphs/contributors). See the included [LICENSE](./LICENSE.md) file for more details.

[level-badge]: http://leveldb.org/img/badge.svg
[levelup]: https://github.com/level/levelup
[encoding-down]: https://github.com/level/encoding-down
[abstract-leveldown]: https://github.com/level/abstract-leveldown
[level-sublevel]: https://github.com/dominictarr/level-sublevel
[level-org]: https://github.com/Level
