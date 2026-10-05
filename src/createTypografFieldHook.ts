import type { FieldHook, TypeWithID } from 'payload'

import { DEFAULT_LOCALE, DEFAULT_LOCALES, PLUGIN_NAME } from './constants.js'
import { isLexicalEditorState, typografLexical } from './typografLexical.js'
import { typografText } from './typografText.js'
import type { TypografFieldHookOptions, TypografTextOptions } from './types.js'

type ResolveTypografLocaleArgs = {
  isLocalized: boolean
  requestLocale: string | undefined
  options: TypografFieldHookOptions
}

const resolveTypografLocale = ({ isLocalized, requestLocale, options }: ResolveTypografLocaleArgs) => {
  if (!isLocalized) {
    return options.locale ?? DEFAULT_LOCALE
  }

  if (!requestLocale || requestLocale === 'all') {
    return undefined
  }

  return (options.locales ?? DEFAULT_LOCALES)[requestLocale]
}

const transformValue = (value: unknown, options: TypografTextOptions): unknown => {
  if (typeof value === 'string') {
    return typografText(value, options)
  }

  if (Array.isArray(value)) {
    return value.map((item: unknown) => (typeof item === 'string' ? typografText(item, options) : item))
  }

  if (isLexicalEditorState(value)) {
    return typografLexical(value, options)
  }

  return value
}

export const createTypografFieldHook =
  (options: TypografFieldHookOptions = {}): FieldHook<TypeWithID, unknown, unknown> =>
  ({ value, req, field }) => {
    const isLocalized = Boolean(req.payload.config.localization) && (options.isLocalized === true || field.localized === true)
    const locale = resolveTypografLocale({ isLocalized, requestLocale: req.locale ?? undefined, options })

    if (!locale) {
      return value
    }

    try {
      return transformValue(value, { locale, rules: options.rules })
    } catch (error) {
      req.payload.logger.warn({ err: error }, `[${PLUGIN_NAME}] Skipped field "${field.name}"`)
      return value
    }
  }
