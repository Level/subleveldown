# Upgrade Guide

This document describes breaking changes and how to upgrade. For a complete list of changes including minor and patch releases, please refer to the [changelog](CHANGELOG.md).

## v5

### Fixes iterating buffer keys that contain bytes 196-255 ([#88](https://github.com/level/subleveldown/issues/88))

Previously (in any version) keys containing bytes 196-255 were wrongly excluded by the range logic of `subleveldown`. The fix is not breaking for most folks.

It's breaking if you:

- Use the default separator and prefixes that contain `"` (byte 34)
- Use a custom separator that doesn't sort 2 positions before characters used in your prefixes. For example with separator `/` (byte 47) prefixes must use characters greater than `0` (byte 48).

In either case, an error will be thrown from the constructor.

### Parent database must support deferredOpen ([#89](https://github.com/level/subleveldown/issues/89))

By parent we mean:

```js
var parent = require('level')('db')
var sublevel = require('subleveldown')(parent, 'a')
```

By [deferredOpen](https://github.com/Level/supports#deferredopen-boolean) we mean that the db opens itself and defers operations until it's open. Currently that's only supported by [`levelup`](https://github.com/Level/levelup) (and [`levelup`](https://github.com/Level/levelup) factories like [`level`](https://github.com/Level/level)). Previously, `subleveldown` would also accept [`abstract-leveldown`](https://github.com/Level/abstract-leveldown) db's that were not wrapped in [`levelup`](https://github.com/Level/levelup).

### Better isolation

Opening and closing a sublevel no longer opens or closes the parent db. The sublevel does wait for the parent to open (which in the case of [`levelup`](https://github.com/Level/levelup) already happens automatically) but never initiates
a state change on the parent.

If one closes the parent but not the sublevel, subsequent operations on the sublevel (like `get` and `put`) will yield an error, to prevent segmentation faults from underlying stores.

### Drops support of old modules

- [`memdb`](https://github.com/juliangruber/memdb) (use [`level-mem`](https://github.com/Level/mem) instead)
- [`deferred-leveldown`](https://github.com/Level/deferred-leveldown) &lt; 2.0.0 (and thus [`levelup`](https://github.com/Level/levelup) &lt; 2.0.0)
- [`abstract-leveldown`](https://github.com/Level/abstract-leveldown) &lt; 2.4.0

### Rejects new sublevels on a closing or closed database

```js
db.close(function (err) {
  subdb(db, 'example').on('error', function (err) {
    throw err // Error: Parent database is not open
  })
})
```

```js
subdb(db, 'example').on('error', function (err) {
  throw err // Error: Parent database is not open
})

db.close(function () {})
```

## v4

Upgraded to `abstract-leveldown@6`, `encoding-down@6` and `levelup@4`. We recommend to pair `subleveldown@4` with `level` >= 5 or when using a custom store, one that is based on `abstract-leveldown` >= 6. For details please see:

- [`abstract-leveldown/UPGRADING.md`](https://github.com/Level/abstract-leveldown/blob/master/UPGRADING.md)
- [`levelup/UPGRADING.md`](https://github.com/Level/levelup/blob/master/UPGRADING.md)

A quick summary: range options are now serialized the same as keys, `db.iterator({ gt: undefined })` is not the same as `db.iterator({})`, nullish values are now rejected and streams are backed by [`readable-stream@3`](https://github.com/nodejs/readable-stream#version-3xx).

## v3

Dropped support for node 4.

The following methods were removed due to upgrading to `abstract-leveldown@^5.0.0`:

- `SubDown#approximateSize`
- `SubDown#getProperty`

If your code relies on these methods they only make sense if the underlying store is something that supports them, e.g. `leveldown` or `rocksdb`. If this is true you should invoke these methods on the underlying store instead.

The following methods were removed for two reasons; a) they should not be instance methods and b) they are related to `leveldown` specifics rather than `abstract-leveldown`:

- `SubDown#destroy`
- `SubDown#repair`

The following method was removed due to upgrading to `levelup@^3.0.1`:

- `SubDown#setDb`

Related to internals and should not affect you.
