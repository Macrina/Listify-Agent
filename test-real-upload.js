import fs from 'fs';
import path from 'path';
import axios from 'axios';

/**
 * Test script for real image upload
 * This script will help test the upload functionality with a real image
 */
class RealUploadTester {
  constructor() {
    this.apiBaseUrl = 'http://localhost:3001/api';
  }

  async testWithRealImage(imagePath) {
    console.log('🧪 Testing with real image...\n');
    
    if (!fs.existsSync(imagePath)) {
      console.error(`❌ Image file not found: ${imagePath}`);
      return;
    }

    try {
      // Test 1: Health check
      console.log('1️⃣ Testing backend health...');
      const healthResponse = await axios.get(`${this.apiBaseUrl}/health`);
      console.log('   ✅ Backend is healthy:', healthResponse.data.message);

      // Test 2: Upload image
      console.log('\n2️⃣ Testing image upload...');
      const formData = new FormData();
      formData.append('image', fs.createReadStream(imagePath));

      const uploadResponse = await axios.post(`${this.apiBaseUrl}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000 // 60 seconds timeout for image analysis
      });

      if (uploadResponse.data.success) {
        console.log('   ✅ Upload successful!');
        console.log(`   📊 Extracted ${uploadResponse.data.data?.items?.length || 0} items`);
        console.log('   📝 Response:', JSON.stringify(uploadResponse.data, null, 2));
      } else {
        console.log('   ❌ Upload failed:', uploadResponse.data.error);
      }

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      if (error.response) {
        console.error('   Response data:', error.response.data);
      }
    }
  }

  async testTextAnalysis() {
    console.log('\n3️⃣ Testing text analysis...');
    
    try {
      const testText = "Shopping List:\n1. Buy milk\n2. Buy bread\n3. Buy eggs\n4. Buy apples";
      
      const response = await axios.post(`${this.apiBaseUrl}/analyze-text`, {
        text: testText
      }, {
        timeout: 30000
      });

      if (response.data.success) {
        console.log('   ✅ Text analysis successful!');
        console.log(`   📊 Extracted ${response.data.data?.items?.length || 0} items`);
        console.log('   📝 Response:', JSON.stringify(response.data, null, 2));
      } else {
        console.log('   ❌ Text analysis failed:', response.data.error);
      }

    } catch (error) {
      console.error('   ❌ Text analysis error:', error.message);
      if (error.response) {
        console.error('   Response data:', error.response.data);
      }
    }
  }

  async runTests(imagePath = null) {
    console.log('🚀 Real Upload Test Suite');
    console.log('='.repeat(50));
    
    if (imagePath) {
      await this.testWithRealImage(imagePath);
    } else {
      console.log('ℹ️  No image path provided. Skipping image upload test.');
      console.log('   To test with an image, run: node test-real-upload.js /path/to/image.png');
    }
    
    await this.testTextAnalysis();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Test suite completed!');
    
    if (!imagePath) {
      console.log('\n💡 To test image upload:');
      console.log('   node test-real-upload.js /path/to/your/image.png');
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new RealUploadTester();
  const imagePath = process.argv[2];
  tester.runTests(imagePath).catch(console.error);
}

export default RealUploadTester;
