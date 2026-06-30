import assert from 'node:assert/strict';
import test from 'node:test';
import { ruleBasedCompliance } from '../lib/validators/compliance.ts';
import { THAI_AFFILIATE_DISCLOSURE } from '../lib/ai/constants.ts';
import { looksLikeShopeeLink } from '../lib/validators/product.ts';
import { canMoveToReadyToPublish } from '../lib/validators/publishing.ts';

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

test('safe disclosed script passes', () => {
  assert.equal(ruleBasedCompliance({ text:`รีวิวตามข้อมูลจริง ${THAI_AFFILIATE_DISCLOSURE}` }).status, 'PASS');
});

test('missing AI label produces a warning when AI media exists', () => {
  const result=ruleBasedCompliance({text:`รีวิวตามข้อมูลจริง ${THAI_AFFILIATE_DISCLOSURE}`,usesAiMedia:true,hasAiContentLabel:false});
  assert.equal(result.status,'WARNING');
  assert.ok(result.missing_requirements.includes('missing_ai_content_label'));
});
