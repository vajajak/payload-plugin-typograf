import { typografText } from './typografText.js'
import type { LexicalEditorState, LexicalNode, TypografTextOptions } from './types.js'

const INLINE_CODE_FORMAT = 16

const isInlineCode = (node: LexicalNode) => typeof node.format === 'number' && (node.format & INLINE_CODE_FORMAT) !== 0

const transformNode = (node: LexicalNode, options: TypografTextOptions): LexicalNode => {
  if (node.type === 'text' && typeof node.text === 'string' && !isInlineCode(node)) {
    return { ...node, text: typografText(node.text, options) }
  }

  if (Array.isArray(node.children)) {
    return { ...node, children: node.children.map((child) => transformNode(child, options)) }
  }

  return node
}

export const isLexicalEditorState = (value: unknown): value is LexicalEditorState =>
  typeof value === 'object' && value !== null && 'root' in value && typeof value.root === 'object' && value.root !== null

export const typografLexical = <T extends LexicalEditorState>(state: T, options: TypografTextOptions = {}): T => ({
  ...state,
  root: transformNode(state.root, options),
})
