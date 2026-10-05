# @vajajak/payload-plugin-typograf

A [Payload CMS](https://payloadcms.com) 3 plugin that inserts non-breaking spaces after single-letter words — Czech prepositions and conjunctions such as `k`, `s`, `v`, `z`, `o`, `u`, `a`, `i` — whenever a document is saved. Powered by [typograf](https://github.com/typograf/typograf).

`Jdu s námi k vám` → `Jdu s⍽námi k⍽vám` (`⍽` = U+00A0)

## Install

```bash
npm install @vajajak/payload-plugin-typograf
```

Requires `payload` `^3.0.0`. The package is ESM-only.

## Usage

```ts
import { buildConfig } from 'payload'
import typografPlugin from '@vajajak/payload-plugin-typograf'

export default buildConfig({
  // ...
  plugins: [
    typografPlugin({
      collections: ['posts'],
      globals: ['home'],
    }),
  ],
})
```

Every `text`, `textarea` and `richText` field of the listed collections and globals gets a `beforeChange` hook, including fields nested in groups, arrays, rows, collapsibles, tabs and blocks. Register the plugin after plugins that add fields you want processed (for example `@payloadcms/plugin-seo`).

## Options

| Option        | Default        | Description                                                                                   |
| ------------- | -------------- | --------------------------------------------------------------------------------------------- |
| `collections` | `[]`           | Collection slugs to process. Unknown slugs throw at startup.                                  |
| `globals`     | `[]`           | Global slugs to process. Unknown slugs throw at startup.                                      |
| `locale`      | `'cs'`         | typograf locale for non-localized fields, or when Payload localization is disabled.           |
| `locales`     | `{ cs: 'cs' }` | Payload locale → typograf locale for localized fields. Unmapped locales are left untouched.   |
| `rules`       | —              | `{ enableRule, disableRule, settings }` applied on top of the default rule set.               |
| `disabled`    | `false`        | Return the config unchanged.                                                                  |

The default rule set enables only `common/nbsp/afterShortWord` with `lengthShortWord: 1`. See the [typograf rules](https://github.com/typograf/typograf/blob/dev/docs/RULES.en-US.md) for everything you can enable.

```ts
typografPlugin({
  collections: ['posts'],
  locales: { cs: 'cs', en: 'en-US' },
  rules: {
    enableRule: 'common/punctuation/quote',
    settings: { 'common/nbsp/afterShortWord': { lengthShortWord: 2 } },
  },
})
```

## Opting out

```ts
{ name: 'slug', type: 'text', custom: { typograf: false } }
```

On a container field (`group`, `array`, `tabs`, …), a single tab or a block, the opt-out skips everything inside it.

## Slugs and search

Saved text contains U+00A0 instead of a regular space after short words. Payload's built-in `slugField()` only treats regular spaces as separators, so `Jdu s námi` would become `jdu-snmi`. Give `slugField` a slugify that splits on any whitespace (`\s` matches U+00A0):

```ts
import { slugField } from 'payload'

slugField({
  slugify: ({ valueToSlugify }) =>
    String(valueToSlugify ?? '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .toLowerCase(),
})
```

The same applies to `equals` / `contains` queries on processed fields: a query typed with regular spaces will not match the stored U+00A0, so run the query string through `typografText` first.

## Utilities

```ts
import { createTypografFieldHook, typografLexical, typografText } from '@vajajak/payload-plugin-typograf'

typografText('Jdu s námi')
typografLexical(editorState, { locale: 'cs' })

const field = {
  name: 'title',
  type: 'text',
  hooks: { beforeChange: [createTypografFieldHook()] },
}
```

## Existing content

The plugin runs on save only. Re-save documents, or run a migration that applies `typografText` / `typografLexical` to stored values.

## Limitations

- Blocks referenced via `blockReferences` (shared `config.blocks`) are not traversed.
- Fields inside Lexical's inline BlocksFeature are not processed.
- A word split mid-word across formatting nodes may not be recognised.

## License

MIT
