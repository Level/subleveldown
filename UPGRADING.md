# Upgrade Guide

This document describes breaking changes and how to upgrade. For a complete list of changes including minor and patch releases, please refer to the [changelog](CHANGELOG.md).

## v3

Dropped support for node 4.

The following methods were removed due to upgrading to `abstract-leveldown@^5.0.0`:

* `SubDown#approximateSize`
* `SubDown#getProperty`

If your code relies on these methods they only make sense if the underlying store is something that supports them, e.g. `leveldown` or `rocksdb`. If this is true you should invoke these methods on the underlying store instead.

The following methods were removed for two reasons; a) they should not be instance methods and b) they are related to `leveldown` specifics rather than `abstract-leveldown`:

* `SubDown#destroy`
* `SubDown#repair`

The following method was removed due to upgrading to `levelup@^3.0.1`:

* `SubDown#setDb`

Related to internals and should not affect you.

