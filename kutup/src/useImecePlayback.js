import { useEffect, useRef, useState } from "react";
import { reducedMotion } from "./ui.jsx";

// Shared gate for presentation clocks AND the live canvas. Time spent hidden,
// below the fold or paused is never subtracted from someone's little film.
export function useImeceActivity(element) {
  const [state,setState]=useState({visible:false,motion:"still"});
  useEffect(()=>{
    let inView=false;
    const sync=()=>{
      const next={visible:inView&&!document.hidden,motion:reducedMotion()?"still":document.documentElement.dataset.motion||"full"};
      setState(old=>old.visible===next.visible&&old.motion===next.motion?old:next);
    };
    const io=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting&&entry.intersectionRatio>=.05;sync();},{threshold:.05});
    if(element.current)io.observe(element.current);
    const observer=new MutationObserver(sync);
    observer.observe(document.documentElement,{attributes:true,attributeFilter:["data-motion"]});
    const media=matchMedia("(prefers-reduced-motion: reduce)");
    media.addEventListener("change",sync);document.addEventListener("visibilitychange",sync);sync();
    return()=>{io.disconnect();observer.disconnect();media.removeEventListener("change",sync);document.removeEventListener("visibilitychange",sync);};
  },[element]);
  return state;
}

export function useImecePlayback(activity) {
  const [playback,setPlayback]=useState(null),[elapsed,setElapsed]=useState(0),[paused,setPaused]=useState(false);
  const clock=useRef(0),sequence=useRef(0);
  const duration=playback?.duration||0,done=!!playback&&elapsed>=duration;
  const start=next=>{
    clock.current=0;setElapsed(0);setPaused(false);
    setPlayback({...next,key:++sequence.current});
  };
  const finish=()=>{clock.current=duration;setElapsed(duration);};
  const clear=()=>{clock.current=0;setPlayback(null);setElapsed(0);setPaused(false);};
  useEffect(()=>{
    if(!playback||done)return;
    if(activity.motion==="still"){clock.current=duration;setElapsed(duration);return;}
    if(!activity.visible||paused)return;
    let frame,last=performance.now(),shown=last;
    const tick=now=>{
      clock.current=Math.min(duration,clock.current+now-last);last=now;
      if(now-shown>=160||clock.current>=duration){setElapsed(clock.current);shown=now;}
      if(clock.current<duration)frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(frame);
  },[playback?.key,done,duration,activity.visible,activity.motion,paused]);
  return {playback,elapsed,clock,paused,done,start,finish,clear,toggle:()=>setPaused(v=>!v)};
}
