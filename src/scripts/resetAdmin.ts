import { config } from '../config/index.js';
import { connectDB } from '../config/database.js';
import { User } from '../models/index.js';

async function resetAdmin() {
  await connectDB();

  console.log('🔄 Resetting admin user...');

  const email = config.admin.email;
  const password = config.admin.password;

  // Delete existing admin if exists
  await User.deleteOne({ email });

  // Create new admin user
  const admin = await User.create({
    email,
    password,
    name: 'Admin',
    role: 'admin',
  });

  console.log('\n✅ Admin user reset successfully!');
  console.log(`\n📝 Admin credentials:`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  
  process.exit(0);
}

resetAdmin().catch((error) => {
  console.error('Reset failed:', error);
  process.exit(1);
});
