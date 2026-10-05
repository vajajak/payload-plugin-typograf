import { describe, expect, it } from 'vitest'

import { isLexicalEditorState, typografLexical } from './typografLexical.js'
import type { LexicalEditorState, LexicalNode } from './types.js'

const NBSP = '\u00a0'
const BOLD = 1
const INLINE_CODE = 16

const createText = (text: string, format = 0): LexicalNode => ({
  type: 'text',
  text,
  format,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
})

const createElement = (type: string, children: LexicalNode[]): LexicalNode => ({
  type,
  children,
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

const createState = (...children: LexicalNode[]): LexicalEditorState => ({
  root: createElement('root', children),
})

describe('typografLexical', () => {
  it('transforms text nodes in nested elements', () => {
    const state = createState(
      createElement('paragraph', [createText('Jdu s námi')]),
      createElement('list', [createElement('listitem', [createText('a k vám')])]),
    )

    expect(typografLexical(state)).toEqual(
      createState(
        createElement('paragraph', [createText(`Jdu s${NBSP}námi`)]),
        createElement('list', [createElement('listitem', [createText(`a${NBSP}k${NBSP}vám`)])]),
      ),
    )
  })

  it('handles a short word at the end of a node followed by a formatted node', () => {
    const state = createState(createElement('paragraph', [createText('Jdu s '), createText('námi', BOLD)]))

    expect(typografLexical(state)).toEqual(
      createState(createElement('paragraph', [createText(`Jdu s${NBSP}`), createText('námi', BOLD)])),
    )
  })

  it('transforms link children and keeps link fields', () => {
    const link = { ...createElement('link', [createText('k vám')]), fields: { url: 'https://example.com/a b' } }
    const state = createState(createElement('paragraph', [link]))

    expect(typografLexical(state)).toEqual(
      createState(createElement('paragraph', [{ ...link, children: [createText(`k${NBSP}vám`)] }])),
    )
  })

  it('skips inline code text', () => {
    const state = createState(
      createElement('paragraph', [createText('s námi', INLINE_CODE), createText('s námi', INLINE_CODE | BOLD)]),
    )

    expect(typografLexical(state)).toEqual(state)
  })

  it('skips code blocks', () => {
    const state = createState(createElement('code', [{ type: 'code-highlight', text: 's námi', version: 1 }]))

    expect(typografLexical(state)).toEqual(state)
  })

  it('does not mutate the input', () => {
    const state = createState(createElement('paragraph', [createText('s námi')]))
    const snapshot = structuredClone(state)

    typografLexical(state)

    expect(state).toEqual(snapshot)
  })

  it('passes text options through', () => {
    const state = createState(createElement('paragraph', [createText('I saw a cat')]))

    expect(typografLexical(state, { locale: 'en-US' })).toEqual(
      createState(createElement('paragraph', [createText(`I${NBSP}saw a${NBSP}cat`)])),
    )
  })
})

describe('isLexicalEditorState', () => {
  it('recognises an editor state', () => {
    expect(isLexicalEditorState(createState())).toBe(true)
  })

  it.each([null, undefined, 'text', 42, [], {}, { root: null }, { root: 'x' }])('rejects %j', (value) => {
    expect(isLexicalEditorState(value)).toBe(false)
  })
})
