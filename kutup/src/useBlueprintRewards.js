import {useCallback,useEffect,useRef,useState} from 'react';
import {api,get} from './api.js';
import {storage} from './ui.jsx';
// A dismissed reveal closes immediately, including offline. Its exact models
// are retried until the server records them; a later plan remains unseen.
export function useBlueprintRewards(memberId,signal){
  const [result,setResult]=useState({memberId:null,items:[]});
  const current=useRef(memberId),inFlight=useRef(null),queue=useRef([]),dismissed=useRef(new Set()),dirty=useRef(false),alive=useRef(false);
  current.current=memberId;
  const key=`kutup-blueprint-pending:${memberId}`;
  const flush=useCallback(async()=>{
    const sent=queue.current.slice(0,32);if(!memberId||!sent.length)return;
    await api('/blueprints/rewards/seen',{memberId,models:sent});
    if(current.current!==memberId)return;
    queue.current=queue.current.filter(id=>!sent.includes(id));storage.set(key,JSON.stringify(queue.current));
  },[memberId,key]);
  const load=useCallback(async()=>{
    if(!memberId||document.hidden)return;
    if(inFlight.current===memberId){dirty.current=true;return;}
    inFlight.current=memberId;
    try{
      await flush().catch(()=>{});
      const data=await get('/blueprints/rewards');
      // A GET started before acknowledgement can finish after its POST. Keep
      // dismissed models muted even once their pending retry has been cleared.
      if(current.current===memberId)setResult({memberId,items:data.items.filter(p=>!dismissed.current.has(p.model))});
    }catch{/* Normal sync will retry; this never blocks focus. */}
    finally{if(inFlight.current===memberId)inFlight.current=null;if(alive.current&&current.current===memberId&&dirty.current){dirty.current=false;queueMicrotask(load);}}
  },[memberId,flush]);
  useEffect(()=>{
    alive.current=true;dirty.current=false;
    try{const saved=JSON.parse(storage.get(key)||'[]');queue.current=Array.isArray(saved)?saved.filter(id=>typeof id==='string').slice(0,32):[];}catch{queue.current=[];}
    dismissed.current=new Set(queue.current);
    setResult({memberId,items:[]});load();
    const timer=setInterval(load,30000);window.addEventListener('online',load);document.addEventListener('visibilitychange',load);
    return()=>{alive.current=false;dirty.current=false;clearInterval(timer);window.removeEventListener('online',load);document.removeEventListener('visibilitychange',load);};
  },[memberId,key,load]);
  useEffect(()=>{load();},[signal,load]);
  const items=result.memberId===memberId?result.items:[];
  const acknowledge=()=>{
    for(const item of items)dismissed.current.add(item.model);
    queue.current=[...new Set([...queue.current,...items.map(p=>p.model)])];
    storage.set(key,JSON.stringify(queue.current));setResult({memberId,items:[]});flush().catch(()=>{});
  };
  return{items,acknowledge};
}
