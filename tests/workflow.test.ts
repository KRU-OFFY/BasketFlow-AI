import assert from 'node:assert/strict';
import test from 'node:test';
import { actionFailure, actionSuccess } from '../lib/actions/state.ts';
import { projectStatusLabel } from '../lib/workflow/status.ts';
import { MockProductSourceProvider } from '../lib/products/providers/mock.ts';

test('translates every safety-relevant project status to Thai',()=>{
  assert.equal(projectStatusLabel('warning'),'ต้องแก้ไขคำเตือน');
  assert.equal(projectStatusLabel('blocked'),'ถูกบล็อก');
  assert.equal(projectStatusLabel('approved'),'อนุมัติแล้ว');
  assert.equal(projectStatusLabel('rejected'),'ถูกปฏิเสธ');
});

test('action state preserves request id and safe user message',()=>{
  assert.deepEqual(actionSuccess('สำเร็จ','request-1'),{ok:true,message:'สำเร็จ',requestId:'request-1'});
  assert.deepEqual(actionFailure(new Error('ลองใหม่'),'request-2'),{ok:false,message:'ลองใหม่',requestId:'request-2'});
});

test('mock product source returns deterministic non-scraped candidates',async()=>{
  const provider=new MockProductSourceProvider();
  const candidates=await provider.search({query:'แก้ว',limit:2});
  assert.equal(candidates.length,2);
  assert.equal(candidates.every(item=>item.source==='mock'),true);
  assert.equal(candidates.every(item=>new URL(item.productUrl).hostname==='shopee.co.th'),true);
});
