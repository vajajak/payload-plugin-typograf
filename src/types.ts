import type { CollectionSlug, GlobalSlug } from 'payload'

export type TypografRuleOptions = {
  enableRule?: string | string[]
  disableRule?: string | string[]
  settings?: Record<string, Record<string, unknown>>
}

export type TypografTextOptions = {
  locale?: string
  rules?: TypografRuleOptions
}

export type TypografFieldHookOptions = {
  locale?: string
  locales?: Record<string, string>
  rules?: TypografRuleOptions
  isLocalized?: boolean
}

type LooseSlug<T extends string> = T | (string & Record<never, never>)

export type TypografPluginOptions = {
  collections?: LooseSlug<CollectionSlug>[]
  globals?: LooseSlug<GlobalSlug>[]
  locale?: string
  locales?: Record<string, string>
  rules?: TypografRuleOptions
  disabled?: boolean
}

export type LexicalNode = {
  type: string
  children?: LexicalNode[]
  text?: string
  format?: number | string
  [key: string]: unknown
}

export type LexicalEditorState = {
  root: LexicalNode
  [key: string]: unknown
}
