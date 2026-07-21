/**
 * Rate Limiter Integration & Unit Test Suite
 */

'use strict';

const assert = require('assert');
const {
  createAuthRateLimiter,
  createPublicRateLimiter,
  createAuthenticatedRateLimiter,
  store
} = require('./rateLimiter');

// Helper to simulate express req, res, next
function mockReqRes(options = {}) {
  const req = {
    ip: options.ip || '192.168.1.100',
    headers: options.headers || {},
    body: options.body || {},
    params: options.params || {},
    user: options.user || null
  };

  const res = {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; }
  };

  return { req, res };
}

async function runTests() {
  console.log('🧪 Running Rate Limiter Verification Tests...\n');

  // Test 1: Configurable Auth Limiter Exponential Backoff Test
  console.log('▶ Test 1: Auth Route Per-IP & Account Exponential Backoff');
  const authLimiter = createAuthRateLimiter({
    auth: {
      maxPerIp: 5,
      maxPerAccount: 3,
      baseBackoffMs: 100,
      maxBackoffMs: 1000,
      backoffFactor: 2
    }
  });

  const { req, res } = mockReqRes({
    ip: '10.0.0.1',
    body: { email: 'test@example.com' }
  });

  let nextCalled = false;
  authLimiter(req, res, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, true, 'First request should pass middleware');
  assert.strictEqual(res.statusCode, 200, 'Initial status should be 200');

  // Record 1st failure
  const fail1 = res.recordAuthFailure();
  assert.strictEqual(fail1.attempts, 1, 'Attempt count should be 1');
  assert.strictEqual(fail1.delayMs, 100, 'First delay should be 100ms');

  // Sub-request should be blocked with 429 & exponential backoff info
  const { req: reqBlocked, res: resBlocked } = mockReqRes({
    ip: '10.0.0.1',
    body: { email: 'test@example.com' }
  });

  authLimiter(reqBlocked, resBlocked, () => {});
  assert.strictEqual(resBlocked.statusCode, 429, 'Should return 429 status during backoff');
  assert.strictEqual(resBlocked.body.type, 'EXPONENTIAL_BACKOFF', 'Type should be EXPONENTIAL_BACKOFF');
  console.log('  ✓ Auth Exponential backoff correctly enforced 429 status.');

  // Test 2: Public Route Moderate Limiter Test
  console.log('\n▶ Test 2: Public Endpoint Moderate Rate Limiting');
  const publicLimiter = createPublicRateLimiter({
    public: { windowMs: 60000, maxRequests: 3 }
  });

  const clientIp = '203.0.113.45';

  for (let i = 1; i <= 3; i++) {
    const { req: r, res: s } = mockReqRes({ ip: clientIp });
    let passed = false;
    publicLimiter(r, s, () => { passed = true; });
    assert.strictEqual(passed, true, `Request ${i} should be allowed`);
  }

  // 4th request should exceed limit
  const { req: r4, res: s4 } = mockReqRes({ ip: clientIp });
  let p4 = false;
  publicLimiter(r4, s4, () => { p4 = true; });

  assert.strictEqual(p4, false, '4th request should not pass');
  assert.strictEqual(s4.statusCode, 429, 'Should return 429 Too Many Requests');
  assert.strictEqual(s4.body.type, 'PUBLIC_LIMIT_EXCEEDED');
  console.log('  ✓ Public Moderate Rate Limit correctly enforced at 3 requests limit.');

  // Test 3: Authenticated User Actions Rate Limiter Test
  console.log('\n▶ Test 3: Authenticated User Actions Looser Rate Limiting');
  const authedLimiter = createAuthenticatedRateLimiter({
    authenticated: { windowMs: 60000, maxRequests: 5 }
  });

  const userId = 'usr_vip_99';
  for (let i = 1; i <= 5; i++) {
    const { req: r, res: s } = mockReqRes({ user: { id: userId } });
    let passed = false;
    authedLimiter(r, s, () => { passed = true; });
    assert.strictEqual(passed, true, `Authed request ${i} should be allowed`);
  }

  // 6th request should exceed authed limit
  const { req: r6, res: s6 } = mockReqRes({ user: { id: userId } });
  let p6 = false;
  authedLimiter(r6, s6, () => { p6 = true; });

  assert.strictEqual(p6, false, '6th authed request should be blocked');
  assert.strictEqual(s6.statusCode, 429, 'Should return 429 Too Many Requests');
  assert.strictEqual(s6.body.type, 'AUTHED_USER_LIMIT_EXCEEDED');
  console.log('  ✓ Authenticated User Action Rate Limit correctly enforced per user ID.');

  console.log('\n✅ ALL VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
