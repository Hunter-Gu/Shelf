declare module "text-fragments-polyfill/text-fragment-utils" {
  export type TextFragment = {
    textStart: string
    textEnd?: string
    prefix?: string
    suffix?: string
  }

  export function parseFragmentDirectives(input: { text: string[] }): {
    text: TextFragment[]
  }

  export function processTextFragmentDirective(
    fragment: TextFragment,
    documentToProcess?: Document,
    root?: Element
  ): Range[]
}
