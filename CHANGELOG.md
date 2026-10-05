# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-10-05

### Added

- `typografPlugin` that adds a `beforeChange` hook to `text`, `textarea` and `richText` fields of selected collections and globals, including fields nested in groups, arrays, rows, collapsibles, tabs and blocks.
- `typografText`, `typografLexical` and `createTypografFieldHook` utilities.
- Czech defaults: non-breaking space after single-letter words (`common/nbsp/afterShortWord`, `lengthShortWord: 1`).
- Per-field and per-container opt-out via `custom: { typograf: false }`.
- Locale mapping for localized fields via the `locales` option.

[Unreleased]: https://github.com/vajajak/payload-plugin-typograf/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/vajajak/payload-plugin-typograf/releases/tag/v0.1.0
