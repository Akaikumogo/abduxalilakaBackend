import { config } from '../config/index.js';
import { connectDB } from '../config/database.js';
import { User, Settings } from '../models/index.js';

async function seed() {
  await connectDB();

  console.log('🌱 Seeding database...');

  // Create admin user
  const existingAdmin = await User.findOne({ email: config.admin.email });
  
  if (!existingAdmin) {
    await User.create({
      email: config.admin.email,
      password: config.admin.password,
      name: 'Admin',
      role: 'admin',
    });
    console.log(`✅ Admin user created: ${config.admin.email}`);
  } else {
    console.log(`ℹ️ Admin user already exists: ${config.admin.email}`);
  }

  // Create default settings
  const defaultSettings = [
    {
      key: 'quickReplies',
      value: {
        "Dasturlar haqida ma'lumot": "Bizning dasturlar:\n\n1. Language Preparation Courses\n2. Foundation Programme\n3. Bachelor's Degree\n4. Master's Degree",
        "Konsultatsiya olish": "Konsultatsiya olish uchun quyidagi formani to'ldiring",
        "Aloqa ma'lumotlari": "Aloqa ma'lumotlari:\n\n📞 Telefon: +998 71 200 08 11\n📧 Email: info@buranconsulting.uz\n📍 Manzil: Toshkent shahri"
      }
    },
    {
      key: 'operatorInfo',
      value: {
        name: 'Operator Safia',
        role: 'User',
        telegram: '@buran_manager_sofia'
      }
    }
  ];

  for (const setting of defaultSettings) {
    await Settings.findOneAndUpdate(
      { key: setting.key },
      { value: setting.value },
      { upsert: true }
    );
  }
  console.log('✅ Default settings created');

  console.log('\n🎉 Seeding completed!');
  console.log(`\n📝 Default admin credentials:`);
  console.log(`   Email: ${config.admin.email}`);
  console.log(`   Password: ${config.admin.password}`);
  
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
