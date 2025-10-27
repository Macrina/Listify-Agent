/**
 * Optimized Puppeteer Configuration for Listify Agent
 * Handles performance warnings and provides optimal settings for different environments
 */

import puppeteer from 'puppeteer';

/**
 * Get optimized Puppeteer launch options based on environment
 */
export const getPuppeteerConfig = () => {
  const isAppleSilicon = process.platform === 'darwin' && process.arch === 'arm64';
  const isIntelMac = process.platform === 'darwin' && process.arch === 'x64';
  const isRender = process.env.RENDER === 'true' || process.env.NODE_ENV === 'production';
  
  // Log performance warnings if needed
  if (isAppleSilicon && process.arch !== 'arm64') {
    console.warn('⚠️  Performance Warning: Running Puppeteer on Apple Silicon with x64 Node.js may cause performance issues.');
    console.warn('💡 Consider using ARM64 Node.js for better performance: nvm install node --latest-npm');
  }

  const baseArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor',
    '--disable-extensions',
    '--disable-plugins',
    '--disable-images',
    '--disable-javascript',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-background-networking',
    '--disable-sync',
    '--disable-default-apps',
    '--disable-translate',
    '--hide-scrollbars',
    '--mute-audio',
    '--no-default-browser-check',
    '--no-pings',
    '--memory-pressure-off'
  ];

  // Add architecture-specific optimizations
  if (isAppleSilicon) {
    baseArgs.push('--single-process'); // Better for Apple Silicon
  } else {
    baseArgs.push('--max_old_space_size=4096'); // Better for Intel
  }

  // Render-specific configuration
  if (isRender) {
    baseArgs.push('--single-process');
    baseArgs.push('--disable-dev-shm-usage');
    baseArgs.push('--no-sandbox');
    baseArgs.push('--disable-setuid-sandbox');
  }

  const config = {
    headless: true,
    args: baseArgs,
    timeout: 30000,
    protocolTimeout: 30000,
    ignoreDefaultArgs: ['--disable-extensions'],
    ignoreHTTPSErrors: true,
  };

  // Set executable path based on environment
  if (isAppleSilicon && !isRender) {
    config.executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  } else if (isRender) {
    // On Render, let Puppeteer find Chrome automatically
    // The postinstall script will install Chrome to the correct location
    console.log('🔧 Using Render-optimized Puppeteer configuration');
  }

  return config;
};

/**
 * Get optimized page configuration
 */
export const getPageConfig = () => ({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  viewport: { width: 1280, height: 720 },
  navigationTimeout: 30000,
  defaultTimeout: 30000
});

/**
 * Launch browser with optimized configuration
 */
export const launchOptimizedBrowser = async () => {
  const config = getPuppeteerConfig();
  const browser = await puppeteer.launch(config);
  
  const page = await browser.newPage();
  const pageConfig = getPageConfig();
  
  // Apply page configuration
  await page.setUserAgent(pageConfig.userAgent);
  await page.setViewport(pageConfig.viewport);
  page.setDefaultNavigationTimeout(pageConfig.navigationTimeout);
  page.setDefaultTimeout(pageConfig.defaultTimeout);
  
  return { browser, page };
};

/**
 * Navigate with fallback strategies
 */
export const navigateWithFallback = async (page, url) => {
  const strategies = [
    { waitUntil: 'domcontentloaded', timeout: 20000 },
    { waitUntil: 'load', timeout: 15000 },
    { waitUntil: 'networkidle0', timeout: 10000 }
  ];

  for (let i = 0; i < strategies.length; i++) {
    try {
      console.log(`Navigation attempt ${i + 1}/${strategies.length}...`);
      await page.goto(url, strategies[i]);
      console.log('✅ Navigation successful');
      return true;
    } catch (error) {
      console.log(`❌ Navigation attempt ${i + 1} failed:`, error.message);
      if (i === strategies.length - 1) {
        console.log('All navigation attempts failed, proceeding with current content...');
        return false;
      }
    }
  }
  
  return false;
};

export default {
  getPuppeteerConfig,
  getPageConfig,
  launchOptimizedBrowser,
  navigateWithFallback
};
