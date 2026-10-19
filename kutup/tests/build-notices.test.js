import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

test('build notification updates replace one tag silently and never regress after delayed delivery', async () => {
  const listeners=new Map(), shown=new Map(), history=[];
  const registration={
    getNotifications:async({tag})=>[...shown.values()].filter((n)=>n.tag===tag),
    showNotification:async(title,options)=>{
      assert.ok(!(options.silent&&options.vibrate),'Web Notification API forbids silent plus vibrate');
      const n={title,...options,close:()=>shown.delete(options.tag)};
      shown.set(options.tag,n);history.push(n);
    },
  };
  const self={navigator:{userAgent:'Android'},registration,clients:{matchAll:async()=>[]},addEventListener:(name,callback)=>listeners.set(name,callback),skipWaiting:()=>{}};
  runInNewContext(readFileSync(new URL('../public/sw.js',import.meta.url),'utf8'),{self,setTimeout,clearTimeout,Date,Promise,URL,Uint8Array,atob});
  const push=async(progress)=>{
    const work=[];
    listeners.get('push')({data:{json:()=>({title:`Stage ${progress}`,body:`Progress ${progress}`,tag:'relaxed-one',buildEnd:123456789,buildProgress:progress,quiet:progress<100,sticky:true})},waitUntil:(p)=>work.push(p)});
    await Promise.all(work);
  };
  await push(50);await push(75);await push(25);
  assert.equal(shown.size,1);
  assert.equal(history.at(-1).data.buildProgress,75);
  assert.equal(history.at(-1).title,'Stage 75');
  assert.equal(history.at(-1).silent,true);
  assert.equal(history.at(-1).renotify,false);
  await push(100);await push(50);
  assert.equal(shown.size,1);
  assert.equal(history.at(-1).data.buildProgress,100);
  assert.equal(history.at(-1).title,'Stage 100');
  assert.equal(history.at(-1).silent,true,'a delayed milestone does not buzz after completion');
});
