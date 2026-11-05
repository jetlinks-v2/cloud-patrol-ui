import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const result = await build({
  entryPoints: [fileURLToPath(new URL('../composables/statistics/useStatisticsOverview.ts', import.meta.url))],
  bundle:true,write:false,platform:'node',format:'cjs',external:['vue'],
  plugins:[{name:'statistics-boundaries',setup(builder){
    builder.onResolve({filter:/api\/statistics$|useProjects$/},args=>({path:args.path,namespace:'mock'}))
    builder.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:args.path.endsWith('useProjects')
      ? 'export const selectedProject=()=>globalThis.__statistics.project;'
      : `export const queryStatistics=(...args)=>globalThis.__statistics.query(...args);
         export const queryStatisticsTasks=(...args)=>globalThis.__statistics.tasks(...args);
         export const queryStatisticsDetail=(...args)=>globalThis.__statistics.detail(...args);
         export const exportStatistics=(...args)=>globalThis.__statistics.export(...args);`}))
  }}],
})
const module={exports:{}}
new Function('require','module','exports',result.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports)
const {useStatisticsOverview}=module.exports
const tick=()=>new Promise(setImmediate)
const ok=result=>({success:true,result})

test('late responses cannot replace the active filter or reopen stale drill results',async()=>{
  const queries=[], drills=[]
  globalThis.__statistics={project:'p1', query:range=>new Promise(resolve=>queries.push({range,resolve})),
    tasks:()=>new Promise(resolve=>drills.push(resolve))}
  const s=useStatisticsOverview()
  s.range.value=['2026-11-01','2026-11-05']; await tick()
  queries[1].resolve(ok({total:{expected:2}}));await tick()
  queries[0].resolve(ok({total:{expected:99}}));await tick()
  assert.equal(s.report.value.total.expected,2)
  s.openDrill('overdue','p2');await tick()
  s.categoryIds.value=['category'];await tick()
  drills[0](ok({total:1,data:[{id:'stale'}]}));await tick()
  assert.equal(s.drillOpen.value,false);assert.equal(s.report.value,undefined)
  assert.deepEqual(s.drillRows.value,[])
})

test('drill preserves selected category/level and project/date narrowing; export uses report snapshot',async()=>{
  const calls=[]
  globalThis.__statistics={project:'p1',query:async()=>ok({total:{expected:1}}),
    tasks:async(...args)=>{calls.push(['tasks',...args]);return ok({total:0,data:[]})},
    detail:async(...args)=>{calls.push(['detail',...args]);return ok({periods:[],executions:[]})},
    export:async(...args)=>calls.push(['export',...args])}
  const s=useStatisticsOverview();s.categoryIds.value=['c'];s.levelIds.value=['l'];await tick()
  globalThis.__statistics.project='changed'
  await s.exportReport()
  assert.equal(calls[0][1].projectId,'p1')
  s.openDrill('absent','p2','2026-11-02');await tick()
  assert.deepEqual(calls[1].slice(2),['absent',0,20])
  assert.deepEqual(calls[1][1],{from:'2026-11-02',to:'2026-11-02',categoryIds:['c'],levelIds:['l'],projectId:'p2'})
  await s.openDetail({pointId:'point',projectId:'p2',date:'2026-11-02'})
  assert.equal(calls[2][2],'point');assert.equal(calls[2][1].projectId,'p2')
})

test('failed report clears previous totals and disables export',async()=>{
  let exports=0
  globalThis.__statistics={project:undefined,query:async()=>ok({total:{expected:5}}),export:async()=>exports++}
  const s=useStatisticsOverview();await tick()
  globalThis.__statistics.query=async()=>{throw new Error('unavailable')}
  await s.reload();await s.exportReport()
  assert.equal(s.failed.value,true);assert.equal(s.report.value,undefined);assert.equal(exports,0)
})
