import { describe, expect, it } from 'vitest'

import { typografText } from './typografText.js'

const NBSP = '\u00a0'

describe('typografText', () => {
  it('inserts a non-breaking space after single-letter words', () => {
    expect(typografText('Jdu s námi k vám')).toBe(`Jdu s${NBSP}námi k${NBSP}vám`)
  })

  it('handles consecutive single-letter words', () => {
    expect(typografText('a k vám')).toBe(`a${NBSP}k${NBSP}vám`)
  })

  it('handles uppercase single-letter words', () => {
    expect(typografText('V lednu')).toBe(`V${NBSP}lednu`)
  })

  it('leaves two-letter words untouched by default', () => {
    expect(typografText('jedeme do Prahy')).toBe('jedeme do Prahy')
  })

  it('leaves quotes untouched by default', () => {
    expect(typografText('"Ahoj" s námi')).toBe(`"Ahoj" s${NBSP}námi`)
  })

  it('keeps HTML tags and entities intact', () => {
    expect(typografText('<b>s námi</b> Tom &amp; Jerry')).toBe(`<b>s${NBSP}námi</b> Tom &amp; Jerry`)
  })

  it.each(['&nbsp;', '&copy;', '&mdash;', '&#160;', '&#60;b&#62;', '&#x3C;b&#x3E;', '&#128512;', '&#0;'])(
    'keeps the %s entity untouched',
    (entity) => {
      expect(typografText(`Napište ${entity} pro`)).toBe(`Napište ${entity} pro`)
    },
  )

  it('inserts non-breaking spaces around entities', () => {
    expect(typografText('a &nbsp;s námi')).toBe(`a${NBSP}&nbsp;s${NBSP}námi`)
  })

  it('preserves surrounding and repeated whitespace', () => {
    expect(typografText('  s  námi  ')).toBe(`  s${NBSP} námi  `)
  })

  it('is idempotent', () => {
    const once = typografText('V lednu jsme se s námi a k vám vydali')
    expect(typografText(once)).toBe(once)
  })

  it('preserves CRLF line endings', () => {
    expect(typografText('a\r\nk vám')).toBe(`a\r\nk${NBSP}vám`)
  })

  it('preserves LF line endings', () => {
    expect(typografText('a\nk vám')).toBe(`a\nk${NBSP}vám`)
  })

  it('returns an empty string unchanged', () => {
    expect(typografText('')).toBe('')
  })

  it('applies rule settings overrides', () => {
    const rules = { settings: { 'common/nbsp/afterShortWord': { lengthShortWord: 2 } } }
    expect(typografText('jedeme do Prahy', { rules })).toBe(`jedeme do${NBSP}Prahy`)
  })

  it('enables additional rules', () => {
    expect(typografText('"Ahoj" s námi', { rules: { enableRule: 'common/punctuation/quote' } })).toBe(
      `„Ahoj“ s${NBSP}námi`,
    )
  })

  it('disables rules', () => {
    expect(typografText('s námi', { rules: { disableRule: 'common/nbsp/afterShortWord' } })).toBe('s námi')
  })

  it('supports other typograf locales', () => {
    expect(typografText('I saw a cat', { locale: 'en-US' })).toBe(`I${NBSP}saw a${NBSP}cat`)
  })

  it('throws on an unsupported locale', () => {
    expect(() => typografText('s námi', { locale: 'xx' })).toThrow('Unsupported typograf locale "xx"')
  })
})
