/**
 * migrate_group_admins.js
 *
 * One-shot migration: for every Group that has no admins and is not the
 * PUBLIC group, promote members[0] to be the sole admin.
 *
 * Usage:
 *   node scripts/migrate_group_admins.js           # dry-run (default)
 *   node scripts/migrate_group_admins.js --apply   # actually write changes
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const groupSchema = require('../schema/Group_schema.js');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('ERROR: MONGO_URI is not set. Check server/.env');
  process.exit(1);
}

const applyMode = process.argv.includes('--apply');

async function run() {
  console.log(`Mode: ${applyMode ? 'APPLY (writes enabled)' : 'DRY-RUN (no changes will be made)'}`);
  console.log('Connecting to MongoDB...');

  const conn = mongoose.createConnection(MONGO_URI);
  await conn.asPromise();
  console.log('Connected.\n');

  const Groups = conn.model('Groups', groupSchema, 'Groups');

  // Find all groups where admins is empty or missing and inviteCode is not 'PUBLIC'
  // Legacy documents have the field absent (undefined), not [] — so match both cases
  const groups = await Groups.find({
    $or: [{ admins: { $size: 0 } }, { admins: { $exists: false } }],
    inviteCode: { $ne: 'PUBLIC' },
  }).lean();

  console.log(`Groups with empty admins (excluding PUBLIC): ${groups.length}`);

  if (groups.length === 0) {
    console.log('Nothing to do. Exiting.');
    await conn.close();
    return;
  }

  let wouldUpdate = 0;
  let skipped = 0;
  const assignments = [];

  for (const group of groups) {
    if (!group.members || group.members.length === 0) {
      console.log(`  SKIP  "${group.name}" (id: ${group._id}) — no members`);
      skipped++;
      continue;
    }

    const newAdmin = group.members[0];

    if (applyMode) {
      await Groups.updateOne({ _id: group._id }, { $set: { admins: [newAdmin] } });
      console.log(`  UPDATED  "${group.name}" (id: ${group._id}) — admins set to [${newAdmin}]`);
    } else {
      console.log(`  WOULD UPDATE  "${group.name}" (id: ${group._id}) — would set admins to [${newAdmin}]`);
    }

    wouldUpdate++;
    assignments.push({ name: group.name, admin: newAdmin });
  }

  console.log('\n--- Summary ---');
  console.log(`Total matching groups : ${groups.length}`);
  console.log(`${applyMode ? 'Updated' : 'Would update'} : ${wouldUpdate}`);
  console.log(`Skipped (no members)  : ${skipped}`);

  if (assignments.length > 0) {
    console.log('\nAssignments:');
    for (const { name, admin } of assignments) {
      console.log(`  "${name}" → ${admin}`);
    }
  }

  if (!applyMode && wouldUpdate > 0) {
    console.log('\nRe-run with --apply to commit these changes.');
  }

  await conn.close();
  console.log('\nDisconnected. Done.');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
