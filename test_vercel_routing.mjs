import fs from 'fs';
import path from 'path';

console.log('=== VERCEL SPA ROUTING VERIFICATION ===');

const vercelConfigPaths = [
  path.resolve('./vercel.json'),
  path.resolve('./client/vercel.json'),
  path.resolve('./frontend/vercel.json')
];

let allPassed = true;

for (const configPath of vercelConfigPaths) {
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Missing config at: ${configPath}`);
    allPassed = false;
    continue;
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const json = JSON.parse(raw);
    console.log(`\n✔ Config file valid JSON: ${configPath}`);

    if (!Array.isArray(json.rewrites)) {
      console.error(`❌ No 'rewrites' array in ${configPath}`);
      allPassed = false;
      continue;
    }

    // Verify API proxy rule
    const apiRule = json.rewrites.find(r => r.source === '/api/(.*)');
    if (!apiRule) {
      console.error(`❌ Missing /api/(.*) proxy rule in ${configPath}`);
      allPassed = false;
    } else if (!apiRule.destination.startsWith('https://wattwise-ai-se66.onrender.com/api/')) {
      console.error(`❌ Invalid destination in API proxy rule: ${apiRule.destination}`);
      allPassed = false;
    } else {
      console.log(`  ✔ API rewrite rule verified: /api/(.*) -> ${apiRule.destination}`);
    }

    // Verify SPA fallback rule
    const spaRule = json.rewrites.find(r => r.source === '/(.*)');
    if (!spaRule) {
      console.error(`❌ Missing /(.*) SPA fallback rule in ${configPath}`);
      allPassed = false;
    } else if (spaRule.destination !== '/index.html') {
      console.error(`❌ SPA fallback destination must be '/index.html', got: ${spaRule.destination}`);
      allPassed = false;
    } else {
      console.log(`  ✔ SPA fallback rewrite rule verified: /(.*) -> ${spaRule.destination}`);
    }

    // Check order: API rule MUST precede SPA fallback rule
    const apiIndex = json.rewrites.findIndex(r => r.source === '/api/(.*)');
    const spaIndex = json.rewrites.findIndex(r => r.source === '/(.*)');
    if (apiIndex > spaIndex) {
      console.error(`❌ Rule order error: API proxy must come BEFORE catch-all /(.*) rewrite`);
      allPassed = false;
    } else {
      console.log(`  ✔ Rule order verified: API proxy (index ${apiIndex}) precedes catch-all (index ${spaIndex})`);
    }

  } catch (err) {
    console.error(`❌ Failed parsing JSON at ${configPath}:`, err.message);
    allPassed = false;
  }
}

// Verify client dist index.html exists
const distIndex = path.resolve('./client/dist/index.html');
if (fs.existsSync(distIndex)) {
  const content = fs.readFileSync(distIndex, 'utf8');
  if (content.includes('<div id="root">') && content.includes('src="/assets/index-')) {
    console.log('\n✔ Built client/dist/index.html is valid and contains root mount point + assets.');
  } else {
    console.error('❌ client/dist/index.html appears malformed.');
    allPassed = false;
  }
} else {
  console.error(`❌ client/dist/index.html does not exist! Run client build first.`);
  allPassed = false;
}

// Test SPA simulation logic
console.log('\n--- Route Matching Simulation ---');
const routesToTest = [
  { url: '/carbon', expected: '/index.html', desc: 'Direct navigation to /carbon' },
  { url: '/rules', expected: '/index.html', desc: 'Direct navigation to /rules' },
  { url: '/appliances', expected: '/index.html', desc: 'Direct navigation to /appliances' },
  { url: '/insights', expected: '/index.html', desc: 'Direct navigation to /insights' },
  { url: '/forecast', expected: '/index.html', desc: 'Direct navigation to /forecast' },
  { url: '/pulse', expected: '/index.html', desc: 'Direct navigation to /pulse' },
  { url: '/what-if', expected: '/index.html', desc: 'Direct navigation to /what-if' },
  { url: '/api/carbon', expected: 'https://wattwise-ai-se66.onrender.com/api/carbon', desc: 'Backend API call' },
  { url: '/api/status', expected: 'https://wattwise-ai-se66.onrender.com/api/status', desc: 'Backend API call' },
  { url: '/assets/index-CWXnCQls.css', expected: 'STATIC_FILE', desc: 'Static CSS stylesheet' }
];

const vercelJson = JSON.parse(fs.readFileSync('./vercel.json', 'utf8'));

for (const test of routesToTest) {
  // Check static file first (Vercel behavior)
  const staticPath = path.join('./client/dist', test.url);
  if (fs.existsSync(staticPath)) {
    console.log(`✔ [${test.url}] -> Serves static file directly: ${staticPath} (${test.desc})`);
    continue;
  }

  // Evaluate rewrites in order
  let matchedDestination = null;
  for (const rewrite of vercelJson.rewrites) {
    const regexPattern = new RegExp('^' + rewrite.source.replace('(.*)', '(.*)') + '$');
    const match = test.url.match(regexPattern);
    if (match) {
      if (rewrite.destination.includes('$1')) {
        matchedDestination = rewrite.destination.replace('$1', match[1] || '');
      } else {
        matchedDestination = rewrite.destination;
      }
      break;
    }
  }

  if (matchedDestination === test.expected) {
    console.log(`✔ [${test.url}] -> Successfully resolved to: ${matchedDestination} (${test.desc})`);
  } else {
    console.error(`❌ [${test.url}] Mismatch! Expected ${test.expected}, got ${matchedDestination}`);
    allPassed = false;
  }
}

if (allPassed) {
  console.log('\n========================================');
  console.log('🎉 ALL VERCEL ROUTING TESTS PASSED (100%)');
  console.log('========================================');
  process.exit(0);
} else {
  console.error('\n❌ Some routing tests failed.');
  process.exit(1);
}
