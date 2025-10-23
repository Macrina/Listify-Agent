import { analyzeImage, analyzeText } from './src/services/imageAnalysisService.js';
import fs from 'fs';
import path from 'path';

/**
 * Test suite for image analysis functionality
 */
class AnalysisTester {
  constructor() {
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Analysis Tests...\n');
    
    await this.testEnvironmentVariables();
    await this.testTextAnalysis();
    await this.testImageAnalysis();
    await this.testInvalidInputs();
    
    this.printResults();
  }

  async testEnvironmentVariables() {
    console.log('1️⃣ Testing environment variables...');
    
    const requiredVars = [
      'OPENAI_API_KEY',
      'AGENTDB_API_KEY',
      'AGENTDB_TOKEN'
    ];
    
    let allPresent = true;
    const missing = [];
    
    for (const varName of requiredVars) {
      if (!process.env[varName] || process.env[varName].includes('your_')) {
        allPresent = false;
        missing.push(varName);
      }
    }
    
    if (allPresent) {
      this.addResult('✅ Environment Variables', 'PASSED', 'All required environment variables are set');
    } else {
      this.addResult('❌ Environment Variables', 'FAILED', `Missing or invalid variables: ${missing.join(', ')}`);
    }
  }

  async testTextAnalysis() {
    console.log('2️⃣ Testing text analysis...');
    
    try {
      const testTexts = [
        "1. Buy milk\n2. Buy bread\n3. Buy eggs",
        "Shopping list:\n- Apples\n- Bananas\n- Oranges",
        "Tasks:\n* Complete project\n* Send email\n* Review code"
      ];
      
      for (const text of testTexts) {
        const result = await analyzeText(text);
        
        if (Array.isArray(result) && result.length > 0) {
          this.addResult('✅ Text Analysis', 'PASSED', `Successfully analyzed text with ${result.length} items`);
          break; // Stop after first success
        }
      }
      
      if (!this.testResults.some(r => r.test === '✅ Text Analysis')) {
        this.addResult('❌ Text Analysis', 'FAILED', 'Failed to analyze any text inputs');
      }
      
    } catch (error) {
      this.addResult('❌ Text Analysis', 'FAILED', `Text analysis error: ${error.message}`);
    }
  }

  async testImageAnalysis() {
    console.log('3️⃣ Testing image analysis...');
    
    try {
      // Create a test image with text
      const testImagePath = await this.createTestImageWithText();
      
      const result = await analyzeImage(testImagePath);
      
      if (Array.isArray(result) && result.length > 0) {
        this.addResult('✅ Image Analysis', 'PASSED', `Successfully analyzed image with ${result.length} items`);
      } else {
        this.addResult('❌ Image Analysis', 'FAILED', 'Failed to extract items from image');
      }
      
      // Clean up test file
      fs.unlinkSync(testImagePath);
      
    } catch (error) {
      this.addResult('❌ Image Analysis', 'FAILED', `Image analysis error: ${error.message}`);
    }
  }

  async testInvalidInputs() {
    console.log('4️⃣ Testing invalid inputs...');
    
    try {
      // Test with empty text
      const emptyResult = await analyzeText('');
      if (Array.isArray(emptyResult) && emptyResult.length === 0) {
        this.addResult('✅ Invalid Inputs', 'PASSED', 'Correctly handled empty text input');
      } else {
        this.addResult('❌ Invalid Inputs', 'FAILED', 'Should return empty array for empty text');
      }
      
    } catch (error) {
      this.addResult('❌ Invalid Inputs', 'FAILED', `Error handling invalid inputs: ${error.message}`);
    }
  }

  async createTestImageWithText() {
    // Create a proper test image using a real image file
    // For now, let's skip the image test since we need a real image file
    // This test will be handled by the upload test with a real image
    const testImagePath = path.join(process.cwd(), 'test-image-with-text.png');
    
    // Create a minimal valid PNG file
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk header
      0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x20, // 32x32 pixels
      0x08, 0x06, 0x00, 0x00, 0x00, 0x73, 0x7A, 0x7A, // RGB, no alpha
      0xF4, 0x00, 0x00, 0x00, 0x04, 0x67, 0x41, 0x4D, // gAMA chunk
      0x41, 0x00, 0x00, 0xB1, 0x8F, 0x0B, 0xFC, 0x61, // gAMA data
      0x05, 0x00, 0x00, 0x00, 0x09, 0x70, 0x48, 0x59, // tIME chunk
      0x73, 0x00, 0x00, 0x0E, 0xC3, 0x00, 0x00, 0x0E, // tIME data
      0xC3, 0x01, 0xC7, 0x6F, 0xA8, 0x64, 0x00, 0x00, // continued
      0x00, 0x18, 0x74, 0x45, 0x58, 0x74, 0x53, 0x6F, // tEXt chunk
      0x66, 0x74, 0x77, 0x61, 0x72, 0x65, 0x00, 0x50, // Software
      0x61, 0x69, 0x6E, 0x74, 0x2E, 0x4E, 0x45, 0x54, // Paint.NET
      0x20, 0x76, 0x33, 0x2E, 0x35, 0x2E, 0x31, 0x32, // v3.5.12
      0x20, 0x74, 0x6F, 0x20, 0x42, 0x6D, 0x70, 0x00, // to Bmp
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
      0x42, 0x60, 0x82
    ]);
    
    fs.writeFileSync(testImagePath, pngHeader);
    return testImagePath;
  }

  addResult(test, status, message) {
    this.testResults.push({ test, status, message });
    console.log(`   ${status}: ${message}`);
  }

  printResults() {
    console.log('\n📊 Analysis Test Results Summary:');
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
      console.log('1. Check OpenAI API key is valid and has credits');
      console.log('2. Verify AgentDB credentials are correct');
      console.log('3. Check network connectivity');
      console.log('4. Review service implementation for bugs');
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new AnalysisTester();
  tester.runAllTests().catch(console.error);
}

export default AnalysisTester;
