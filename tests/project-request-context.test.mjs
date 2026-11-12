import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText
const sharedPath = [
  new URL('../../../jetlinks-web-core/src/utils/application-scope.ts', import.meta.url),
  new URL('../../../../sass平台/cloud.jetlinks/runtime-ui/jetlinks-web-core/src/utils/application-scope.ts', import.meta.url),
].find(path => existsSync(path))
assert(sharedPath, 'Check out runtime-ui with jetlinks-web-core before running this contract test')
const shared = await readFile(sharedPath, 'utf8')
const projectModel = await readFile(new URL('../model/projects.ts', import.meta.url), 'utf8')
let source = compile(await readFile(new URL('../composables/useProjects.ts', import.meta.url), 'utf8'))
source = source.replaceAll("'vue'", JSON.stringify(moduleUrl('export const ref=value=>({value});export const shallowRef=ref;')))
source = source.replaceAll("'@jetlinks-web/core'", JSON.stringify(moduleUrl(`export const request={get:async (_url,_params,options)=> {
  globalThis.projectRequestHeaders=options?.headers;
  const scope=options?.headers?.['X-Asset-Scope'] || 'business_application:stale-host-app';
  return {success:true,result:scope==='business_application:patrol-app'?[{id:'project',name:'Project',organizationType:'project'}]:[]};
}}`)))
source = source.replaceAll("'@jetlinks-web-core/utils/application-scope'", JSON.stringify(moduleUrl(compile(shared))))
source = source.replaceAll("'../model/projects'", JSON.stringify(moduleUrl(compile(projectModel))))
const { useProjects } = await import(moduleUrl(source))

test('first application load uses explicit current entry even before host restores its app store', async () => {
  const storage = new Map()
  globalThis.window = {location:{pathname:'/patrol-app/',search:'',hash:'#/park/patrol/points?applicationScope=patrol-app'},
    sessionStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)}}
  const projects=useProjects()
  await projects.load()
  assert.deepEqual(projects.tree.value.map(node=>node.id),['project'])
  assert.equal(globalThis.projectRequestHeaders['X-Asset-Scope'],'business_application:patrol-app')
  // A same-entry reload retains its own scope without leaking another tab's host state.
  window.location.hash='#/park/patrol/points'
  await projects.load()
  assert.deepEqual(projects.tree.value.map(node=>node.id),['project'])
  window.location.pathname='/other-entry/'
  await projects.load()
  assert.equal(globalThis.projectRequestHeaders,undefined)
  assert.deepEqual(projects.tree.value,[])
  delete globalThis.window; delete globalThis.projectRequestHeaders
})
