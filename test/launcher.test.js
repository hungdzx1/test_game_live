import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
test('Windows launcher missing Node path gives Vietnamese instructions and exits', {skip:process.platform!=='win32'},()=>{
  const system=path.join(process.env.SystemRoot,'System32');
  const env={...process.env};for(const key of Object.keys(env))if(key.toLowerCase()==='path')delete env[key];env.Path=system;
  const result=spawnSync(path.join(system,'cmd.exe'),['/d','/c','.\\chay.bat'],{cwd:process.cwd(),env,input:'\r\n',encoding:'utf8',timeout:5000,windowsHide:true,windowsVerbatimArguments:true});
  assert.equal(result.status,1);assert.match(result.stdout,/nodejs.org/);assert.match(result.stdout,/Node.js LTS/);
});
