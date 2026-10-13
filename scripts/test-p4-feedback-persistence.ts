/**
 * Automated Verification Suite for FarmPal Persistence Milestone P4:
 * Feedback Persistence & Secure Feedback Management
 *
 * Covers:
 * 1. Unauthenticated request protection (GET, POST, DELETE -> 401)
 * 2. Server-side input validation (empty feedback, invalid rating, excessive length -> 400)
 * 3. Client userId spoofing prevention (userId derived strictly from req.user.uid)
 * 4. Tenant isolation (Farmer B receives 404 for Farmer A feedback ID; zero cross-tenant leakage in lists)
 * 5. Atomic deletion (Farmer B cannot delete Farmer A feedback; Farmer A can delete; deleted stays 404)
 * 6. Cold restart persistence (surviving feedbacks retain data, deleted feedbacks not resurrected)
 * 7. Concurrency (multiple simultaneous submissions all saved and persisted to PostgreSQL)
 */

import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const FARMER_A_TOKEN = 'test-token-farmer-p4-alpha';
const FARMER_B_TOKEN = 'test-token-farmer-p4-beta';
const STATE_FILE = path.join(process.cwd(), 'scripts', '.p4-test-state.json');

async function phase1() {
  console.log('====================================================');
  console.log('🧪 P4 PERSISTENCE TEST - PHASE 1: PRE-RESTART');
  console.log('====================================================\n');

  // 1. Unauthenticated Security Checks
  console.log('1. Testing Unauthenticated Access Restrictions...');
  const unauthGet = await fetch(`${BASE_URL}/api/feedback`);
  if (unauthGet.status !== 401) {
    throw new Error(`Unauthenticated GET /api/feedback expected 401, got ${unauthGet.status}`);
  }
  console.log('   ✓ GET /api/feedback without token returned HTTP 401');

  const unauthPost = await fetch(`${BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Anonymous feedback attempt' }),
  });
  if (unauthPost.status !== 401) {
    throw new Error(`Unauthenticated POST /api/feedback expected 401, got ${unauthPost.status}`);
  }
  console.log('   ✓ POST /api/feedback without token returned HTTP 401');

  const unauthDel = await fetch(`${BASE_URL}/api/feedback/fb-random-fake-id`, {
    method: 'DELETE',
  });
  if (unauthDel.status !== 401) {
    throw new Error(`Unauthenticated DELETE /api/feedback/:id expected 401, got ${unauthDel.status}`);
  }
  console.log('   ✓ DELETE /api/feedback/:id without token returned HTTP 401');

  // 2. Input Validation Checks
  console.log('\n2. Testing Server-Side Input Validation...');
  const emptyRes = await fetch(`${BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FARMER_A_TOKEN}`,
    },
    body: JSON.stringify({
      message: '   ',
      whatWorkedWell: '',
    }),
  });
  if (emptyRes.status !== 400) {
    throw new Error(`Empty feedback submission was not rejected with 400! Got ${emptyRes.status}`);
  }
  console.log('   ✓ Empty feedback submission rejected with HTTP 400');

  const invalidRatingRes = await fetch(`${BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FARMER_A_TOKEN}`,
    },
    body: JSON.stringify({
      message: 'Rating out of bounds',
      rating: 7, // Invalid!
    }),
  });
  if (invalidRatingRes.status !== 400) {
    throw new Error(`Rating out of bounds (7) was not rejected with 400! Got ${invalidRatingRes.status}`);
  }
  console.log('   ✓ Invalid rating (7) rejected with HTTP 400');

  const excessiveRes = await fetch(`${BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FARMER_A_TOKEN}`,
    },
    body: JSON.stringify({
      message: 'A'.repeat(3001),
    }),
  });
  if (excessiveRes.status !== 400) {
    throw new Error(`Excessive message (>3000 chars) was not rejected with 400! Got ${excessiveRes.status}`);
  }
  console.log('   ✓ Excessive length message rejected with HTTP 400');

  // 3. Authenticated Feedback Creation with Spoofed userId
  console.log('\n3. Testing Feedback Creation with Spoofed userId (Farmer A)...');
  const create1Res = await fetch(`${BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FARMER_A_TOKEN}`,
    },
    body: JSON.stringify({
      userId: 'hacker-impostor-victim-b', // MUST be strictly ignored
      farmerName: 'Alhaji Alpha Farmer',
      farmLocation: 'Zaria, Kaduna',
      primaryCrops: 'Roma Tomato, Maize',
      rating: 5,
      testedFeatures: ['whatsapp', 'planning', 'market'],
      easeOfUseRating: 'very_easy',
      clarityOfLanguage: 'clear',
      nairaAndUnitsMatch: 'yes',
      whatWorkedWell: 'The market price comparison for Dawanau vs Mile 12 was accurate and helped us negotiate.',
      whatWasConfusing: 'Clarify transport costs deducted from farmgate price.',
      desiredNextFeature: 'Audio recording in Hausa language.',
      category: 'market',
    }),
  });
  if (create1Res.status !== 201) {
    const errText = await create1Res.text();
    throw new Error(`Create feedback 1 failed: HTTP ${create1Res.status} - ${errText}`);
  }
  const create1Data = await create1Res.json();
  const fb1 = create1Data.feedback;
  console.log(`   ✓ Created Feedback 1: ${fb1.id} (Rating: ${fb1.rating} stars)`);

  if (fb1.userId === 'hacker-impostor-victim-b') {
    throw new Error('SECURITY VIOLATION: Server accepted client-supplied spoofed userId!');
  }
  if (fb1.userId !== 'farmer-p4-alpha') {
    throw new Error(`Expected userId 'farmer-p4-alpha', got '${fb1.userId}'`);
  }
  console.log(`   ✓ Feedback strictly assigned to authenticated user: ${fb1.userId}`);

  // 4. Verify Read Individual Feedback and Listing
  console.log('\n4. Testing Read Feedback (GET /api/feedback/:id and GET /api/feedback)...');
  const getFb1Res = await fetch(`${BASE_URL}/api/feedback/${fb1.id}`, {
    headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
  });
  if (!getFb1Res.ok) throw new Error(`Failed to read feedback 1: HTTP ${getFb1Res.status}`);
  const getFb1 = await getFb1Res.json();
  if (getFb1.id !== fb1.id || getFb1.whatWorkedWell !== fb1.whatWorkedWell) {
    throw new Error('Retrieved feedback record does not match created feedback!');
  }
  console.log(`   ✓ GET /api/feedback/:id succeeded: "${getFb1.whatWorkedWell.substring(0, 45)}..."`);

  const listARes = await fetch(`${BASE_URL}/api/feedback`, {
    headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
  });
  if (!listARes.ok) throw new Error(`Farmer A GET /api/feedback failed: ${listARes.status}`);
  const listAData = await listARes.json();
  const listA = Array.isArray(listAData) ? listAData : listAData.feedbacks;
  if (!listA.some((f: any) => f.id === fb1.id)) {
    throw new Error('Created feedback missing from farmer feedback list!');
  }
  console.log(`   ✓ Farmer A feedback list contains ${listA.length} record(s), summary calculated`);

  // 5. Create Feedback Specifically for Deletion Test
  console.log('\n5. Creating Feedback to Test Deletion & Cross-Tenant Mutation Prevention...');
  const delFbRes = await fetch(`${BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FARMER_A_TOKEN}`,
    },
    body: JSON.stringify({
      message: 'Temporary feedback entry to test deletion lifecycle',
      rating: 4,
      category: 'testing',
    }),
  });
  const delFbData = await delFbRes.json();
  const delFb = delFbData.feedback;
  console.log(`   Created Feedback to Delete: ${delFb.id}`);

  // Cross-tenant access check on delFb
  console.log('   Checking Farmer B cannot read or delete Farmer A feedback...');
  const bReadRes = await fetch(`${BASE_URL}/api/feedback/${delFb.id}`, {
    headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` },
  });
  if (bReadRes.status !== 404) {
    throw new Error(`Farmer B reading Farmer A feedback expected 404, got ${bReadRes.status}`);
  }
  console.log('   ✓ Farmer B GET /api/feedback/:id returned HTTP 404');

  const bDelRes = await fetch(`${BASE_URL}/api/feedback/${delFb.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` },
  });
  if (bDelRes.status !== 404) {
    throw new Error(`Farmer B deleting Farmer A feedback expected 404, got ${bDelRes.status}`);
  }
  console.log('   ✓ Farmer B DELETE /api/feedback/:id returned HTTP 404');

  // Farmer A deletes the feedback
  const aDelRes = await fetch(`${BASE_URL}/api/feedback/${delFb.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
  });
  if (!aDelRes.ok) throw new Error(`Farmer A delete feedback failed: ${aDelRes.status}`);
  console.log('   ✓ Farmer A DELETE /api/feedback/:id succeeded: HTTP 200');

  // Verify deleted feedback returns 404
  const confirmDelRes = await fetch(`${BASE_URL}/api/feedback/${delFb.id}`, {
    headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
  });
  if (confirmDelRes.status !== 404) {
    throw new Error(`Deleted feedback still returned HTTP ${confirmDelRes.status}`);
  }
  console.log('   ✓ Deleted feedback confirmed absent (HTTP 404)');

  // 6. Create Feedback for Farmer B
  console.log('\n6. Creating Feedback for Farmer B (with spoofed userId to Farmer A)...');
  const createBRes = await fetch(`${BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FARMER_B_TOKEN}`,
    },
    body: JSON.stringify({
      userId: 'farmer-p4-alpha', // Attempt to spoof Farmer A!
      farmerName: 'Chief Beta Farmer',
      farmLocation: 'Oyo, Nigeria',
      primaryCrops: 'Cassava, Sweet Potato',
      rating: 5,
      message: 'USSD interface is extremely fast and reliable for offline daily farm logs.',
      category: 'ussd',
    }),
  });
  if (createBRes.status !== 201) throw new Error(`Create Farmer B feedback failed: ${createBRes.status}`);
  const createBData = await createBRes.json();
  const fbB = createBData.feedback;
  console.log(`   Created Farmer B Feedback: ${fbB.id}`);

  if (fbB.userId !== 'farmer-p4-beta') {
    throw new Error(`Expected Farmer B feedback to belong to 'farmer-p4-beta', got '${fbB.userId}'`);
  }
  console.log('   ✓ Farmer B spoofed userId was safely ignored, assigned to farmer-p4-beta');

  // 7. Verify Zero Cross-Tenant Leakage in GET /api/feedback
  console.log('\n7. Verifying Zero Cross-Tenant Leakage between Farmer A and Farmer B...');
  const aListCheckRes = await fetch(`${BASE_URL}/api/feedback`, {
    headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
  });
  const aListCheckData = await aListCheckRes.json();
  const aFeedbacks = Array.isArray(aListCheckData) ? aListCheckData : aListCheckData.feedbacks;
  if (aFeedbacks.some((f: any) => f.id === fbB.id)) {
    throw new Error('LEAKAGE DETECTED: Farmer A feedback list contains Farmer B feedback!');
  }

  const bListCheckRes = await fetch(`${BASE_URL}/api/feedback`, {
    headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` },
  });
  const bListCheckData = await bListCheckRes.json();
  const bFeedbacks = Array.isArray(bListCheckData) ? bListCheckData : bListCheckData.feedbacks;
  if (bFeedbacks.some((f: any) => f.id === fb1.id)) {
    throw new Error('LEAKAGE DETECTED: Farmer B feedback list contains Farmer A feedback!');
  }
  console.log('   ✓ Farmer A sees 0 of Farmer B records; Farmer B sees 0 of Farmer A records');

  // 8. Concurrency Test: Multiple Simultaneous Feedback Submissions
  console.log('\n8. Testing Concurrency: 5 Simultaneous Feedback Submissions for Farmer A...');
  const concurrentPayloads = [1, 2, 3, 4, 5].map((num) => ({
    message: `Concurrent feedback batch entry #${num} testing atomic PostgreSQL inserts`,
    rating: (num % 5) + 1,
    category: `concurrency-${num}`,
  }));

  const concurrentPromises = concurrentPayloads.map((payload) =>
    fetch(`${BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FARMER_A_TOKEN}`,
      },
      body: JSON.stringify(payload),
    })
  );

  const concurrentResponses = await Promise.all(concurrentPromises);
  const concurrentCreated: any[] = [];
  for (let i = 0; i < concurrentResponses.length; i++) {
    const res = concurrentResponses[i];
    if (res.status !== 201) {
      throw new Error(`Concurrent feedback submission #${i + 1} failed: HTTP ${res.status}`);
    }
    const data = await res.json();
    concurrentCreated.push(data.feedback);
  }
  console.log(`   ✓ All 5 concurrent feedback submissions returned HTTP 201`);

  // Verify all 5 are present and unique
  const concurrentIds = new Set(concurrentCreated.map((f) => f.id));
  if (concurrentIds.size !== 5) {
    throw new Error('Duplicate IDs generated under concurrent submission!');
  }
  console.log(`   ✓ 5 unique records persisted across concurrent requests`);

  // 9. Save state for Phase 2 cold restart test
  const state = {
    fb1Id: fb1.id,
    delFbId: delFb.id,
    fbBId: fbB.id,
    concurrentIds: Array.from(concurrentIds),
    expectedFb1Rating: fb1.rating,
    expectedFb1WhatWorked: fb1.whatWorkedWell,
    expectedFbBMessage: fbB.message,
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  console.log('\n💾 Saved test state to .p4-test-state.json for cold restart test.');
  console.log('✅ Phase 1 complete!');
}

