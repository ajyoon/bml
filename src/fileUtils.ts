import fs from 'fs';


export function readStdin(): string {
  return fs.readFileSync(0, 'utf8'); // STDIN_FILENO = 0
}

