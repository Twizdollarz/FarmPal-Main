import { requireAuth, optionalAuth, AuthRequest } from '../src/middleware/auth.ts';
import { Response } from 'express';

interface MockResponse {
  statusCode: number;
  jsonData: any;
  status: (code: number) => MockResponse;
  json: (data: any) => MockResponse;
}

function createMockRes(): { res: Response; getStatus: () => number; getJson: () => any } {
  let statusCode = 200;
  let jsonData: any = null;

  const mockRes: any = {
    status(code: number) {
      statusCode = code;
      return mockRes;
    },
    json(data: any) {
      jsonData = data;
      return mockRes;
    },
  };

  return {
    res: mockRes as Response,
    getStatus: () => statusCode,
    getJson: () => jsonData,
  };
}

async function runVerification() {
  console.log('====================================================');
  console.log('🛡️  VERIFYING DETERMINISTIC TEST-TOKEN SECURITY');
  console.log('====================================================\n');

  // =========================================================================
  // PART 1: DEVELOPMENT ENVIRONMENT (NODE_ENV=development)
  // =========================================================================
  process.env.NODE_ENV = 'development';
  console.log(`[ENV] Current NODE_ENV: ${process.env.NODE_ENV}`);

  {
    const req: AuthRequest = {
      headers: { authorization: 'Bearer test-token-farmer-a' },
    } as any;
    const { res, getStatus } = createMockRes();
    let nextCalled = false;

    await requireAuth(req, res, () => {
      nextCalled = true;
    });

    const passed = nextCalled && req.user?.uid === 'farmer-a';
    console.log(`DEV requireAuth test-token-farmer-a: ${passed ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  ↳ nextCalled: ${nextCalled}, req.user:`, req.user);
    if (!passed) process.exit(1);
  }

  {
    const req: AuthRequest = {
      headers: { authorization: 'Bearer test-token-farmer-1' },
    } as any;
    const { res } = createMockRes();
    let nextCalled = false;

    await optionalAuth(req, res, () => {
      nextCalled = true;
    });

    const passed = nextCalled && req.user?.uid === 'farmer-1';
    console.log(`DEV optionalAuth test-token-farmer-1: ${passed ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  ↳ nextCalled: ${nextCalled}, req.user:`, req.user);
    if (!passed) process.exit(1);
  }

  // =========================================================================
  // PART 2: PRODUCTION ENVIRONMENT (NODE_ENV=production)
  // =========================================================================
  process.env.NODE_ENV = 'production';
  console.log(`\n[ENV] Current NODE_ENV: ${process.env.NODE_ENV}`);

  const testTokens = [
    'test-token-farmer-a',
    'test-token-farmer-1',
    'test-token-admin',
    'test-token-anything',
    'test-token-attacker-bypass',
  ];

  for (const token of testTokens) {
    const req: AuthRequest = {
      headers: { authorization: `Bearer ${token}` },
    } as any;
    const { res, getStatus, getJson } = createMockRes();
    let nextCalled = false;

    await requireAuth(req, res, () => {
      nextCalled = true;
    });

    const status = getStatus();
    const json = getJson();
    const userPopulated = !!req.user;
    const passed = !nextCalled && status === 401 && !userPopulated;

    console.log(`PROD requireAuth "${token}": ${passed ? '✅ BLOCKED (401)' : '❌ FAILED'}`);
    console.log(`  ↳ status: ${status}, nextCalled: ${nextCalled}, req.user: ${userPopulated ? JSON.stringify(req.user) : 'undefined'}, json:`, json);

    if (!passed) {
      console.error(`FAILED: ${token} was not properly blocked with 401 in production!`);
      process.exit(1);
    }
  }

  // Also test optionalAuth in production: must NOT populate req.user for test-token-*
  for (const token of testTokens) {
    const req: AuthRequest = {
      headers: { authorization: `Bearer ${token}` },
    } as any;
    const { res } = createMockRes();
    let nextCalled = false;

    await optionalAuth(req, res, () => {
      nextCalled = true;
    });

    const userPopulated = !!req.user;
    const passed = nextCalled && !userPopulated;

    console.log(`PROD optionalAuth "${token}": ${passed ? '✅ UNPOPULATED (req.user is undefined)' : '❌ FAILED'}`);
    console.log(`  ↳ nextCalled: ${nextCalled}, req.user: ${userPopulated ? JSON.stringify(req.user) : 'undefined'}`);

    if (!passed) {
      console.error(`FAILED: optionalAuth populated user for ${token} in production!`);
      process.exit(1);
    }
  }

  console.log('\n🎉 ALL DEVELOPMENT AND PRODUCTION TEST-TOKEN VERIFICATIONS PASSED!\n');
}

runVerification().catch((err) => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
