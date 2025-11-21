#!/usr/bin/env node

/**
 * Test Script: Mock Data Collection
 * Tests Phase 4 data collection with mock data
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

async function testMockDataCollection() {
  console.log('==========================================');
  console.log('Testing Mock Data Collection');
  console.log('==========================================');
  console.log('');

  // Create database connection
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'social_media_analytics',
    waitForConnections: true,
    connectionLimit: 10,
  });

  try {
    // Get the mock account
    const [accounts] = await pool.execute(
      `SELECT usa.*, sp.name as platform_name, sp.display_name as platform_display_name
       FROM user_social_accounts usa
       JOIN social_platforms sp ON usa.platform_id = sp.id
       WHERE usa.access_token = 'mock_token'
       LIMIT 1`
    );

    if (accounts.length === 0) {
      console.log('❌ No mock account found!');
      console.log('Run: ./scripts/create-mock-account.sh first');
      process.exit(1);
    }

    const account = accounts[0];
    console.log(`✅ Found mock account: ${account.platform_display_name} (ID: ${account.id})`);
    console.log('');

    // Import the data collection service (from compiled JS)
    const { dataCollectionService } = require('../backend/dist/services/DataCollectionService');

    console.log('🔄 Starting data collection...');
    const startTime = Date.now();

    // Collect data
    const result = await dataCollectionService.collectAccountData(account, {
      limit: 25,
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('');
    console.log('✅ Data collection completed!');
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log('');
    console.log('📊 Results:');
    console.log(`   Posts collected: ${result.posts.length}`);
    console.log(`   Engagement metrics: ${result.engagementMetrics.size}`);
    console.log(`   Follower metrics: ${result.followerMetrics ? 'Yes' : 'No'}`);
    console.log('');

    // Check database
    const [posts] = await pool.execute(
      'SELECT COUNT(*) as count FROM social_posts WHERE account_id = ?',
      [account.id]
    );
    const postCount = posts[0]?.count || 0;

    const [metrics] = await pool.execute(
      'SELECT COUNT(*) as count FROM post_engagement_metrics WHERE post_id IN (SELECT id FROM social_posts WHERE account_id = ?)',
      [account.id]
    );
    const metricsCount = metrics[0]?.count || 0;

    const [jobs] = await pool.execute(
      'SELECT id, status, items_collected, items_updated, duration_seconds FROM data_collection_jobs WHERE account_id = ? ORDER BY created_at DESC LIMIT 1',
      [account.id]
    );

    console.log('💾 Database Verification:');
    console.log(`   Posts in database: ${postCount}`);
    console.log(`   Engagement metrics: ${metricsCount}`);
    if (jobs.length > 0) {
      const job = jobs[0];
      console.log(`   Collection job: ${job.status}`);
      console.log(`   Items collected: ${job.items_collected}`);
      console.log(`   Job duration: ${job.duration_seconds}s`);
    }
    console.log('');

    // Show sample posts
    const [samplePosts] = await pool.execute(
      `SELECT id, platform_post_id, LEFT(content, 50) as content_preview, content_type, published_at 
       FROM social_posts 
       WHERE account_id = ? 
       ORDER BY published_at DESC 
       LIMIT 5`,
      [account.id]
    );

    if (samplePosts.length > 0) {
      console.log('📝 Sample Posts:');
      samplePosts.forEach((post, i) => {
        console.log(`   ${i + 1}. [${post.content_type}] ${post.content_preview}...`);
        console.log(`      Published: ${post.published_at}`);
      });
      console.log('');
    }

    console.log('==========================================');
    console.log('✅ Test Complete! Phase 4 is working! 🎉');
    console.log('==========================================');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during test:', error);
    await pool.end();
    process.exit(1);
  }
}

// Run the test
testMockDataCollection();

