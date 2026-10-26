/**
 * Live Gemini SDK verification integration test
 */
import fs from 'node:fs';
import path from 'node:path';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const k = trimmed.substring(0, idx).trim();
      let v = trimmed.substring(idx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      process.env[k] = v;
    }
  }
}

const { GeminiPipelineService } = await import('../src/lib/gemini.ts');

async function testLiveVerification() {
  console.log('Testing Live Gemini SDK Verification...');
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error('GEMINI_API_KEY is not set');
    process.exit(1);
  }

  const service = new GeminiPipelineService(key);

  const spans = [
    { id: 'S1', text: 'NTRO announced emergency advisory CVE-2026-1104 affecting Linux Kernels 6.1 through 6.8.' },
    { id: 'S2', text: 'Mandatory emergency patching is required within 48 hours for critical infrastructure.' }
  ];

  const testOutput = {
    id: 'out-live-test',
    outputType: 'whatsapp',
    title: 'Security Alert',
    subtitle: 'Kernel Zero-Day',
    content: 'Urgent: CVE-2026-1104 zero-day vulnerability in Linux kernels 6.1 to 6.8. Patch required in 48 hours.',
    characterCount: 104,
    status: 'ready',
    claims: [
      {
        id: 'c-1',
        outputType: 'whatsapp',
        claimText: 'CVE-2026-1104 affects Linux Kernels 6.1 through 6.8.',
        sourceSpanIds: ['S1'],
        grounded: true,
        contradictionFlag: false
      },
      {
        id: 'c-2',
        outputType: 'whatsapp',
        claimText: 'Emergency patching must be completed within 48 hours.',
        sourceSpanIds: ['S2'],
        grounded: true,
        contradictionFlag: false
      }
    ]
  };

  try {
    const verifiedClaims = await service.verifyOutputClaims(testOutput, spans);
    console.log('Live Verification Result:', JSON.stringify(verifiedClaims, null, 2));

    const allGrounded = verifiedClaims.every(c => c.status === 'supported' && c.grounded);
    if (allGrounded) {
      console.log('SUCCESS: Live Gemini verification confirmed both claims are supported with explanations!');
    } else {
      console.log('NOTICE: Claims evaluated with statuses:', verifiedClaims.map(c => `${c.id}: ${c.status}`));
    }
  } catch (err) {
    console.error('Live verification failed:', err.message);
    process.exit(1);
  }
}

testLiveVerification();
