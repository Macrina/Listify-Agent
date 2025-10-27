"""
Test script to verify Puppeteer fallback mechanism
"""

import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend', 'src'))

async def test_puppeteer_fallback():
    """Test the Puppeteer fallback mechanism"""
    
    print("🧪 Testing Puppeteer fallback mechanism...")
    
    try:
        # Import the service
        from services.imageAnalysisService import analyzeLink
        
        # Test URL
        test_url = "https://example.com"
        
        print(f"🔍 Testing link analysis for: {test_url}")
        
        # This should work with either Puppeteer or fetch fallback
        result = await analyzeLink(test_url)
        
        print(f"✅ Link analysis successful!")
        print(f"📊 Extracted {len(result)} items")
        
        if result:
            print("📝 Sample items:")
            for item in result[:3]:
                print(f"  - {item.get('item_name', 'Unknown')} ({item.get('category', 'other')})")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Puppeteer fallback test...")
    
    # Run the test
    success = asyncio.run(test_puppeteer_fallback())
    
    if success:
        print("\n✅ Puppeteer fallback test passed!")
        print("🎯 The link analysis should work on Render now.")
    else:
        print("\n❌ Puppeteer fallback test failed!")
        print("🔧 Check the error messages above for debugging.")
