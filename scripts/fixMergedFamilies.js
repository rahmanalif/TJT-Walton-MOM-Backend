const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Parent = require('../src/models/Parent.model');
const MergeRequest = require('../src/models/MergeRequest.model');

/**
 * Script to fix existing merged families
 * This adds parents to each other's familyMembers array based on approved merge requests
 */
async function fixMergedFamilies() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all approved and completed merge requests
    const approvedMerges = await MergeRequest.find({
      status: 'approved',
      mergeCompleted: true
    });

    console.log(`Found ${approvedMerges.length} approved merge requests`);

    let updatedCount = 0;

    for (const merge of approvedMerges) {
      console.log(`\nProcessing merge: ${merge._id}`);
      console.log(`  Requester: ${merge.requester}`);
      console.log(`  Recipient: ${merge.recipient}`);

      // Get both parents
      const requesterParent = await Parent.findById(merge.requester);
      const recipientParent = await Parent.findById(merge.recipient);

      if (!requesterParent) {
        console.log(`  ⚠️  Requester parent not found`);
        continue;
      }

      if (!recipientParent) {
        console.log(`  ⚠️  Recipient parent not found`);
        continue;
      }

      let updated = false;

      // Add recipient to requester's family members
      if (!requesterParent.familyMembers.some(id => id.toString() === merge.recipient.toString())) {
        requesterParent.familyMembers.push(merge.recipient);
        await requesterParent.save();
        console.log(`  ✓ Added recipient to requester's family members`);
        updated = true;
      } else {
        console.log(`  - Recipient already in requester's family members`);
      }

      // Add requester to recipient's family members
      if (!recipientParent.familyMembers.some(id => id.toString() === merge.requester.toString())) {
        recipientParent.familyMembers.push(merge.requester);
        await recipientParent.save();
        console.log(`  ✓ Added requester to recipient's family members`);
        updated = true;
      } else {
        console.log(`  - Requester already in recipient's family members`);
      }

      if (updated) {
        updatedCount++;
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Updated ${updatedCount} merge relationships`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the migration
fixMergedFamilies();
