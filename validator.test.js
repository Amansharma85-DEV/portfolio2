/**
 * Strict Input Validation Unit & Integration Test Suite
 */

'use strict';

const assert = require('assert');
const { validateData } = require('./validator');

function runTests() {
  console.log('🧪 Running Strict Input Schema Validation Tests...\n');

  // Test 1: Reject Missing Required Fields
  console.log('▶ Test 1: Reject Missing Required Fields');
  const schema = {
    type: 'object',
    required: ['name', 'email'],
    properties: {
      name: { type: 'string', minLength: 2 },
      email: { type: 'string', format: 'email' }
    }
  };

  const res1 = validateData(schema, { name: 'Aman' }); // missing email
  assert.strictEqual(res1.valid, false, 'Should reject missing email');
  assert.strictEqual(res1.errors[0].code, 'MISSING_REQUIRED_FIELD');
  console.log('  ✓ Correctly rejected payload missing required email.');

  // Test 2: Reject Unexpected / Unknown Properties
  console.log('\n▶ Test 2: Reject Unexpected Extra Properties (allowUnknown: false)');
  const schemaStrict = {
    type: 'object',
    allowUnknown: false,
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email' }
    }
  };

  const res2 = validateData(schemaStrict, { email: 'aman@example.com', maliciousField: '<script>alert(1)</script>' });
  assert.strictEqual(res2.valid, false, 'Should reject unexpected extra property');
  assert.strictEqual(res2.errors[0].code, 'UNEXPECTED_PROPERTY');
  console.log('  ✓ Correctly rejected unlisted unexpected property.');

  // Test 3: Reject Invalid Type
  console.log('\n▶ Test 3: Reject Invalid Property Data Type');
  const res3 = validateData(schema, { name: 12345, email: 'aman@example.com' });
  assert.strictEqual(res3.valid, false, 'Should reject numeric name when string expected');
  assert.strictEqual(res3.errors[0].code, 'INVALID_TYPE');
  console.log('  ✓ Correctly rejected invalid type (number instead of string).');

  // Test 4: Reject Invalid String Length (too short / too long)
  console.log('\n▶ Test 4: Reject String Length Violations');
  const lenSchema = {
    properties: {
      username: { type: 'string', minLength: 4, maxLength: 10 }
    }
  };

  const resTooShort = validateData(lenSchema, { username: 'abc' });
  assert.strictEqual(resTooShort.valid, false, 'Should reject username shorter than 4 chars');
  assert.strictEqual(resTooShort.errors[0].code, 'MIN_LENGTH_VIOLATION');

  const resTooLong = validateData(lenSchema, { username: 'verylongusernamestring' });
  assert.strictEqual(resTooLong.valid, false, 'Should reject username longer than 10 chars');
  assert.strictEqual(resTooLong.errors[0].code, 'MAX_LENGTH_VIOLATION');
  console.log('  ✓ Correctly rejected strings failing minLength and maxLength constraints.');

  // Test 5: Reject Invalid Formats (Email, Phone, Weak Password)
  console.log('\n▶ Test 5: Reject Format Mismatches (Email & Weak Password)');
  const authSchema = {
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', format: 'strongPassword' }
    }
  };

  const resBadEmail = validateData(authSchema, { email: 'not-an-email', password: 'Password123!' });
  assert.strictEqual(resBadEmail.valid, false, 'Should reject invalid email format');
  assert.strictEqual(resBadEmail.errors[0].code, 'INVALID_FORMAT');

  const resWeakPass = validateData(authSchema, { email: 'valid@example.com', password: 'weak' });
  assert.strictEqual(resWeakPass.valid, false, 'Should reject weak password missing special char/length');
  assert.strictEqual(resWeakPass.errors[0].code, 'INVALID_FORMAT');
  console.log('  ✓ Correctly rejected non-conforming email and weak password formats.');

  // Test 6: Accept Valid Conforming Payload
  console.log('\n▶ Test 6: Accept Valid Conforming Payload');
  const resValid = validateData(schema, { name: 'Aman Sharma', email: 'amansharma.aslink@gmail.com' });
  assert.strictEqual(resValid.valid, true, 'Should accept conforming payload');
  assert.strictEqual(resValid.errors.length, 0);
  console.log('  ✓ Correctly accepted valid conforming payload.');

  console.log('\n✅ ALL STRICT VALIDATION TESTS PASSED SUCCESSFULLY!\n');
}

runTests();
