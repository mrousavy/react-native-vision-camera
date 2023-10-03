import { useMemo } from 'react'
import { Code, CodeScanner, CodeType } from '../CodeScanner'

export function useCodeScanner(types: CodeType[], callback: (codes: Code[]) => void): CodeScanner {
  return useMemo(
    () => ({
      codeTypes: types,
      onCodeScanned: callback,
    }),
    [callback, types],
  )
}
