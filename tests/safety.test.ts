import assert from 'node:assert/strict';
import test from 'node:test';
import { ruleBasedCompliance } from '../lib/validators/compliance.ts';
import { THAI_AFFILIATE_DISCLOSURE } from '../lib/ai/constants.ts';
import { looksLikeShopeeLink } from '../lib/validators/product.ts';
import { canMoveToReadyToPublish, canMoveVersionToReadyToPublish } from '../lib/validators/publishing.ts';
import { mockScript } from '../lib/ai/script-generator.ts';

test('blocks dangerous Thai claims', () => {
  const result = ruleBasedCompliance({ text:'สินค้านี้ใช้แล้วหายขาด เห็นผลทันที ปลอดภัย 100%' });
  assert.equal(result.status, 'BLOCK');
});

test('accepts only exact Shopee hosts', () => {
  assert.equal(looksLikeShopeeLink('https://shopee.co.th/product/1'), true);
  assert.equal(looksLikeShopeeLink('https://shp.ee/abc'), true);
  assert.equal(looksLikeShopeeLink('https://shopee.co.th.evil.example/x'), false);
  assert.equal(looksLikeShopeeLink('https://shp.ee.evil.example/x'), false);
  assert.equal(looksLikeShopeeLink('https://s.shopee.co.th/x'), false);
  assert.equal(looksLikeShopeeLink('https://mall.shopee.co.th/x'), false);
  assert.equal(looksLikeShopeeLink('ftp://shopee.co.th/x'), false);
});

test('publishing gate requires every server-side condition', () => {
  const ready = { complianceStatus:'PASS', approvalStatus:'approved', hasAffiliateDisclosure:true, hasAiContentLabel:true } as const;
  assert.equal(canMoveToReadyToPublish(ready), true);
  assert.equal(canMoveToReadyToPublish({ ...ready, hasAiContentLabel:false }), false);
  assert.equal(canMoveToReadyToPublish({ ...ready, hasAffiliateDisclosure:false }), false);
  assert.equal(canMoveToReadyToPublish({ ...ready, approvalStatus:'rejected' }), false);
  assert.equal(canMoveToReadyToPublish({ ...ready, complianceStatus:'BLOCK' }), false);
});

test('version-bound publishing gate rejects stale or preliminary state', () => {
  const ready={
    complianceStatus:'PASS',approvalStatus:'approved',hasAffiliateDisclosure:true,hasAiContentLabel:true,
    compliancePhase:'final',archivedAt:null,pendingRequestCount:0,currentScriptId:'script-2',
    complianceId:'check-2',complianceScriptId:'script-2',currentMediaRevision:3,
    complianceMediaRevision:3,approvalScriptId:'script-2',approvalComplianceId:'check-2',approvalMediaRevision:3,
  } as const;
  assert.equal(canMoveVersionToReadyToPublish(ready),true);
  assert.equal(canMoveVersionToReadyToPublish({...ready,compliancePhase:'preliminary'}),false);
  assert.equal(canMoveVersionToReadyToPublish({...ready,approvalScriptId:'script-1'}),false);
  assert.equal(canMoveVersionToReadyToPublish({...ready,approvalComplianceId:'check-1'}),false);
  assert.equal(canMoveVersionToReadyToPublish({...ready,complianceMediaRevision:2}),false);
  assert.equal(canMoveVersionToReadyToPublish({...ready,pendingRequestCount:1}),false);
  assert.equal(canMoveVersionToReadyToPublish({...ready,archivedAt:'2026-07-03T00:00:00Z'}),false);
});

test('safe disclosed script passes', () => {
  assert.equal(ruleBasedCompliance({ text:`รีวิวตามข้อมูลจริง ${THAI_AFFILIATE_DISCLOSURE}` }).status, 'PASS');
});

test('missing AI label produces a warning when AI media exists', () => {
  const result=ruleBasedCompliance({text:`รีวิวตามข้อมูลจริง ${THAI_AFFILIATE_DISCLOSURE}`,usesAiMedia:true,hasAiContentLabel:false});
  assert.equal(result.status,'WARNING');
  assert.ok(result.missing_requirements.includes('missing_ai_content_label'));
});

test('mock script includes hook candidates and selected hook',()=>{
  const script=mockScript({title:'แก้วทดสอบ',duration:30});
  assert.ok(script.hook_candidates.length>=3);
  assert.equal(script.selected_hook,script.hook);
  assert.ok(script.full_script.includes(THAI_AFFILIATE_DISCLOSURE));
});
