import type { FieldHookArgs, TypeWithID } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { createTypografFieldHook } from './createTypografFieldHook.js'

const NBSP = '\u00a0'

type Warn = (logObject: { err: unknown }, message: string) => void

type HookArgsOptions = {
  value: unknown
  locale?: string
  isLocalizationEnabled?: boolean
  isFieldLocalized?: boolean
  warn?: Warn
}

const createHookArgs = ({
  value,
  locale,
  isLocalizationEnabled = true,
  isFieldLocalized = false,
  warn = vi.fn<Warn>(),
}: HookArgsOptions) =>
  ({
    value,
    field: { name: 'title', type: 'text', localized: isFieldLocalized },
    req: {
      locale,
      payload: {
        config: { localization: isLocalizationEnabled ? { defaultLocale: 'cs', locales: [] } : false },
        logger: { warn },
      },
    },
  }) as unknown as FieldHookArgs<TypeWithID, unknown, unknown>

describe('createTypografFieldHook', () => {
  describe('locale resolution', () => {
    it('uses the default locale for non-localized fields regardless of the request locale', async () => {
      const hook = createTypografFieldHook()

      expect(await hook(createHookArgs({ value: 's námi', locale: 'en' }))).toBe(`s${NBSP}námi`)
    })

    it('maps the request locale for localized fields', async () => {
      const hook = createTypografFieldHook()

      expect(await hook(createHookArgs({ value: 's námi', locale: 'cs', isFieldLocalized: true }))).toBe(
        `s${NBSP}námi`,
      )
    })

    it('leaves localized fields in unmapped locales untouched', async () => {
      const hook = createTypografFieldHook()

      expect(await hook(createHookArgs({ value: 'I saw a cat', locale: 'en', isFieldLocalized: true }))).toBe(
        'I saw a cat',
      )
    })

    it('uses custom locale mappings', async () => {
      const hook = createTypografFieldHook({ locales: { en: 'en-US' } })

      expect(await hook(createHookArgs({ value: 'I saw a cat', locale: 'en', isFieldLocalized: true }))).toBe(
        `I${NBSP}saw a${NBSP}cat`,
      )
    })

    it('leaves localized fields untouched when the request locale is "all"', async () => {
      const hook = createTypografFieldHook()

      expect(await hook(createHookArgs({ value: 's námi', locale: 'all', isFieldLocalized: true }))).toBe('s námi')
    })

    it('leaves localized fields untouched when the request has no locale', async () => {
      const hook = createTypografFieldHook()

      expect(await hook(createHookArgs({ value: 's námi', isFieldLocalized: true }))).toBe('s námi')
    })

    it('treats fields with a localized ancestor as localized', async () => {
      const hook = createTypografFieldHook({ isLocalized: true })

      expect(await hook(createHookArgs({ value: 's námi', locale: 'en' }))).toBe('s námi')
    })

    it('treats localized fields as non-localized when Payload localization is disabled', async () => {
      const hook = createTypografFieldHook({ locale: 'cs' })

      expect(
        await hook(createHookArgs({ value: 's námi', isLocalizationEnabled: false, isFieldLocalized: true })),
      ).toBe(`s${NBSP}námi`)
    })
  })

  describe('value shapes', () => {
    it('transforms each string of a hasMany text field', async () => {
      const hook = createTypografFieldHook()

      expect(await hook(createHookArgs({ value: ['s námi', 42, 'k vám'] }))).toEqual([
        `s${NBSP}námi`,
        42,
        `k${NBSP}vám`,
      ])
    })

    it('transforms Lexical editor state', async () => {
      const hook = createTypografFieldHook()
      const value = { root: { type: 'root', children: [{ type: 'text', text: 's námi', format: 0 }] } }

      expect(await hook(createHookArgs({ value }))).toEqual({
        root: { type: 'root', children: [{ type: 'text', text: `s${NBSP}námi`, format: 0 }] },
      })
    })

    it.each([null, undefined, 42, true, { foo: 'bar' }])('returns %j unchanged', async (value) => {
      const hook = createTypografFieldHook()

      expect(await hook(createHookArgs({ value }))).toEqual(value)
    })
  })

  it('logs a warning and returns the original value when typograf fails', async () => {
    const warn = vi.fn<Warn>()
    const hook = createTypografFieldHook({ locale: 'xx' })

    expect(await hook(createHookArgs({ value: 's námi', warn }))).toBe('s námi')
    const [logObject, message] = warn.mock.calls[0] ?? []
    expect(logObject?.err).toBeInstanceOf(Error)
    expect(message).toContain('"title"')
  })
})
