import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('active application surfaces use the BasketFlow AI brand', async () => {
  const [
    logo,
    layout,
    login,
    sidebar,
    shell,
    loading,
    notFound,
    errorPage,
    icon,
    styles,
    readme,
    agents,
    packageJson,
    instrumentation,
    csvExport,
    supabaseConfig,
  ] = await Promise.all([
    read('components/brand/basketflow-logo.tsx'),
    read('app/layout.tsx'),
    read('app/login/page.tsx'),
    read('components/layout/sidebar.tsx'),
    read('components/layout/app-shell.tsx'),
    read('app/loading.tsx'),
    read('app/not-found.tsx'),
    read('app/error.tsx'),
    read('app/icon.svg'),
    read('app/globals.css'),
    read('README.md'),
    read('AGENTS.md'),
    read('package.json'),
    read('instrumentation-client.ts'),
    read('app/settings/ai-logs/export/route.ts'),
    read('supabase/config.toml'),
  ]);

  const activeBrandFiles = [
    logo,
    layout,
    login,
    sidebar,
    shell,
    loading,
    notFound,
    errorPage,
    icon,
    styles,
    readme,
    agents,
    packageJson,
    instrumentation,
    csvExport,
    supabaseConfig,
  ].join('\n');

  assert.match(logo, /BASKETFLOW_NAME = 'BasketFlow AI'/);
  assert.match(logo, /จัดการงานปักตะกร้าแบบครบขั้นตอน/);
  assert.match(login, /เข้าสู่ระบบ BasketFlow AI/);
  assert.match(styles, /--basketflow-cyan:#06B6D4/);
  assert.match(styles, /--basketflow-pink:#EC4899/);
  assert.match(packageJson, /"name": "basketflow-ai"/);
  assert.match(instrumentation, /service: 'basketflow-ai'/);
  assert.match(csvExport, /filename="basketflow-ai-logs\.csv"/);
  assert.match(supabaseConfig, /project_id = "basketflow-ai"/);
  assert.doesNotMatch(activeBrandFiles, /BasketPilot AI/);
  assert.doesNotMatch(activeBrandFiles, /BASKETPILOT_/);
  assert.doesNotMatch(activeBrandFiles, /basketpilot-logo/);
  assert.doesNotMatch(activeBrandFiles, /basketpilot-ai/);
});
