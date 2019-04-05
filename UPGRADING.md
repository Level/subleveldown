# Upgrade Guide

This document describes breaking changes and how to upgrade. For a complete list of changes including minor and patch releases, please refer to the [changelog](CHANGELOG.md).

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
