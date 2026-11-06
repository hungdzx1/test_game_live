import {copyFile,constants} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
export async function preserveCorrupt(file){const backup=file+`.corrupt-${Date.now()}-${randomBytes(4).toString('hex')}.backup`;try{await copyFile(file,backup,constants.COPYFILE_EXCL);return backup;}catch{return null;}}
