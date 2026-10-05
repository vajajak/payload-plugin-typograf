import { describe, expect, it } from 'vitest'

import typografPluginDefault, * as library from './index.js'

describe('package entry point', () => {
  it('exposes the plugin as the default export', () => {
    expect(typografPluginDefault).toBe(library.typografPlugin)
  })

  it('exposes the named runtime exports', () => {
    expect(Object.keys(library).sort()).toEqual([
      'createTypografFieldHook',
      'default',
      'typografLexical',
      'typografPlugin',
      'typografText',
    ])
  })
})
