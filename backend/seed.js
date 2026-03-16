import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Product from './models/Product.js';
import Customer from './models/Customer.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Customer.deleteMany({});
    console.log('Cleared existing data.');

    // Seed Admin User
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      name: 'Admin User',
      email: 'admin@lumo.com',
      password: hashedAdminPassword,
      role: 'admin'
    });
    await admin.save();
    console.log('Admin user seeded: admin@lumo.com / admin123');

    // Seed Staff User
    const hashedStaffPassword = await bcrypt.hash('staff123', 10);
    const staff = new User({
      name: 'Staff Member',
      email: 'staff@lumo.com',
      password: hashedStaffPassword,
      role: 'staff'
    });
    await staff.save();
    console.log('Staff user seeded: staff@lumo.com / staff123');

    // Seed Products
    const products = [
      { name: '0.5HP Centrifugal Pump', brand: 'Lumo', category: 'Pump', price: 4500, stock: 10 },
      { name: '1HP Monoblock Pump', brand: 'Lumo', category: 'Pump', price: 7200, stock: 4 }, // Low stock
      { name: '1.5mm Copper Cable (100m)', brand: 'Finolex', category: 'Cable', price: 2800, stock: 15 },
      { name: 'PVC Pipe 2 inch (6m)', brand: 'Supreme', category: 'Pipe', price: 850, stock: 20 },
      { name: 'Submersible Starter 1HP', brand: 'BCH', category: 'Starter', price: 1800, stock: 3 } // Low stock
    ];
    await Product.insertMany(products);
    console.log('Sample products seeded.');

    // Seed Customers
    const customers = [
      { name: 'John Doe', phone: '9876543210', address: '123 Main St, Chennai' },
      { name: 'Jane Smith', phone: '8765432109', address: '456 West Ave, Madurai' }
    ];
    await Customer.insertMany(customers);
    console.log('Sample customers seeded.');

    console.log('Seeding completed successfully!');
    process.exit();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
