# subleveldown

**Superseded by [`abstract-level`](https://github.com/Level/abstract-level). Please see [Frequently Asked Questions](https://github.com/Level/community#faq).**

## Table of Contents

<details><summary>Click to expand</summary>

- [Usage](#usage)
- [Background](#background)
- [API](#api)
  - [`subdb = sub(db[, prefix][, options])`](#subdb--subdb-prefix-options)
- [Install](#install)
- [Contributing](#contributing)
- [Donate](#donate)
- [License](#license)

</details>

## Usage

_If you are upgrading: please see [UPGRADING.md](UPGRADING.md)._

```js
const sub = require('subleveldown')
const level = require('level')

const db = level('db')
const example = sub(db, 'example')
const nested = sub(example, 'nested')
```

The `example` and `nested` db's are just regular [`levelup`][levelup] instances:

```js
example.put('hello', 'world', function () {
  nested.put('hi', 'welt', function () {
    // Prints { key: 'hi', value: 'welt' }
    nested.createReadStream().on('data', console.log)
  })
})
```

Or with promises and iterators:

```js
await example.put('hello', 'world')
await nested.put('hi', 'welt')

for await (const [key, value] of nested.iterator()) {
  // Prints ['hi', 'welt']
  console.log([key, value])
}
```

Sublevels see their own keys as well as keys of any nested sublevels:

```js
// Prints:
// { key: '!nested!hi', value: 'welt' }
// { key: 'hello', value: 'world' }
example.createReadStream().on('data', console.log)
```

They also support `db.clear()` which is very useful to empty a bucket of stuff:

```js
example.clear(function (err) {})

// Or delete a range within `example`
example.clear({ gt: 'hello' }, function (err) {})

// With promises
await example.clear()
```

## Background

`subleveldown` separates a [`levelup`][levelup] database into sections - or _sublevels_ from here on out. Think SQL tables, but evented, ranged and realtime!

Each sublevel is a `levelup` of its own. This means it has the exact same interface as its parent database, but its own keyspace and [events](https://github.com/Level/levelup#events). In addition, sublevels are individually wrapped with [`encoding-down`][encoding-down], giving us per-sublevel encodings. For example, it's possible to have one sublevel with Buffer keys and another with `'utf8'` encoded keys. The same goes for values. Like so:

```js
sub(db, 'one', { valueEncoding: 'json' })
sub(db, 'two', { keyEncoding: 'binary' })
```

There is one limitation, however: keys must _encode to_ either strings or Buffers. This is not likely to affect you, unless you use custom encodings or the `id` encoding (which bypasses encodings and thus makes it your responsibility to ensure keys are either strings or Buffers). If in that case you do pass in a key that is not a string or Buffer, it will be irreversibly converted to a string.

Authored by [@mafintosh](https://github.com/mafintosh) and inspired by [`level-sublevel`][level-sublevel] by [@dominictarr](https://github.com/dominictarr), `subleveldown` has become an official part of [Level][level-org]. As `level-sublevel` is no longer under active development, we recommend switching to `subleveldown` to get the latest and greatest of the Level ecosystem. These two modules largely offer the same functionality, except for [hooks](https://github.com/dominictarr/level-sublevel#hooks) and [per-batch prefixes](https://github.com/dominictarr/level-sublevel#batches).

## API

### `subdb = sub(db[, prefix][, options])`

Returns a `levelup` instance that uses subleveldown to prefix the keys of the underlying store of `db`. The required `db` parameter must be a `levelup` instance. Any layers that this instance may have (like `encoding-down` or `subleveldown` itself) are peeled off to get to the innermost [`abstract-leveldown`][abstract-leveldown] compliant store (like `leveldown`). This ensures there is no double encoding step.

The `prefix` must be a string. If omitted, the effective prefix is two separators, e.g. `'!!'`. If `db` is already a subleveldown-powered instance, the effective prefix is a combined prefix, e.g. `'!one!!two!'`.

The optional `options` parameter has the following `subleveldown` specific properties:

- `separator` _(string, default: `'!'`)_ Character for separating sublevel prefixes from user keys and each other. Must sort before characters used in prefixes. An error will be thrown if that's not the case.
- `open` _(function)_ Optional open hook called when the underlying `levelup` instance has been opened. The hook receives a callback which must be called to finish opening.

Any other `options` are passed along to the underlying [`levelup`][levelup] and [`encoding-down`][encoding-down] constructors. See their documentation for further details.

## Install

With [npm](https://npmjs.org) do:

```
npm i subleveldown -S
```

## Contributing

[`Level/subleveldown`](https://github.com/Level/subleveldown) is an **OPEN Open Source Project**. This means that:

> Individuals making significant and valuable contributions are given commit-access to the project to contribute as they see fit. This project is more like an open wiki than a standard guarded open source project.

See the [Contribution Guide](https://github.com/Level/community/blob/master/CONTRIBUTING.md) for more details.

## Donate

Support us with a monthly donation on [Open Collective](https://opencollective.com/level) and help us continue our work.

## License

[MIT](LICENSE)

[level-badge]: https://leveljs.org/img/badge.svg

[levelup]: https://github.com/Level/levelup

[encoding-down]: https://github.com/Level/encoding-down

[abstract-leveldown]: https://github.com/Level/abstract-leveldown

[level-sublevel]: https://github.com/dominictarr/level-sublevel

[level-org]: https://github.com/Level
