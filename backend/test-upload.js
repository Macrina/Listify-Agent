import fs from 'fs';
import path from 'path';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Test suite for image upload functionality
 */
class UploadTester {
  constructor() {
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Upload Tests...\n');
    
    await this.testBackendHealth();
    await this.testUploadEndpoint();
    await this.testInvalidFileUpload();
    await this.testImageAnalysis();
    
    this.printResults();
  }

  async testBackendHealth() {
    console.log('1️⃣ Testing backend health...');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 5000
      });
      
      if (response.status === 200) {
        this.addResult('✅ Backend Health Check', 'PASSED', 'Backend is responding');
      } else {
        this.addResult('❌ Backend Health Check', 'FAILED', `Unexpected status: ${response.status}`);
      }
    } catch (error) {
      this.addResult('❌ Backend Health Check', 'FAILED', `Connection error: ${error.message}`);
    }
  }

  async testUploadEndpoint() {
    console.log('2️⃣ Testing upload endpoint...');
    
    try {
      // Create a test image file
      const testImagePath = await this.createTestImage();
      
      const formData = new FormData();
      formData.append('image', fs.createReadStream(testImagePath));
      
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000
      });
      
      if (response.status === 200 && response.data.success) {
        this.addResult('✅ Upload Endpoint', 'PASSED', `Successfully uploaded and analyzed image`);
      } else {
        this.addResult('❌ Upload Endpoint', 'FAILED', `Unexpected response: ${JSON.stringify(response.data)}`);
      }
      
      // Clean up test file
      fs.unlinkSync(testImagePath);
      
    } catch (error) {
      this.addResult('❌ Upload Endpoint', 'FAILED', `Upload error: ${error.message}`);
      if (error.response) {
        console.log('   Response data:', error.response.data);
      }
    }
  }

  async testInvalidFileUpload() {
    console.log('3️⃣ Testing invalid file upload...');
    
    try {
      const formData = new FormData();
      formData.append('image', 'not-a-file');
      
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 10000
      });
      
      this.addResult('❌ Invalid File Upload', 'FAILED', 'Should have rejected invalid file');
      
    } catch (error) {
      if (error.response && error.response.status === 400) {
        this.addResult('✅ Invalid File Upload', 'PASSED', 'Correctly rejected invalid file');
      } else {
        this.addResult('❌ Invalid File Upload', 'FAILED', `Unexpected error: ${error.message}`);
      }
    }
  }

  async testImageAnalysis() {
    console.log('4️⃣ Testing image analysis service...');
    
    try {
      // Test with a simple text input first
      const response = await axios.post(`${API_BASE_URL}/analyze-text`, {
        text: "1. Buy milk\n2. Buy bread\n3. Buy eggs"
      }, {
        timeout: 15000
      });
      
      if (response.status === 200 && response.data.success) {
        this.addResult('✅ Image Analysis Service', 'PASSED', 'Text analysis working');
      } else {
        this.addResult('❌ Image Analysis Service', 'FAILED', `Text analysis failed: ${JSON.stringify(response.data)}`);
      }
      
    } catch (error) {
      this.addResult('❌ Image Analysis Service', 'FAILED', `Analysis error: ${error.message}`);
      if (error.response) {
        console.log('   Response data:', error.response.data);
      }
    }
  }

  async createTestImage() {
    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // RGB
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, // compressed data
      0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0x00, 0x00, // end
      0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, // IEND chunk
      0x60, 0x82
    ]);
    
    const testImagePath = path.join(process.cwd(), 'test-image.png');
    fs.writeFileSync(testImagePath, testImageBuffer);
    return testImagePath;
  }

  addResult(test, status, message) {
    this.testResults.push({ test, status, message });
    console.log(`   ${status}: ${message}`);
  }

  printResults() {
    console.log('\n📊 Test Results Summary:');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    
    this.testResults.forEach(result => {
      console.log(`${result.status} ${result.test}: ${result.message}`);
    });
    
    console.log('='.repeat(50));
    console.log(`Total: ${this.testResults.length} | Passed: ${passed} | Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\n🔧 Recommendations:');
      console.log('1. Check if backend server is running on port 3001');
      console.log('2. Verify environment variables are set correctly');
      console.log('3. Check backend logs for errors');
      console.log('4. Ensure all dependencies are installed');
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new UploadTester();
  tester.runAllTests().catch(console.error);
}

export default UploadTester;
