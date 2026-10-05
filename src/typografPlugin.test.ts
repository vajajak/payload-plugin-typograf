import type { Config, FieldHook, FieldHookArgs, TypeWithID } from 'payload'
import { describe, expect, it } from 'vitest'

import { typografPlugin } from './typografPlugin.js'

const NBSP = '\u00a0'

type LooseField = {
  name?: string
  type: string
  fields?: LooseField[]
  tabs?: { fields: LooseField[] }[]
  blocks?: { fields: LooseField[] }[]
  hooks?: { beforeChange?: FieldHook<TypeWithID, unknown, unknown>[] }
}

const createConfig = (config: Pick<Config, 'collections' | 'globals' | 'localization'>): Config => config as Config

const findField = (fields: LooseField[], name: string): LooseField | undefined => {
  for (const field of fields) {
    if (field.name === name) {
      return field
    }
    const children = [
      ...(field.fields ?? []),
      ...(field.tabs ?? []).flatMap((tab) => tab.fields),
      ...(field.blocks ?? []).flatMap((block) => block.fields),
    ]
    const match = findField(children, name)
    if (match) {
      return match
    }
  }
  return undefined
}

const getCollectionFields = (config: Config, slug: string) =>
  (config.collections?.find((collection) => collection.slug === slug)?.fields ?? []) as unknown as LooseField[]

const getBeforeChangeHooks = (config: Config, slug: string, fieldName: string) =>
  findField(getCollectionFields(config, slug), fieldName)?.hooks?.beforeChange ?? []

const runTypografHook = (config: Config, fieldName: string, value: string, locale: string): Promise<unknown> => {
  const hook = getBeforeChangeHooks(config, 'posts', fieldName).at(-1)
  if (!hook) {
    throw new Error(`No beforeChange hook on "${fieldName}"`)
  }
  const args = {
    value,
    field: { name: fieldName, type: 'text' },
    req: { locale, payload: { config: { localization: { defaultLocale: 'cs', locales: [] } }, logger: { warn: () => {} } } },
  } as unknown as FieldHookArgs<TypeWithID, unknown, unknown>
  return Promise.resolve(hook(args))
}

const postsConfig = () =>
  createConfig({
    collections: [
      {
        slug: 'posts',
        fields: [
          { name: 'title', type: 'text' },
          { name: 'perex', type: 'textarea' },
          { name: 'content', type: 'richText' },
          { name: 'views', type: 'number' },
          { name: 'group', type: 'group', fields: [{ name: 'groupText', type: 'text' }] },
          { name: 'items', type: 'array', fields: [{ name: 'arrayText', type: 'text' }] },
          { type: 'row', fields: [{ name: 'rowText', type: 'text' }] },
          { type: 'collapsible', label: 'More', fields: [{ name: 'collapsibleText', type: 'text' }] },
          {
            type: 'tabs',
            tabs: [
              { label: 'Unnamed', fields: [{ name: 'unnamedTabText', type: 'text' }] },
              { name: 'namedTab', fields: [{ name: 'namedTabText', type: 'text' }] },
              { label: 'Skipped', custom: { typograf: false }, fields: [{ name: 'skippedTabText', type: 'text' }] },
            ],
          },
          {
            name: 'layout',
            type: 'blocks',
            blocks: [
              { slug: 'hero', fields: [{ name: 'blockText', type: 'text' }] },
              { slug: 'skipped', custom: { typograf: false }, fields: [{ name: 'skippedBlockText', type: 'text' }] },
            ],
          },
          { name: 'slug', type: 'text', custom: { typograf: false } },
          {
            name: 'skippedGroup',
            type: 'group',
            custom: { typograf: false },
            fields: [{ name: 'skippedGroupText', type: 'text' }],
          },
          { name: 'localizedItems', type: 'array', localized: true, fields: [{ name: 'localizedArrayText', type: 'text' }] },
        ],
      },
      { slug: 'authors', fields: [{ name: 'name', type: 'text' }] },
    ],
    globals: [{ slug: 'home', fields: [{ name: 'headline', type: 'text' }] }],
    localization: { defaultLocale: 'cs', locales: ['cs', 'en'] },
  })

