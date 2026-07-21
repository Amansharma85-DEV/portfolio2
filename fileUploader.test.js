/**
 * File Upload Safety Verification Suite
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { validateUpload, saveToIsolatedStorage, ISOLATED_UPLOAD_DIR } = require('./fileUploader');

function runTests() {
  console.log('🧪 Running File Upload Safety Verification Tests...\n');

  // Test 1: Reject Disallowed MIME Type / Extension
  console.log('▶ Test 1: Reject Disallowed File Extension & MIME Type (e.g. .exe / .php / .js)');
  const fakePhpBuffer = Buffer.from('<?php echo "malicious code"; ?>');
  const res1 = validateUpload(fakePhpBuffer, 'shell.php', 'application/x-php');

  assert.strictEqual(res1.valid, false, 'Should reject php MIME type');
  assert.ok(res1.errors[0].includes('not allowed'), 'Should state MIME type is not allowed');
  console.log('  ✓ Correctly rejected PHP upload request.');

  // Test 2: Reject Renamed File with Spoofed Extension (Magic Byte Inspection)
  console.log('\n▶ Test 2: Reject Spoofed File Extension (PHP script renamed to fake.png)');
  const res2 = validateUpload(fakePhpBuffer, 'fake.png', 'image/png');

  assert.strictEqual(res2.valid, false, 'Should reject file failing magic byte inspection');
  assert.ok(res2.errors[0].includes('magic byte verification failed'), 'Should state magic byte validation failed');
  console.log('  ✓ Correctly rejected spoofed extension failing binary magic byte check.');

  // Test 3: Accept Genuine PNG File with Valid Magic Bytes
  console.log('\n▶ Test 3: Accept Genuine PNG File with Verified Magic Bytes');
  // PNG Magic Header: 89 50 4E 47 0D 0A 1A 0A
  const validPngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52]);
  const res3 = validateUpload(validPngHeader, 'avatar.png', 'image/png');

  assert.strictEqual(res3.valid, true, 'Should accept valid PNG binary');
  assert.strictEqual(res3.ext, '.png');
  console.log('  ✓ Correctly accepted genuine PNG binary with matching magic bytes.');

  // Test 4: Verify Isolated Storage Outside Web Root & UUID Filename
  console.log('\n▶ Test 4: Save to Isolated Directory with Randomized UUID Filename');
  const saved = saveToIsolatedStorage(validPngHeader, '.png');

  assert.ok(saved.filename.endsWith('.png'), 'Filename should end with .png');
  assert.notStrictEqual(saved.filename, 'avatar.png', 'Filename must NOT preserve user-supplied original filename');
  assert.ok(saved.path.includes('uploads_isolated'), 'Storage path must be inside isolated directory');
  assert.ok(fs.existsSync(saved.path), 'File should exist on disk');
  console.log(`  ✓ File saved safely to isolated storage: ${saved.filename}`);

  // Cleanup test file
  fs.unlinkSync(saved.path);

  console.log('\n✅ ALL FILE UPLOAD SAFETY VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
}

runTests();
