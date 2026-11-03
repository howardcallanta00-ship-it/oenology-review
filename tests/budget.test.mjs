import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir,stat,readFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
test('static assets stay within explicit route budgets',async()=>{
 let total=0,js=0,gzipJs=0;
 for(const name of await readdir('public')){
  const bytes=(await stat('public/'+name)).size;total+=bytes;
  if(name.endsWith('.js')){js+=bytes;gzipJs+=gzipSync(await readFile('public/'+name)).length;}
  if(name.endsWith('.css'))assert.ok(bytes<20*1024,'CSS budget: 20 KiB');
 }
 assert.ok(total<150*1024,'Total initial assets: 150 KiB');
 assert.ok(js<100*1024,'Raw JavaScript: 100 KiB');
 assert.ok(gzipJs<30*1024,'Gzipped JavaScript: 30 KiB');
});
