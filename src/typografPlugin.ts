import type { Block, CollectionConfig, Config, Field, GlobalConfig, Tab, TextField } from 'payload'

import { DEFAULT_LOCALE, DEFAULT_LOCALES, PLUGIN_NAME } from './constants.js'
import { createTypografFieldHook } from './createTypografFieldHook.js'
import { isSupportedTypografLocale } from './typograf.js'
import type { TypografFieldHookOptions, TypografPluginOptions } from './types.js'

type TransformContext = {
  hookOptions: TypografFieldHookOptions
  hasLocalizedAncestor: boolean
}

type FieldHooks = NonNullable<TextField['hooks']>

const isLocalizedContainer = (container: object) => 'localized' in container && container.localized === true

const isOptedOut = (field: Field) => 'custom' in field && field.custom?.typograf === false

const withLocalizedAncestor = (context: TransformContext, container: object): TransformContext => ({
  ...context,
  hasLocalizedAncestor: context.hasLocalizedAncestor || isLocalizedContainer(container),
})

const appendTypografHook = (hooks: FieldHooks | undefined, context: TransformContext): FieldHooks => ({
  ...hooks,
  beforeChange: [
    ...(hooks?.beforeChange ?? []),
    createTypografFieldHook({ ...context.hookOptions, isLocalized: context.hasLocalizedAncestor }),
  ],
})

const transformTab = (tab: Tab, context: TransformContext): Tab => ({
  ...tab,
  fields: transformFields(tab.fields, withLocalizedAncestor(context, tab)),
})

const transformBlock = (block: Block, context: TransformContext): Block => ({
  ...block,
  fields: transformFields(block.fields, context),
})

const transformField = (field: Field, context: TransformContext): Field => {
  if (isOptedOut(field)) {
    return field
  }

  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'richText':
      return { ...field, hooks: appendTypografHook(field.hooks, context) }
    case 'group':
    case 'array':
      return { ...field, fields: transformFields(field.fields, withLocalizedAncestor(context, field)) }
    case 'row':
    case 'collapsible':
      return { ...field, fields: transformFields(field.fields, context) }
    case 'tabs':
      return { ...field, tabs: field.tabs.map((tab) => transformTab(tab, context)) }
    case 'blocks':
      return { ...field, blocks: field.blocks.map((block) => transformBlock(block, withLocalizedAncestor(context, field))) }
    default:
      return field
  }
}

const transformFields = (fields: Field[], context: TransformContext): Field[] =>
  fields.map((field) => transformField(field, context))

const assertSupportedLocales = (hookOptions: TypografFieldHookOptions) => {
  const locales = [hookOptions.locale ?? DEFAULT_LOCALE, ...Object.values(hookOptions.locales ?? DEFAULT_LOCALES)]
  const unsupported = locales.filter((locale) => !isSupportedTypografLocale(locale))
  if (unsupported.length > 0) {
    throw new Error(`[${PLUGIN_NAME}] Unsupported typograf locale(s): ${unsupported.join(', ')}`)
  }
}

const assertSlugsExist = (kind: 'collection' | 'global', slugs: string[], configs: { slug: string }[] = []) => {
  const existing = new Set(configs.map((config) => config.slug))
  const missing = slugs.filter((slug) => !existing.has(slug))
  if (missing.length > 0) {
    throw new Error(
      `[${PLUGIN_NAME}] Unknown ${kind} slug(s): ${missing.join(', ')}. If another plugin adds them, register ${PLUGIN_NAME} after it.`,
    )
  }
}

const transformEntity = <T extends CollectionConfig | GlobalConfig>(entity: T, slugs: Set<string>, context: TransformContext): T =>
  slugs.has(entity.slug) ? { ...entity, fields: transformFields(entity.fields, context) } : entity

export const typografPlugin =
  (options: TypografPluginOptions = {}) =>
  (config: Config): Config => {
    if (options.disabled) {
      return config
    }

    const collectionSlugs = options.collections ?? []
    const globalSlugs = options.globals ?? []
    const hookOptions: TypografFieldHookOptions = {
      locale: options.locale ?? DEFAULT_LOCALE,
      locales: options.locales ?? DEFAULT_LOCALES,
      rules: options.rules,
    }

    assertSupportedLocales(hookOptions)
    assertSlugsExist('collection', collectionSlugs, config.collections)
    assertSlugsExist('global', globalSlugs, config.globals)

    const context: TransformContext = { hookOptions, hasLocalizedAncestor: false }
    const collectionSlugSet = new Set<string>(collectionSlugs)
    const globalSlugSet = new Set<string>(globalSlugs)

    return {
      ...config,
      collections: config.collections?.map((collection) => transformEntity(collection, collectionSlugSet, context)),
      globals: config.globals?.map((global) => transformEntity(global, globalSlugSet, context)),
    }
  }
