# Component skel

Jumpstart component development.

Use component skel to add a skeleton to work from right after beginning work
on your component. I made this because I got tired of copying my `test/`
directory from one component to the next, and copying the same `make` targets
over and over.

Currently you need to grap skeletons yourself and put them in `~/.component/skel`;
that might become automatic or somewhat managed in the future.

# Usage

    component skel [skel-name]

## Install skeletons in `~/.component/skel/`

# skel.json

## extends: [str, ...]

Names of skeletons this extends. They will be installed from left to right,
and then the current one.

## files: [glob, ...]

Files to copy over

## parse: [glob, ...]

Files in which to interpolate. Values within "{{{" and "}}}" will be
interpolated. Values which can be interpolated:

- fullName: namespace/name
- name
- namespace
- title: name made Title case

## make: bool

If true, add rules from provided `Makefile` to existing makefile. All `.PHONY`
from resulting file will be condensed. If false and there is a `Makefile`
provided, the existing one will be overwritten.

## dependencies: {name: version, ...}

Components to add

## development: {name: verson, ...}

Components to add `--dev`

## node

    {
        "dependencies": { "name": "version", ... },
        "devDependencies": { "name": "version", ... },
    }

