# CLI helpers

A small, opinionated library of helpers for creating CLI applications of all types in a declarative way.

## Principles

* CLIs are effectively one or more handler functions. This library aims to free the developer from the incidental labor of creating a CLI UX so they can concentrate on the work business logic of the handler functions.

* Library supports flexibility in terms of how your app is organized and can scale up to a large number of sub-commands but at it's heart this library is opinionated and errs on the side of providing a rich CLI UX without focusing on configurability or providing escape hatches.
