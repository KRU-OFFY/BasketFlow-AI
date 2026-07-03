import assert from 'node:assert/strict';
import test from 'node:test';
import { redactSensitiveText } from '../lib/observability/redact.ts';
import { sanitizeAiPayload } from '../lib/ai/sanitize.ts';

test('redacts credentials, JWTs, and email addresses before Datadog transport', () => {
  const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature';
  const value = `password=hunter2 token: "secret-token" ${jwt} user@example.com`;
  const redacted = redactSensitiveText(value);

  assert.equal(redacted.includes('hunter2'), false);
  assert.equal(redacted.includes('secret-token'), false);
  assert.equal(redacted.includes(jwt), false);
  assert.equal(redacted.includes('user@example.com'), false);
  assert.match(redacted, /\[REDACTED\]/);
  assert.match(redacted, /\[REDACTED_JWT\]/);
  assert.match(redacted, /\[REDACTED_EMAIL\]/);
});

test('sanitizes sensitive AI log payload fields recursively',()=>{
  const sanitized=sanitizeAiPayload({email:'user@example.com',nested:{password:'hunter2',authorization:'Bearer secret'},text:'token=secret-token'}) as Record<string,unknown>;
  assert.equal(JSON.stringify(sanitized).includes('hunter2'),false);
  assert.equal(JSON.stringify(sanitized).includes('secret-token'),false);
  assert.equal(JSON.stringify(sanitized).includes('user@example.com'),false);
});
