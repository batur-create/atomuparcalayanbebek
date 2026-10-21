import React,{useEffect,useState} from 'react';
import {ScrollText,Check,Sparkles} from 'lucide-react';
import {Modal} from './Modal.jsx';
import {BuildingThumb} from './Economy.jsx';
import {Burst,reducedMotion} from './ui.jsx';
import {BY_ID,minutesOf} from '../shared/catalog.js';
import './blueprintReveal.css';
export function BlueprintReveal({items,close,onCatalog}){
  const [open,setOpen]=useState(false);
  // Handover, Kara, tours and other sheets finish first. Once opened, this
  // reveal keeps its place instead of seeing its own dialog as an obstruction.
  useEffect(()=>{if(open)return;const show=()=>{if(!document.querySelector('[role="dialog"],[role="alertdialog"]'))setOpen(true);};show();const timer=setInterval(show,300);return()=>clearInterval(timer);},[open]);
  if(!open)return null;
  const plans=items.map(p=>({...p,item:BY_ID[p.model]})).filter(p=>p.item);
  if(!plans.length)return null;
  const gift=plans.every(p=>p.source==='gift');
  return <Modal title={gift?'Batur’dan plan sürprizi!':plans.length===1?'Nadir bir plan keşfettin!':'Yeni planların var!'} subtitle="KARA’NIN PLAN POSTASI" close={close} className="blueprint-reveal">
    {!reducedMotion()&&document.documentElement.dataset.motion!=='still'&&<Burst/>}
    <div className="plan-reveal-stamp"><ScrollText size={19}/><b>{gift?'ÖZEL TESLİMAT':'NADİR KEŞİF'}</b><Sparkles size={18}/></div>
    <div className={`plan-reveal-gallery ${plans.length>1?'many':''}`}>{plans.map(({item})=><article key={item.id}>
      <div className="plan-reveal-art"><BuildingThumb id={item.id} size={plans.length>1?150:260}/></div>
      <h3>{item.name}</h3><p>{item.blurb}</p><small>{minutesOf(item)} dk inşaat · {item.cost} tuğla malzeme</small>
    </article>)}</div>
    <p className="plan-reveal-letter">Kara: “Bu çizim artık senin. Köyde henüz görmediğimiz bir siluet yükseltebilirsin.”</p>
    <p className="plan-reveal-owned"><Check size={18}/>Plan kalıcı açıldı; her inşaatta yeniden kullanılabilir.</p>
    <p className="plan-reveal-help">Plan tükenmez. Binayı yapmak için malzemesini ödeyip çalışma seansını tamamlaman gerekir.</p>
    <div className="plan-reveal-actions"><button type="button" className="btn primary full" onClick={onCatalog}>Planlarıma bak</button><button type="button" className="text-button" onClick={close}>Koleksiyonuma kaldır</button></div>
  </Modal>;
}
