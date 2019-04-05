# Changelog

_**If you are upgrading:** please see [`UPGRADING.md`](UPGRADING.md)._

## [Unreleased][unreleased]

## [4.0.0] - 2019-04-05

### Changed

- Upgrade `abstract-leveldown` from `^5.0.0` to `^6.0.2` (#61) (@vweevers)
- Upgrade `encoding-down` from `^5.0.3` to `^6.0.1` (#61) (@vweevers)
- Upgrade `levelup` from `^3.0.1` to `^4.0.1` (#61) (@vweevers)
- Avoid unnecessary copy of batch operations (#61) (@vweevers)
- Invoke abstract tests from single function (#61) (@vweevers)
- Add mandatory `db` argument to abstract iterator (#61) (@vweevers)
- Upgrade `memdown` devDependency from `^3.0.0` to `^4.0.0` (#61) (@vweevers)
- Upgrade `nyc` devDependency from `^12.0.2` to `^13.3.0` (#61) (@vweevers)
- Upgrade `standard` devDependency from `^11.0.1` to `^12.0.1` (#61) (@vweevers)
- Apply common project tweaks (#58, #59) (@vweevers)

### Added

- Test that errors from `open()` and iterators bubble up (#61) (@vweevers)
- Test without a user-provided `levelup` layer (#61) (@vweevers)
- Gitignore `coverage` directory (#61) (@vweevers)

### Removed

- Remove obsolete `_batch()` checks (#61) (@vweevers)
- Remove dummy location from `abstract-leveldown` constructor call (#61) (@vweevers)

### Fixed

- Serialize non-buffer keys to strings (#61) (@vweevers)

## [3.0.1] - 2018-07-27

### Added

- Add `nyc` and `coveralls` ([**@ralphtheninja**](https://github.com/ralphtheninja))

### Removed

- Remove node 9 ([**@ralphtheninja**](https://github.com/ralphtheninja))

### Fixed

- Pass on `fillCache` option to `SubIterator` ([**@Nocory**](https://github.com/Nocory))

## [3.0.0] - 2018-06-07

### Added

- Test that iterator options are forwarded ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Test concatenating Buffer keys ([**@ralphtheninja**](https://github.com/ralphtheninja))

### Changed

- Call `cleanup()` cb synchronously ([**@ralphtheninja**](https://github.com/ralphtheninja))

### Removed

- Remove `makeExistingDbTest()` from `test/common.js` ([**@ralphtheninja**](https://github.com/ralphtheninja))

## [3.0.0-rc1] - 2018-06-03

### Changed

- Upgrade `levelup` from `^1.2.1` to `^3.0.1` ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Upgrade `abstract-leveldown` from `^2.4.1` to `^5.0.0` ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Upgrade `memdown` devDependency from `^1.1.0` to `^3.0.0` ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Upgrade `tape` devDependency from `^4.2.2` to `^4.9.0` ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Upgrade `standard` devDependency from `^5.3.1` to `^11.0.1` ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Update links in `package.json` ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Replace `util.inherits` with `inherits` module ([**@ralphtheninja**](https://github.com/ralphtheninja))
- `SubIterator` should inherit from `AbstractIterator` ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Use underscore methods to properly override ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Change `SubDown#type` from `subdown` to `subleveldown` ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Rewrite `SubDown#_open` to handle any inner \*downs ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Update sublevel specific tests to handle `levelup` + `encoding-down` ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Update README ([**@ralphtheninja**](https://github.com/ralphtheninja), [**@vweevers**](https://github.com/vweevers))

### Added

- Depend on `encoding-down` for encoding logic ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Add node 6, 8, 9 and 10 to Travis ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Test `SubDown` constructor ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Test main subdb ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Test encodings ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Test wrapping a closed `levelup` and re-opening it ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Test nested sublevels ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Add temporary `down()` and `isAbstract()` functions ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Add `UPGRADING.md` ([**@ralphtheninja**](https://github.com/ralphtheninja))

### Removed

- Remove node 0.12 from Travis ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Remove `SubDown#destroy` ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Remove `SubDown#repair` ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Remove `SubDown#setDb` ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Remove `SubDown#approximateSize` ([**@ralphtheninja**](https://github.com/ralphtheninja))
- Remove `SubDown#getProperty` ([**@ralphtheninja**](https://github.com/ralphtheninja))

### Fixed

- Fix deprecated `new Buffer()` ([**@ralphtheninja**](https://github.com/ralphtheninja))

## [2.1.0] - 2015-10-30

### Changed

- Use `standard` for linting ([**@mafintosh**](https://github.com/mafintosh))
- Upgrade `abstract-leveldown` from `^2.1.0` to `^2.4.1` ([**@mafintosh**](https://github.com/mafintosh))
- Upgrade `levelup` from `^0.19.0` to `^1.2.1` ([**@mafintosh**](https://github.com/mafintosh))
- Upgrade `memdown` devDependency from `^1.0.0` to `^1.1.1` ([**@mafintosh**](https://github.com/mafintosh))
- Upgrade `tape` devDependency from `^3.0.3` to `^4.2.2` ([**@mafintosh**](https://github.com/mafintosh))
- Add `opts` parameter to `SubDown` for custom open logic ([**@mafintosh**](https://github.com/mafintosh))
- Add `opts.open` open hook ([**@mafintosh**](https://github.com/mafintosh))

## [2.0.0] - 2015-02-04

### Changed

- Do not strip separator when nested for more transparent usage ([**@mafintosh**](https://github.com/mafintosh))

## [1.1.0] - 2015-01-28

### Changed

- Rename `subdown.js` to `leveldown.js` ([**@mafintosh**](https://github.com/mafintosh))

## [1.0.6] - 2015-01-06

### Fixed

- Fix binary end ([**@mafintosh**](https://github.com/mafintosh))

## [1.0.5] - 2015-01-06

### Fixed

- Fix iterator issue ([**@mafintosh**](https://github.com/mafintosh))

## [1.0.4] - 2014-12-31

### Changed

- Do not require prefix and forward separator ([**@mafintosh**](https://github.com/mafintosh))

## [1.0.3] - 2014-12-31

### Fixed

- Add missing `tape` dependency ([**@mafintosh**](https://github.com/mafintosh))

## [1.0.2] - 2014-12-31

### Changed

- Document api in README ([**@mafintosh**](https://github.com/mafintosh))
- Use `levelup` and `memdown` in `example.js` ([**@mafintosh**](https://github.com/mafintosh))
- Respect binary encoding in key prefixes ([**@mafintosh**](https://github.com/mafintosh))

### Added

- Add node 0.10 to Travis ([**@mafintosh**](https://github.com/mafintosh))
- Add `abstract-leveldown` test suite ([**@mafintosh**](https://github.com/mafintosh))

## [1.0.1] - 2014-12-29

### Fixed

- Forward all iterator options ([**@mafintosh**](https://github.com/mafintosh))

## 1.0.0 - 2014-12-23

:seedling: Initial release.

[unreleased]: https://github.com/level/subleveldown/compare/v4.0.0...HEAD

[4.0.0]: https://github.com/level/subleveldown/compare/v3.0.1...v4.0.0

[3.0.1]: https://github.com/level/subleveldown/compare/v3.0.0...v3.0.1

[3.0.0]: https://github.com/level/subleveldown/compare/v3.0.0-rc1...v3.0.0

[3.0.0-rc1]: https://github.com/level/subleveldown/compare/v2.1.0...v3.0.0-rc1

[2.1.0]: https://github.com/level/subleveldown/compare/v2.0.0...v2.1.0

[2.0.0]: https://github.com/level/subleveldown/compare/v1.1.0...v2.0.0

[1.1.0]: https://github.com/level/subleveldown/compare/v1.0.6...v1.1.0

[1.0.6]: https://github.com/level/subleveldown/compare/v1.0.5...v1.0.6

[1.0.5]: https://github.com/level/subleveldown/compare/v1.0.4...v1.0.5

[1.0.4]: https://github.com/level/subleveldown/compare/v1.0.3...v1.0.4

[1.0.3]: https://github.com/level/subleveldown/compare/v1.0.2...v1.0.3

[1.0.2]: https://github.com/level/subleveldown/compare/v1.0.1...v1.0.2

[1.0.1]: https://github.com/level/subleveldown/compare/v1.0.0...v1.0.1
