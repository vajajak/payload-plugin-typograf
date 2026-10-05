import type { CollectionConfig, GlobalConfig } from 'payload'
import { describe, expect, it } from 'vitest'

import { typografPlugin } from './typografPlugin.js'

declare module 'payload' {
  export interface GeneratedTypes {
    collections: { posts: { id: string } }
    globals: { home: { id: string } }
  }
}

describe('typografPlugin with generated Payload types', () => {
  it('accepts slugs read from collection and global configs', () => {
    const posts: CollectionConfig = { slug: 'posts', fields: [] }
    const home: GlobalConfig = { slug: 'home', fields: [] }

    expect(typografPlugin({ collections: [posts.slug], globals: [home.slug] })).toBeTypeOf('function')
  })
})
