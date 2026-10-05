import { DEFAULT_LOCALE } from './constants.js'
import { getTypograf } from './typograf.js'
import type { TypografTextOptions } from './types.js'

const getLineEnding = (text: string) => (text.includes('\r\n') ? 'CRLF' : 'LF')

export const typografText = (text: string, options: TypografTextOptions = {}): string =>
  getTypograf(options.locale ?? DEFAULT_LOCALE, options.rules).execute(text, { lineEnding: getLineEnding(text) })
