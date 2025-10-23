import UploadTester from './test-upload.js';
import AnalysisTester from './test-analysis.js';

/**
 * Comprehensive integration test suite
 */
class IntegrationTester {
  constructor() {
    this.results = {
      upload: null,
      analysis: null,
      overall: 'PENDING'
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Integration Tests...\n');
    console.log('='.repeat(60));
    
    try {
      // Test backend connectivity and upload functionality
      console.log('\n📤 Testing Upload Functionality...');
      const uploadTester = new UploadTester();
      await uploadTester.runAllTests();
      this.results.upload = uploadTester.testResults;
      
      console.log('\n' + '='.repeat(60));
      
      // Test analysis services
      console.log('\n🧠 Testing Analysis Services...');
      const analysisTester = new AnalysisTester();
      await analysisTester.runAllTests();
      this.results.analysis = analysisTester.testResults;
      
      this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ Integration test failed:', error);
      this.results.overall = 'FAILED';
    }
  }

  generateFinalReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 FINAL INTEGRATION TEST REPORT');
    console.log('='.repeat(60));
    
    const allTests = [...this.results.upload, ...this.results.analysis];
    const passed = allTests.filter(t => t.status === 'PASSED').length;
    const failed = allTests.filter(t => t.status === 'FAILED').length;
    
    console.log(`\n📊 Overall Results:`);
    console.log(`   Total Tests: ${allTests.length}`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    
    if (failed === 0) {
      this.results.overall = 'PASSED';
      console.log('\n🎉 All tests passed! The system is working correctly.');
    } else {
      this.results.overall = 'FAILED';
      console.log('\n⚠️  Some tests failed. Here are the issues:');
      
      const failedTests = allTests.filter(t => t.status === 'FAILED');
      failedTests.forEach((test, index) => {
        console.log(`\n${index + 1}. ${test.test}`);
        console.log(`   Issue: ${test.message}`);
      });
      
      this.generateRecommendations();
    }
    
    console.log('\n' + '='.repeat(60));
  }

  generateRecommendations() {
    console.log('\n🔧 Troubleshooting Recommendations:');
    console.log('-'.repeat(40));
    
    const hasBackendIssues = this.results.upload.some(t => t.status === 'FAILED' && t.test.includes('Backend'));
    const hasAnalysisIssues = this.results.analysis.some(t => t.status === 'FAILED' && t.test.includes('Analysis'));
    const hasEnvIssues = this.results.analysis.some(t => t.status === 'FAILED' && t.test.includes('Environment'));
    
    if (hasBackendIssues) {
      console.log('🔧 Backend Issues:');
      console.log('   1. Check if backend server is running: npm run backend:dev');
      console.log('   2. Verify port 3001 is not blocked');
      console.log('   3. Check backend logs for errors');
    }
    
    if (hasEnvIssues) {
      console.log('🔧 Environment Issues:');
      console.log('   1. Update .env file with real API keys');
      console.log('   2. Ensure OpenAI API key has credits');
      console.log('   3. Verify AgentDB credentials');
    }
    
    if (hasAnalysisIssues) {
      console.log('🔧 Analysis Issues:');
      console.log('   1. Check OpenAI API connectivity');
      console.log('   2. Verify image analysis service implementation');
      console.log('   3. Test with simpler inputs first');
    }
    
    console.log('\n🚀 Quick Fix Commands:');
    console.log('   # Restart backend:');
    console.log('   npm run backend:dev');
    console.log('   ');
    console.log('   # Check environment:');
    console.log('   cat .env');
    console.log('   ');
    console.log('   # Run individual tests:');
    console.log('   node backend/test-upload.js');
    console.log('   node backend/test-analysis.js');
  }
}

// Run integration tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new IntegrationTester();
  tester.runAllTests().catch(console.error);
}

export default IntegrationTester;
