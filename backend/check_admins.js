require('dotenv').config();
const connectDB = require('./config/db');
const Admin = require('./models/Admin');
const bcrypt = require('bcryptjs');

async function check() {
  await connectDB();
  const admins = await Admin.find({});
  console.log('--- ADMIN USERS IN DATABASE ---');
  for (const a of admins) {
    console.log(`Name: ${a.name}`);
    console.log(`Email: ${a.email}`);
    console.log(`Role: ${a.role}`);
    
    // Check if password compares to 'adminpassword123'
    const match1 = await bcrypt.compare('adminpassword123', a.password);
    console.log(`Password matches 'adminpassword123': ${match1}`);
    
    // Check if password compares to 'tempadminpass'
    const match2 = await bcrypt.compare('tempadminpass', a.password);
    console.log(`Password matches 'tempadminpass': ${match2}`);
    console.log('--------------------------------');
  }
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
