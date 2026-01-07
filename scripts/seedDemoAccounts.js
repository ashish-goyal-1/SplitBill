/**
 * Demo Account Seed Script
 * Creates demo accounts for recruiters/portfolio reviewers
 * 
 * Run: node scripts/seedDemoAccounts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log('✅ Connected to MongoDB');
    seedDemoAccounts();
}).catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
});

// User Schema (inline to avoid schema connection issues)
const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String },
    emailId: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    refreshToken: { type: String, default: null },
    paymentMethods: [{ type: { type: String, default: 'Cash' }, details: String, isDefault: Boolean }],
    preferredPayees: [String],
    defaultCurrency: { type: String, default: 'INR' },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    verificationTokenExpires: { type: Date, default: null },
    resetToken: { type: String, default: null },
    resetTokenExpires: { type: Date, default: null }
});

const User = mongoose.models.user || mongoose.model('user', UserSchema);

// Demo accounts configuration
const demoAccounts = [
    {
        firstName: 'John',
        lastName: 'Demo',
        emailId: 'john@gmail.com',
        password: 'John@123',
        defaultCurrency: 'INR',
        paymentMethods: [{ type: 'UPI', details: 'john@upi', isDefault: true }]
    },
    {
        firstName: 'Jane',
        lastName: 'Demo',
        emailId: 'jane@gmail.com',
        password: 'Jane@123',
        defaultCurrency: 'INR',
        paymentMethods: [{ type: 'UPI', details: 'jane@upi', isDefault: true }]
    }
];

async function seedDemoAccounts() {
    console.log('\n🌱 Seeding demo accounts...\n');

    for (const account of demoAccounts) {
        try {
            // Check if account already exists
            const existing = await User.findOne({ emailId: account.emailId });

            if (existing) {
                // Update to ensure it's verified
                await User.updateOne(
                    { emailId: account.emailId },
                    { $set: { isVerified: true } }
                );
                console.log(`✓ ${account.emailId} already exists (ensured verified)`);
            } else {
                // Hash password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(account.password, salt);

                // Create user with isVerified = true
                await User.create({
                    ...account,
                    password: hashedPassword,
                    isVerified: true  // Skip email verification for demo
                });
                console.log(`✅ Created: ${account.emailId} / ${account.password}`);
            }
        } catch (err) {
            console.error(`❌ Failed to create ${account.emailId}:`, err.message);
        }
    }

    console.log('\n✨ Demo accounts ready!\n');
    console.log('┌─────────────────────────────────────────┐');
    console.log('│  Demo Account Credentials               │');
    console.log('├─────────────────────────────────────────┤');
    console.log('│  📧 john@gmail.com  |  🔑 John@123      │');
    console.log('│  📧 jane@gmail.com  |  🔑 Jane@123      │');
    console.log('└─────────────────────────────────────────┘\n');

    mongoose.connection.close();
    process.exit(0);
}
