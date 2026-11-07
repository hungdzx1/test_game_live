// Select files explicitly so Node's recursive test discovery cannot mix suites.
import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const suite=process.argv[2]??'core';
if(!['core','legacy','all'].includes(suite))throw new Error('Nhóm test phải là core, legacy hoặc all.');
const folders=suite==='all'?['test','test/legacy']:[suite==='legacy'?'test/legacy':'test'];
const files=folders.flatMap(folder=>readdirSync(path.join(root,folder),{withFileTypes:true})
  .filter(entry=>entry.isFile()&&entry.name.endsWith('.test.js'))
  .map(entry=>path.join(root,folder,entry.name))).sort();
if(!files.length)throw new Error(`Không tìm thấy test trong nhóm ${suite}.`);
console.log(`Test suite: ${suite} (${files.length} files)`);
const result=spawnSync(process.execPath,['--test',...process.argv.slice(3),...files],{cwd:root,stdio:'inherit',windowsHide:true});
if(result.error)throw result.error;
process.exitCode=result.status??1;