async function phase2() {
  console.log('====================================================');
  console.log('🧪 P4 PERSISTENCE TEST - PHASE 2: POST-RESTART');
  console.log('====================================================\n');

  if (!fs.existsSync(STATE_FILE)) {
    throw new Error(`State file ${STATE_FILE} not found! Run phase1 first.`);
  }
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));

  // 1. Confirm deleted feedback was NOT resurrected on cold restart
  console.log('1. Verifying deleted feedback remains absent post-restart...');
  const delCheckRes = await fetch(`${BASE_URL}/api/feedback/${state.delFbId}`, {
    headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
  });
  if (delCheckRes.status !== 404) {
    throw new Error(`Deleted feedback was resurrected after restart! HTTP ${delCheckRes.status}`);
  }
  console.log('   ✓ Deleted feedback confirmed absent post-restart (HTTP 404)');

  // 2. Confirm surviving feedbacks exist and preserve data
  console.log('\n2. Verifying Farmer A surviving feedback survived restart...');
  const fb1Res = await fetch(`${BASE_URL}/api/feedback/${state.fb1Id}`, {
    headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
  });
  if (!fb1Res.ok) throw new Error(`Farmer A feedback 1 missing post-restart: ${fb1Res.status}`);
  const fb1 = await fb1Res.json();
  if (fb1.rating !== state.expectedFb1Rating || fb1.whatWorkedWell !== state.expectedFb1WhatWorked) {
    throw new Error('Farmer A feedback 1 data corrupted or mismatched post-restart!');
  }
  console.log(`   ✓ Farmer A Feedback survived with Rating: ${fb1.rating} stars`);

  console.log('\n3. Verifying Farmer B surviving feedback survived restart...');
  const fbBRes = await fetch(`${BASE_URL}/api/feedback/${state.fbBId}`, {
    headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` },
  });
  if (!fbBRes.ok) throw new Error(`Farmer B feedback missing post-restart: ${fbBRes.status}`);
  const fbB = await fbBRes.json();
  if (fbB.message !== state.expectedFbBMessage) {
    throw new Error('Farmer B feedback message corrupted or mismatched post-restart!');
  }
  console.log(`   ✓ Farmer B Feedback survived with Message: "${fbB.message}"`);

  // 4. Confirm all 5 concurrent feedbacks survived restart
  console.log('\n4. Verifying all 5 concurrent feedback submissions survived restart...');
  for (const id of state.concurrentIds) {
    const res = await fetch(`${BASE_URL}/api/feedback/${id}`, {
      headers: { Authorization: `Bearer ${FARMER_A_TOKEN}` },
    });
    if (!res.ok) {
      throw new Error(`Concurrent feedback ${id} missing post-restart: HTTP ${res.status}`);
    }
  }
  console.log('   ✓ All 5 concurrent feedback entries confirmed present in PostgreSQL post-restart');

  // 5. Verify multi-tenant isolation remains intact post-restart
  console.log('\n5. Verifying multi-tenant cross-user isolation post-restart...');
  const crossGetRes = await fetch(`${BASE_URL}/api/feedback/${state.fb1Id}`, {
    headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` },
  });
  if (crossGetRes.status !== 404) {
    throw new Error(`Farmer B could access Farmer A feedback post-restart! HTTP ${crossGetRes.status}`);
  }
  console.log('   ✓ Farmer B GET Farmer A feedback ID returned HTTP 404 post-restart');

  const bListRes = await fetch(`${BASE_URL}/api/feedback`, {
    headers: { Authorization: `Bearer ${FARMER_B_TOKEN}` },
  });
  const bListData = await bListRes.json();
  const bFeedbacks = Array.isArray(bListData) ? bListData : bListData.feedbacks;
  const leakFound = bFeedbacks.some((f: any) => f.id === state.fb1Id || state.concurrentIds.includes(f.id));
  if (leakFound) {
    throw new Error('Farmer B feedback list leaked Farmer A records post-restart!');
  }
  console.log('   ✓ Farmer B list contains zero Farmer A records post-restart');

  console.log('\n====================================================');
  console.log('🎉 ALL P4 FEEDBACK PERSISTENCE & SECURITY TESTS PASSED!');
  console.log('====================================================');
}

const mode = process.argv[2] || 'all';
if (mode === 'phase1') {
  phase1().catch((err) => {
    console.error('❌ Phase 1 failed:', err);
    process.exit(1);
  });
} else if (mode === 'phase2') {
  phase2().catch((err) => {
    console.error('❌ Phase 2 failed:', err);
    process.exit(1);
  });
} else {
  console.error('Usage: npx tsx scripts/test-p4-feedback-persistence.ts [phase1|phase2]');
  process.exit(1);
}
