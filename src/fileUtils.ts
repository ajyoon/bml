import fs from 'fs';


export function readFile(path: string): string {
  if (!fs.existsSync(path)) {
    throw new Error()
  }
  return '' + fs.readFileSync(path);
}

export function readStdin(): string {
  return fs.readFileSync(0, 'utf8'); // STDIN_FILENO = 0
}

