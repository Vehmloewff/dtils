# dtils

The best unofficial library of utilities for Deno applications.

> Note: This project strives to be the best utilities library for Deno. If you think there should be an addition, by all means, open an
> issue (and maybe a PR too??).

Includes utils for fs, http, encryption, jwt, sh, random, date, and much, much more.

[Documentation](https://deno.land/x/dtils/mod.ts)

## Unstable APIs

Some utilities are currently unstable. Minor updates may cause breaking changes. These utilities, in addition to the stable ones, can be
imported from `mod.unstable.ts`

## Known Issues

- Most of these functions were extracted from larger and properly functioning projects I have written. There is thus a notable lack of unit
  tests. Any contributions in this spectrum would be greatly appreciated.
- Module and doc comments need to be used more heavily

## Future Plans

- [x] (`sh`) add support for line-mapping stdout and stderr streams
- [ ] (`sh`) add functions to easily start a deno process
- [ ] Add a lot of testing utilities, such as `TestServer`
- [ ] Add JSON utils, such as the ability to parse something to unknown and then safely get it peicemeal
- [ ] Add cbor utils, with same json safety
- [ ] Add http client utilities
- [ ] Add number formatting utils, such as `formatLargeNumber`
- [ ] Resurrect `logger` as a `console` interceptor and throttle
- [ ] Add GIT functions that get the current branch, create a release, etc
- [ ] Add environment detection
- [ ] Add a modular bundler bundling code (maybe `jikno/rumble` without the html?)
- [ ] Add functions that deploy a project to Deno Deploy, EC2, etc.
- [ ] Add a process daemon that will keep processes running
- [ ] Add a functions to backup a particular application's storage
- [ ] Add functions to make downloading/unzipping files easier
- [ ] Add functions to run builtin deno lint, deno test, and deno bench
  - [x] test
  - [x] fmt
  - [x] lint
  - [ ] bench
  - [ ] Stabilize it all

## Can I Contribute?

Hell yeah

```sh
# fork and clone repo
deno test . --watch
```
