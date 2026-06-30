import assert from 'node:assert/strict';
import test from 'node:test';
import { redactSensitiveText } from '../lib/observability/redact.ts';

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
