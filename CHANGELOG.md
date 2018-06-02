# Changelog

## [Unreleased]

### Changed
* Upgrade `levelup` from `^1.2.1` to `^3.0.1` (@ralphtheninja)
* Upgrade `abstract-leveldown` from `^2.4.1` to `^5.0.0` (@ralphtheninja)
* Upgrade `memdown` devDependency from `^1.1.0` to `^3.0.0` (@ralphtheninja)
* Upgrade `tape` devDependency from `^4.2.2` to `^4.9.0` (@ralphtheninja)
* Upgrade `standard` devDependency from `^5.3.1` to `^11.0.1` (@ralphtheninja)
* Update links in `package.json` (@ralphtheninja)
* Replace `util.inherits` with `inherits` module (@ralphtheninja)
* `SubIterator` should inherit from `AbstractIterator` (@ralphtheninja)
* Use underscore methods to properly override (@ralphtheninja)
* Change `SubDown#type` from `subdown` to `subleveldown` (@ralphtheninja)
* Rewrite `SubDown#_open` to handle any inner \*downs (@ralphtheninja)
* Update sublevel specific tests to handle `levelup` + `encoding-down` (@ralphtheninja)
* Update README style with badges etc (@ralphtheninja)

### Added
* Depend on `encoding-down` for encoding logic (@ralphtheninja)
* Add node 6, 8, 9 and 10 to Travis (@ralphtheninja)
* Test `SubDown` constructor (@ralphtheninja)
* Test main subdb (@ralphtheninja)
* Test encodings (@ralphtheninja)
* Test wrapping a closed `levelup` and re-opening it (@ralphtheninja)
* Test nested sublevels (@ralphtheninja)
* Add temporary `down()` and `isAbstract()` functions (@ralphtheninja)

### Removed
* Remove node 0.12 from Travis (@ralphtheninja)
* Remove `SubDown#destroy` (@ralphtheninja)
* Remove `SubDown#repair` (@ralphtheninja)
* Remove `SubDown#setDb` (@ralphtheninja)
* Remove `SubDown#approximateSize` (@ralphtheninja)
* Remove `SubDown#getProperty` (@ralphtheninja)

### Fixed
* Fix deprecated `new Buffer()` (@ralphtheninja)

## [2.1.0] - 2015-10-30

### Changed
* Use `standard` for linting (@mafintosh)
* Upgrade `abstract-leveldown` from `^2.1.0` to `^2.4.1` (@mafintosh)
* Upgrade `levelup` from `^0.19.0` to `^1.2.1` (@mafintosh)
* Upgrade `memdown` devDependency from `^1.0.0` to `^1.1.1` (@mafintosh)
* Upgrade `tape` devDependency from `^3.0.3` to `^4.2.2` (@mafintosh)
* Add `opts` parameter to `SubDown` for custom open logic (@mafintosh)
* Add `opts.open` open hook (@mafintosh)

## [2.0.0] - 2015-02-04

### Changed
* Do not strip separator when nested for more transparent usage (@mafintosh)

## [1.1.0] - 2015-01-28

### Changed
* Rename `subdown.js` to `leveldown.js` (@mafintosh)

## [1.0.6] - 2015-01-06

### Fixed
* Fix binary end (@mafintosh)

## [1.0.5] - 2015-01-06

### Fixed
* Fix iterator issue (@mafintosh)

## [1.0.4] - 2014-12-31

### Changed
* Do not require prefix and forward separator (@mafintosh)

## [1.0.3] - 2014-12-31

### Fixed
* Add missing `tape` dependency (@mafintosh)

## [1.0.2] - 2014-12-31

### Changed
* Document api in README (@mafintosh)
* Use `levelup` and `memdown` in `example.js` (@mafintosh)
* Respect binary encoding in key prefixes (@mafintosh)

### Added
* Add node 0.10 to Travis (@mafintosh)
* Add `abstract-leveldown` test suite (@mafintosh)

## [1.0.1] - 2014-12-29

### Fixed
* Forward all iterator options (@mafintosh)

## 1.0.0 - 2014-12-23

:seedling: Initial release.

[Unreleased]: https://github.com/level/subleveldown/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/level/subleveldown/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/level/subleveldown/compare/v1.1.0...v2.0.0
[1.1.0]: https://github.com/level/subleveldown/compare/v1.0.6...v1.1.0
[1.0.6]: https://github.com/level/subleveldown/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/level/subleveldown/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/level/subleveldown/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/level/subleveldown/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/level/subleveldown/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/level/subleveldown/compare/v1.0.0...v1.0.1
