require('dotenv').config({ path: 'c:/Users/HEllo/Desktop/work/backend/.env' });
const connectDB = require('./config/db');
const Product = require('./models/Product');

async function run() {
    await connectDB();
    const products = await Product.find({});
    products.forEach(p => {
        console.log(`ID: ${p._id}, Name: ${p.name}, Img: ${p.img}, Categories: ${p.categories.join(', ')}`);
    });
    process.exit(0);
}
run();
