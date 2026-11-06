import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import {preserveCorrupt} from './adminDataBackup.js';
import {setTimeout as delay} from 'node:timers/promises';
export class JsonStore {
  pending = Promise.resolve();
  async read(file, fallback) {
    try { return JSON.parse(await readFile(file, 'utf8')); }
    catch (e) { if (e.code === 'ENOENT') return fallback;const backup=await preserveCorrupt(file);throw new Error(`Không đọc được ${file}. Giữ nguyên dữ liệu; hãy kiểm tra JSON hoặc khôi phục bản sao.${backup?' Đã sao lưu nguyên bản tại '+backup:''}`, { cause: e }); }
  }
  write(file, value) {
    const content = JSON.stringify(value, null, 2);
    const job = this.pending.then(async () => {
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file + '.tmp', content, 'utf8');
      for(let attempt=0;;attempt++)try{await rename(file+'.tmp',file);break;}catch(error){if(!['EPERM','EBUSY','EACCES'].includes(error.code)||attempt>=5)throw error;await delay(10*2**attempt);}
    });
    this.pending = job.catch(() => {});
    return job;
  }
}