describe('typografPlugin', () => {
  it.each([
    'title',
    'perex',
    'content',
    'groupText',
    'arrayText',
    'rowText',
    'collapsibleText',
    'unnamedTabText',
    'namedTabText',
    'blockText',
    'localizedArrayText',
  ])('adds a beforeChange hook to "%s"', (fieldName) => {
    const config = typografPlugin({ collections: ['posts'] })(postsConfig())

    expect(getBeforeChangeHooks(config, 'posts', fieldName)).toHaveLength(1)
  })

  it.each(['views', 'slug', 'skippedGroupText', 'skippedTabText', 'skippedBlockText'])('does not add a hook to "%s"', (fieldName) => {
    const config = typografPlugin({ collections: ['posts'] })(postsConfig())

    expect(getBeforeChangeHooks(config, 'posts', fieldName)).toHaveLength(0)
  })

  it('appends to existing beforeChange hooks', () => {
    const existingHook: FieldHook<TypeWithID, unknown, unknown> = ({ value }) => value
    const config = createConfig({
      collections: [{ slug: 'posts', fields: [{ name: 'title', type: 'text', hooks: { beforeChange: [existingHook] } }] }],
    })

    const hooks = getBeforeChangeHooks(typografPlugin({ collections: ['posts'] })(config), 'posts', 'title')

    expect(hooks).toHaveLength(2)
    expect(hooks[0]).toBe(existingHook)
  })

  it('leaves untargeted collections untouched', () => {
    const original = postsConfig()

    const config = typografPlugin({ collections: ['posts'] })(original)

    expect(config.collections?.[1]).toBe(original.collections?.[1])
  })

  it('processes targeted globals', () => {
    const config = typografPlugin({ globals: ['home'] })(postsConfig())
    const fields = (config.globals?.[0]?.fields ?? []) as unknown as LooseField[]

    expect(findField(fields, 'headline')?.hooks?.beforeChange).toHaveLength(1)
  })

  it('does not mutate the incoming config', () => {
    const original = postsConfig()

    typografPlugin({ collections: ['posts'] })(original)

    expect(findField(getCollectionFields(original, 'posts'), 'title')?.hooks).toBeUndefined()
  })

  it('returns the config unchanged when disabled', () => {
    const original = postsConfig()

    expect(typografPlugin({ collections: ['posts'], disabled: true })(original)).toBe(original)
  })

  it('throws on unknown collection slugs', () => {
    expect(() => typografPlugin({ collections: ['missing'] })(postsConfig())).toThrow(
      'Unknown collection slug(s): missing',
    )
  })

  it('throws on unknown global slugs', () => {
    expect(() => typografPlugin({ globals: ['missing'] })(postsConfig())).toThrow('Unknown global slug(s): missing')
  })

  it('throws on unsupported typograf locales', () => {
    expect(() => typografPlugin({ collections: ['posts'], locales: { en: 'xx' } })(postsConfig())).toThrow(
      'Unsupported typograf locale(s): xx',
    )
  })

  describe('localized ancestors', () => {
    it('treats fields inside a localized array as localized', async () => {
      const config = typografPlugin({ collections: ['posts'] })(postsConfig())

      expect(await runTypografHook(config, 'localizedArrayText', 's námi', 'en')).toBe('s námi')
      expect(await runTypografHook(config, 'localizedArrayText', 's námi', 'cs')).toBe(`s${NBSP}námi`)
    })

    it('treats fields inside a non-localized group as non-localized', async () => {
      const config = typografPlugin({ collections: ['posts'] })(postsConfig())

      expect(await runTypografHook(config, 'groupText', 's námi', 'en')).toBe(`s${NBSP}námi`)
    })
  })
})
