import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('active application surfaces use the BasketFlow AI brand', async () => {
  const [logo, layout, login, sidebar, shell, styles, readme, agents] = await Promise.all([
    read('components/brand/basketflow-logo.tsx'),
    read('app/layout.tsx'),
    read('app/login/page.tsx'),
    read('components/layout/sidebar.tsx'),
    read('components/layout/app-shell.tsx'),
    read('app/globals.css'),
    read('README.md'),
    read('AGENTS.md'),
  ]);

  const activeBrandFiles = [logo, layout, login, sidebar, shell, styles, readme, agents].join('\n');

  assert.match(logo, /BASKETFLOW_NAME = 'BasketFlow AI'/);
  assert.match(logo, /จัดการงานปักตะกร้าแบบครบขั้นตอน/);
  assert.match(login, /เข้าสู่ระบบ BasketFlow AI/);
  assert.match(styles, /--basketflow-cyan:#06B6D4/);
  assert.match(styles, /--basketflow-pink:#EC4899/);
  assert.doesNotMatch(activeBrandFiles, /BasketPilot AI/);
  assert.doesNotMatch(activeBrandFiles, /BASKETPILOT_/);
  assert.doesNotMatch(activeBrandFiles, /basketpilot-logo/);
});
