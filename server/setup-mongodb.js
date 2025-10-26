#!/usr/bin/env node

/**
 * MongoDB Setup Script for Workbench Server
 * This script helps you create a MongoDB user for the Workbench database
 */

import { MongoClient } from 'mongodb';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function setupMongoDB() {
  console.log('🔧 MongoDB Setup for Workbench Server\n');

  try {
    // Get connection details
    const host = await question('MongoDB host (default: localhost): ') || 'localhost';
    const port = await question('MongoDB port (default: 27017): ') || '27017';
    const adminUsername = await question('Admin username (default: admin): ') || 'admin';
    const adminPassword = await question('Admin password: ');
    
    if (!adminPassword) {
      console.log('❌ Admin password is required');
      process.exit(1);
    }

    const dbName = await question('Database name (default: workbench): ') || 'workbench';
    const username = await question('New user username: ');
    const password = await question('New user password: ');
    const confirmPassword = await question('Confirm password: ');

    if (password !== confirmPassword) {
      console.log('❌ Passwords do not match');
      process.exit(1);
    }

    if (!username || !password) {
      console.log('❌ Username and password are required');
      process.exit(1);
    }

    // Connect to MongoDB
    const adminUri = `mongodb://${adminUsername}:${adminPassword}@${host}:${port}/admin`;
    console.log('\n🔌 Connecting to MongoDB...');
    
    const client = new MongoClient(adminUri);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    // Create database and user
    const adminDb = client.db('admin');
    
    try {
      // Create user
      await adminDb.command({
        createUser: username,
        pwd: password,
        roles: [
          {
            role: 'readWrite',
            db: dbName
          }
        ]
      });
      console.log(`✅ User '${username}' created successfully`);
    } catch (error) {
      if (error.code === 51003) {
        console.log(`⚠️  User '${username}' already exists`);
      } else {
        throw error;
      }
    }

    // Test connection with new user
    console.log('\n🧪 Testing connection with new user...');
    const testUri = `mongodb://${username}:${password}@${host}:${port}/${dbName}`;
    const testClient = new MongoClient(testUri);
    await testClient.connect();
    console.log('✅ Connection test successful');

    // Create a test collection to verify permissions
    const testDb = testClient.db(dbName);
    await testDb.createCollection('test');
    await testDb.collection('test').insertOne({ test: true });
    await testDb.collection('test').drop();
    console.log('✅ Database permissions verified');

    await testClient.close();
    await client.close();

    console.log('\n🎉 MongoDB setup completed successfully!');
    console.log('\n📝 Add these values to your .env file:');
    console.log(`MONGODB_USERNAME=${username}`);
    console.log(`MONGODB_PASSWORD=${password}`);
    console.log(`MONGODB_HOST=${host}`);
    console.log(`MONGODB_PORT=${port}`);
    console.log(`MONGODB_DB_NAME=${dbName}`);
    console.log(`MONGODB_URI=mongodb://${username}:${password}@${host}:${port}/${dbName}`);

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run setup
setupMongoDB().catch(console.error);
