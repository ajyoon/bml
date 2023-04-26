import fs from 'fs';
import path from 'path';


export function readFile(filePath: string, workingDir: string | null): string {
  if (workingDir) {
    // Sanity check that the given working dir is a directory.
    // the stat call will also error if the directory is invalid
    if (!fs.lstatSync(workingDir).isDirectory()) {
      throw new Error()
    }
    filePath = path.join(workingDir, filePath);
  }
  if (!fs.existsSync(filePath)) {
    throw new Error()
  }
  return '' + fs.readFileSync(filePath);
}

export function readStdin(): string {
  return fs.readFileSync(0, 'utf8'); // STDIN_FILENO = 0
}

