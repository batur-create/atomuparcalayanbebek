import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
const arg=(name,fallback)=>process.argv.includes(name)?process.argv[process.argv.indexOf(name)+1]:fallback;
const repo=path.resolve(arg('--repo',process.cwd()));
const outputFile=path.resolve(arg('--out','model-denetimi.json'));
const load=(file)=>import(pathToFileURL(path.join(repo,file)).href);
const {CATALOG,RARE,CLASSES}=await load('shared/catalog.js');
const {spec,projector,mirrored,buildingSVG,useSVG}=await load('src/iso.js');
const {specialOf}=await load('src/special.js');
const {sitePlan,siteSVG,phaseAt,workHeight}=await load('src/construction.js');
const {phaseInfo}=await load('src/stageInfo.js');
const {metraj}=await load('src/metraj.js');
const {modelSpec,MODEL_IDS,GEOMETRY_VERSION}=await load('shared/koy2/models.js');
const P=projector({cx:360,cy:400,s:30});
const issues=[],rows=[];
for(const item of CATALOG){
 const sp=spec(item.kind,7,item.id,{scale:1}),own=specialOf(sp),plan=sitePlan(sp),m=modelSpec(item.id);
 const missingInfo=plan.filter(p=>!phaseInfo(sp,p)).map(p=>p.key);
 if(missingInfo.length)issues.push({model:item.id,kind:'missing-info',keys:missingInfo});
 let last=0;
 for(const phase of plan){
  if(Math.abs(phase.a-last)>1e-8||!(phase.b>phase.a))issues.push({model:item.id,kind:'phase-gap',key:phase.key});
  last=phase.b;
  for(const q of [0.001,.5,.999]){
   const shown=phase.a+(phase.b-phase.a)*q;
   const out=siteSVG(P,sp,plan,shown)+(own?own.scene(P,sp,plan,shown,false):'');
   if(/NaN|undefined|Infinity/.test(out)||!Number.isFinite(workHeight(plan,sp,shown)))issues.push({model:item.id,kind:'invalid-stage',key:phase.key});
   const quant=metraj(sp,plan,shown);
   if(!Number.isFinite(quant.hakedis))issues.push({model:item.id,kind:'invalid-quantity',key:phase.key});
  }
 }
 if(Math.abs(last-1)>1e-8)issues.push({model:item.id,kind:'phase-end',last});
 for(const detail of [0,1,2])for(const lit of [false,true])for(const facing of [0,1]){
  useSVG(); const out=buildingSVG(facing?mirrored(P):P,sp,7,{detail,lit});
  if(/NaN|undefined|Infinity/.test(out)||!out)issues.push({model:item.id,kind:'invalid-final',detail,lit,facing});
 }
 rows.push({id:item.id,name:item.name,special:item.look?.special||null,minutes:CLASSES[item.class].minutes,rare:item.rare||false,system:own?.system||'generic',phaseCount:plan.length,phases:plan.map(p=>({key:p.key,label:p.label,from:+p.a.toFixed(4),to:+p.b.toFixed(4),info:!!phaseInfo(sp,p)})),context:m.context,scale:m.scale,height:m.height,ground:m.ground,entrances:m.entrances,hakedisStart:metraj(sp,plan,0).hakedis,hakedisEnd:metraj(sp,plan,1).hakedis});
}
const output={commit:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),catalogCount:CATALOG.length,modelContracts:MODEL_IDS.length,rareCount:RARE.length,specialCount:rows.filter(r=>r.special).length,geometryVersion:GEOMETRY_VERSION,issues,rows};
fs.writeFileSync(outputFile,JSON.stringify(output,null,2));
console.log(JSON.stringify({catalog:output.catalogCount,special:output.specialCount,rare:output.rareCount,issueCount:issues.length,issues:issues.slice(0,8)}));
