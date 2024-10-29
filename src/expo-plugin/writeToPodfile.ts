import fs from 'fs'
import path from 'path'

export function writeToPodfile(projectRoot: string, key: string, value: string): void {
  const podfilePath = path.join(projectRoot, 'ios', 'Podfile')
  // get Podfile content as individual lines
  let lines = fs.readFileSync(podfilePath, 'utf8').split('\n')
  // filter out any lines where the given key is already set
  lines = lines.filter((l) => !l.includes(key))
  // set the key as the first item in the array so its at the top of the file
  lines.unshift(`${key}=${value}`)

  // write the file back
  const fileContent = lines.join('\n')
  fs.writeFileSync(podfilePath, fileContent, 'utf8')
}
