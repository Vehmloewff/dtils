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

## Can I Contribute?

Hell yeah

```sh
# fork and clone repo
deno test . --watch
```
