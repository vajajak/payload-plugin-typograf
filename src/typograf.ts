import TypografModule from 'typograf'

import { DEFAULT_LENGTH_SHORT_WORD, DEFAULT_RULE, PLUGIN_NAME } from './constants.js'
import type { TypografRuleOptions } from './types.js'

// NOTE: typograf ships a single CommonJS-typed .d.ts for both builds, so under NodeNext TypeScript sees the default import as the module namespace. At runtime the default export is the Typograf class.
const Typograf = TypografModule as unknown as typeof TypografModule.default

type TypografInstance = InstanceType<typeof Typograf>

const instances = new Map<string, TypografInstance>()

const toArray = (value: string | string[] | undefined): string[] => (value === undefined ? [] : [value].flat())

const applySettings = (typograf: TypografInstance, settings: TypografRuleOptions['settings'] = {}) => {
  Object.entries(settings).forEach(([ruleName, ruleSettings]) => {
    Object.entries(ruleSettings).forEach(([settingName, value]) => typograf.setSetting(ruleName, settingName, value))
  })
}

const createTypograf = (locale: string, rules: TypografRuleOptions): TypografInstance => {
  if (!isSupportedTypografLocale(locale)) {
    throw new Error(`[${PLUGIN_NAME}] Unsupported typograf locale "${locale}"`)
  }

  const typograf = new Typograf({
    locale: [locale],
    disableRule: '*',
    enableRule: [DEFAULT_RULE, ...toArray(rules.enableRule)],
  })
  typograf.setSetting(DEFAULT_RULE, 'lengthShortWord', DEFAULT_LENGTH_SHORT_WORD)
  typograf.disableRule(toArray(rules.disableRule))
  applySettings(typograf, rules.settings)

  return typograf
}

export const isSupportedTypografLocale = (locale: string): boolean => Typograf.hasLocale(locale)

export const getTypograf = (locale: string, rules: TypografRuleOptions = {}): TypografInstance => {
  const cacheKey = `${locale}:${JSON.stringify(rules)}`
  const cached = instances.get(cacheKey)
  if (cached) {
    return cached
  }

  const typograf = createTypograf(locale, rules)
  instances.set(cacheKey, typograf)
  return typograf
}
