import openai from '../config/openai.js';
import fs from 'fs';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import { launchOptimizedBrowser, navigateWithFallback } from '../utils/puppeteerConfig.js';
import { 
  createAgentSpan, 
  createLLMSpan, 
  createToolSpan, 
  addLLMInputMessages, 
  addLLMOutputMessages,
  setSpanStatus,
  recordSpanException,
  addSpanMetadata,
  addSpanTags,
  SpanKinds,
  withSpan
} from '../utils/tracing-mcp.js';
import { ArizeAgentMetadata } from '../utils/arizeAgentMetadata.js';
import ArizeEvaluationService from '../evaluations/arizeEvaluationService.js';

/**
 * Analyzes an image and extracts list items using OpenAI Vision
 * @param {Buffer|string} imageData - Image buffer or file path
 * @param {string} mimeType - MIME type of the image
 * @returns {Promise<Array>} - Array of extracted list items
 */
export async function analyzeImage(imageData, mimeType = 'image/jpeg') {
  // Initialize evaluation service and agent metadata
  const evaluationService = new ArizeEvaluationService();
  const agentMetadata = new ArizeAgentMetadata();
  
  // Create orchestrator span for the entire image analysis workflow
  const orchestratorSpan = agentMetadata.createOrchestratorSpan('image-analysis', {
    'workflow.input_type': 'image',
    'workflow.input_format': mimeType,
    'workflow.data_type': Buffer.isBuffer(imageData) ? 'buffer' : 'file_path',
    'workflow.data_size': Buffer.isBuffer(imageData) ? imageData.length : 'unknown'
  });

  try {
    console.log('Starting image analysis with:', {
      isBuffer: Buffer.isBuffer(imageData),
      mimeType: mimeType,
      dataSize: Buffer.isBuffer(imageData) ? imageData.length : 'N/A'
    });

    // Step 1: Image preprocessing
    const preprocessingSpan = agentMetadata.createProcessingNodeSpan(
      'image-preprocessing',
      'image-analysis_orchestrator',
      {
        'processing.step': 'image_preprocessing',
        'processing.input_type': Buffer.isBuffer(imageData) ? 'buffer' : 'file_path'
      }
    );

    let imageBuffer;
    if (Buffer.isBuffer(imageData)) {
      // Buffer from memory storage (production)
      console.log('Processing buffer data (production)');
      imageBuffer = imageData;
    } else {
      // File path from disk storage (development)
      console.log('Processing file path (development):', imageData);
      imageBuffer = fs.readFileSync(imageData);
    }
    
    const base64Image = imageBuffer.toString('base64');
    console.log('Image converted to base64, length:', base64Image.length);

    // Use provided mimeType or determine from file extension
    const imageType = mimeType || (typeof imageData === 'string' && imageData.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
    console.log('Using image type:', imageType);

    agentMetadata.completeSpan(preprocessingSpan, true, 'Image preprocessing completed', {
      'output.base64_length': base64Image.length,
      'output.image_type': imageType
    });

    // Create the prompt for list extraction
    const prompt = `You are an expert at extracting and structuring information from images.

Analyze this image and extract ALL visible list items, tasks, notes, or structured information.

For EACH item you find, provide:
- item_name: The main text/title of the item (required)
- category: Choose the most appropriate category from: groceries, tasks, contacts, events, inventory, ideas, recipes, shopping, bills, other
- quantity: Any number or quantity mentioned (if visible, otherwise null)
- notes: Any additional details, context, or descriptions
- explanation: A short, helpful explanation of what this item is or why it might be useful (1-2 sentences)

Return ONLY a valid JSON array of objects. Each object must have the structure described above.

Example format:
[
  {
    "item_name": "Buy milk",
    "category": "groceries",
    "quantity": "2 gallons",
    "notes": "Prefer organic",
    "explanation": "Essential dairy product for daily nutrition and cooking needs."
  }
]

If no list items are found, return an empty array: []`;

    // Step 2: LLM Analysis
    console.log('Calling OpenAI Vision API...');
    
    const llmAnalysisSpan = agentMetadata.createProcessingNodeSpan(
      'llm-analysis',
      'image-analysis_orchestrator',
      {
        'processing.step': 'llm_analysis',
        'llm.model': 'gpt-4o',
        'llm.temperature': 0.2,
        'llm.max_tokens': 2000,
        'input.image.mime_type': imageType,
        'input.image.size': base64Image.length
      }
    );

    // Create LLM span for OpenAI Vision call
    const llmSpan = createLLMSpan('openai-vision-analysis', 'gpt-4o', prompt, {
      'llm.temperature': 0.2,
      'llm.max_tokens': 2000,
      'llm.model_version': 'gpt-4o',
      'input.mime_type': 'text/plain',
      'input.image.mime_type': imageType,
      'input.image.size': base64Image.length
    });

    // Add input messages to span
    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${imageType};base64,${base64Image}`,
            },
          },
        ],
      },
    ];
    addLLMInputMessages(llmSpan, messages);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      max_tokens: 2000,
      temperature: 0.2, // Lower temperature for more consistent structured output
    });
    console.log('OpenAI API response received');

    // Add output messages to LLM span
    const outputMessages = [
      {
        role: 'assistant',
        content: response.choices[0].message.content,
      },
    ];
    addLLMOutputMessages(llmSpan, outputMessages);

    // Add token usage to span
    if (response.usage) {
      llmSpan.setAttribute('llm.token_count.prompt', response.usage.prompt_tokens);
      llmSpan.setAttribute('llm.token_count.completion', response.usage.completion_tokens);
      llmSpan.setAttribute('llm.token_count.total', response.usage.total_tokens);
    }

    // Extract and parse the response
    const content = response.choices[0].message.content;

    // Try to extract JSON from the response
    let extractedItems;
    try {
      // Look for JSON array in the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        extractedItems = JSON.parse(jsonMatch[0]);
      } else {
        extractedItems = JSON.parse(content);
      }
      
      // Set LLM span output and status
      llmSpan.setAttribute('output.value', JSON.stringify(extractedItems));
      setSpanStatus(llmSpan, true);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      recordSpanException(llmSpan, parseError, {
        'error.stage': 'json_parsing',
        'llm.response.content': content.substring(0, 500) // Truncate for logging
      });
      throw new Error('Failed to parse list items from image. Please try again with a clearer image.');
    } finally {
      llmSpan.end();
    }

    // Validate the extracted items
    if (!Array.isArray(extractedItems)) {
      throw new Error('Invalid response format from AI');
    }

    // Ensure each item has required fields and set defaults
    const validatedItems = extractedItems.map(item => ({
      item_name: item.item_name || item.name || 'Unnamed item',
      category: item.category || 'other',
      quantity: item.quantity || null,
      notes: item.notes || null,
      explanation: item.explanation || null,
    }));

    // Complete LLM analysis span
    agentMetadata.completeSpan(llmAnalysisSpan, true, 'LLM analysis completed successfully', {
      'output.items_found': validatedItems.length,
      'output.categories': [...new Set(validatedItems.map(item => item.category))],
      'output.response_length': content.length
    });

    // Step 3: Quality evaluation
    const evaluationSpan = agentMetadata.createProcessingNodeSpan(
      'quality-evaluation',
      'image-analysis_orchestrator',
      {
        'processing.step': 'quality_evaluation',
        'evaluation.items_count': validatedItems.length
      }
    );
    
    try {
      // Evaluate the image analysis
      const evaluationResult = await evaluationService.evaluateImageAnalysis(
        'Analyze this image and extract list items',
        JSON.stringify(validatedItems),
        validatedItems
      );

      // Log evaluation to Arize
      await evaluationService.logEvaluationToArize(evaluationResult, {
        'analysis.items_found': validatedItems.length,
        'analysis.categories': [...new Set(validatedItems.map(item => item.category))],
        'analysis.source': 'image_upload'
      });

      agentMetadata.completeSpan(evaluationSpan, true, 'Quality evaluation completed', {
        'evaluation.overall_score': evaluationResult.overall_score,
        'evaluation.has_hallucinations': evaluationResult.has_hallucinations
      });

      console.log(`📊 Image analysis evaluation: Overall score ${evaluationResult.overall_score}/5`);

    } catch (evalError) {
      console.error('Evaluation failed:', evalError);
      agentMetadata.completeSpan(evaluationSpan, false, `Evaluation failed: ${evalError.message}`);
    }

    // Complete orchestrator span with success
    agentMetadata.completeSpan(orchestratorSpan, true, 'Image analysis workflow completed successfully', {
      'workflow.items_extracted': validatedItems.length,
      'workflow.categories_found': [...new Set(validatedItems.map(item => item.category))],
      'workflow.success': true
    });

    return validatedItems;

  } catch (error) {
    console.error('Error in analyzeImage:', error);
    
    // Complete orchestrator span with error
    agentMetadata.completeSpan(orchestratorSpan, false, `Image analysis workflow failed: ${error.message}`, {
      'workflow.error_type': error.constructor.name,
      'workflow.error_message': error.message,
      'workflow.success': false
    });
    
    throw error;
  }
}

/**
 * Analyzes text input and extracts list items
 * @param {string} text - Text to analyze
 * @returns {Promise<Array>} - Array of extracted list items
 */
export async function analyzeText(text) {
  try {
    const prompt = `Extract list items from the following text and structure them.

Text: "${text}"

For EACH item, provide:
- item_name: The main text/title of the item (required)
- category: Choose from: groceries, tasks, contacts, events, inventory, ideas, recipes, shopping, bills, other
- quantity: Any number or quantity mentioned (if visible, otherwise null)
- notes: Any additional details
- explanation: A short, helpful explanation of what this item is or why it might be useful (1-2 sentences)

Return ONLY a valid JSON array of objects.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1500,
      temperature: 0.2,
    });

    const content = response.choices[0].message.content;

    // Parse JSON from response
    let extractedItems;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        extractedItems = JSON.parse(jsonMatch[0]);
      } else {
        extractedItems = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      throw new Error('Failed to parse list items from text. Please try again with clearer text.');
    }

    // Validate the extracted items
    if (!Array.isArray(extractedItems)) {
      throw new Error('Invalid response format from AI');
    }

    // Validate and normalize
    const validatedItems = extractedItems.map(item => ({
      item_name: item.item_name || item.name || 'Unnamed item',
      category: item.category || 'other',
      quantity: item.quantity || null,
      notes: item.notes || null,
      explanation: item.explanation || null,
    }));

    return validatedItems;

  } catch (error) {
    console.error('Error in analyzeText:', error);
    throw error;
  }
}

       /**
        * Fallback method to extract content using simple HTTP request
        * @param {string} url - URL to analyze
        * @returns {Promise<Object>} - Object with title and content
        */
       async function fetchContentFallback(url) {
         try {
           console.log('Using fallback HTTP method for:', url);
           
           // Try multiple user agents to avoid blocking
           const userAgents = [
             'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
             'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
             'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
             'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
             'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0'
           ];
           
           let lastError;
           
           for (const userAgent of userAgents) {
             try {
               console.log(`Trying with user agent: ${userAgent.substring(0, 50)}...`);
               
               const response = await fetch(url, {
                 headers: {
                   'User-Agent': userAgent,
                   'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                   'Accept-Language': 'en-US,en;q=0.5',
                   'Accept-Encoding': 'gzip, deflate, br',
                   'DNT': '1',
                   'Connection': 'keep-alive',
                   'Upgrade-Insecure-Requests': '1',
                   'Sec-Fetch-Dest': 'document',
                   'Sec-Fetch-Mode': 'navigate',
                   'Sec-Fetch-Site': 'none',
                   'Cache-Control': 'max-age=0'
                 },
                 timeout: 15000,
                 redirect: 'follow',
                 follow: 5
               });
               
               if (!response.ok) {
                 throw new Error(`HTTP ${response.status}: ${response.statusText}`);
               }
               
               const html = await response.text();
               const $ = cheerio.load(html);
               
               // Remove script and style elements
               $('script, style, nav, header, footer, aside').remove();
               
               const title = $('title').text().trim();
               const content = $('main, article, .content, .post, .entry, body').text().trim();
               
               console.log(`Successfully fetched content with user agent: ${userAgent.substring(0, 30)}...`);
               return { title, content };
               
             } catch (error) {
               console.log(`Failed with user agent ${userAgent.substring(0, 30)}...: ${error.message}`);
               lastError = error;
               continue;
             }
           }
           
           // If all user agents failed, throw the last error
           throw lastError;
           
         } catch (error) {
           console.error('Fallback HTTP method failed:', error);
           throw new Error(`HTTP ${error.message.includes('HTTP') ? error.message.split('HTTP ')[1].split(':')[0] : '403'}: ${error.message.includes('HTTP') ? error.message.split(': ')[1] : 'Forbidden'}`);
         }
       }

       /**
        * Analyzes a URL and extracts list items from web content
        * @param {string} url - URL to analyze
        * @returns {Promise<Array>} - Array of extracted list items
        */
       export async function analyzeLink(url) {
         try {
           console.log('Analyzing URL:', url);
           
           // Validate URL
           try {
             new URL(url);
           } catch (urlError) {
             throw new Error('Invalid URL format');
           }

           let title, content;
           
          // Try Puppeteer first, fallback to HTTP request if it fails
          try {
            console.log('Attempting Puppeteer navigation...');
            
            // Suppress Puppeteer performance warnings
            process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';
            process.env.PUPPETEER_SKIP_DOWNLOAD = 'true';
            
            // Check architecture and provide performance guidance
            const isAppleSilicon = process.platform === 'darwin' && process.arch === 'arm64';
            const isIntelMac = process.platform === 'darwin' && process.arch === 'x64';
            const isRunningUnderRosetta = process.platform === 'darwin' && process.arch === 'x64' && process.env.ARCH === 'i386';
            
            if (isAppleSilicon && process.arch !== 'arm64') {
              console.warn('⚠️  Performance Warning: Running Puppeteer on Apple Silicon with x64 Node.js may cause performance issues.');
              console.warn('💡 Consider using ARM64 Node.js for better performance: nvm install node --latest-npm');
            } else if (isRunningUnderRosetta) {
              console.warn('⚠️  Performance Warning: Running under Rosetta translation may cause performance issues.');
              console.warn('💡 For optimal performance, install ARM64 Node.js: brew install node');
            } else if (isIntelMac) {
              console.log('✅ Running on Intel Mac - performance should be optimal');
            }
             
            // Launch browser with optimized configuration for better performance
            const browser = await puppeteer.launch({
              headless: true,
              // Suppress Puppeteer performance warnings
              ignoreDefaultArgs: ['--disable-extensions', '--disable-background-timer-throttling'],
              args: [
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
                // Performance optimizations
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
                '--single-process', // Use single process for better performance
                '--memory-pressure-off',
                '--max_old_space_size=4096' // Increase memory limit
              ],
              // Additional performance options
              timeout: 30000, // 30 second timeout
              protocolTimeout: 30000,
              ignoreDefaultArgs: ['--disable-extensions'],
              ignoreHTTPSErrors: true
            });
       
             const page = await browser.newPage();
             
             // Set user agent to avoid blocking
             await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
             
             // Set viewport for consistent rendering
             await page.setViewport({ width: 1280, height: 720 });
             
             // Set page timeouts for better performance
             page.setDefaultNavigationTimeout(30000);
             page.setDefaultTimeout(30000);
             
             // Navigate to the URL with better timeout handling
             try {
               await page.goto(url, { 
                 waitUntil: 'domcontentloaded',
                 timeout: 20000 
               });
             } catch (navError) {
               console.log('Navigation failed, trying with load event...');
               try {
                 await page.goto(url, { 
                   waitUntil: 'load',
                   timeout: 10000 
                 });
               } catch (secondError) {
                 console.log('Second navigation attempt failed, proceeding with current content...');
                 // Continue with whatever content we have
               }
             }
       
             // Get page content
             const pageContent = await page.content();
             await browser.close();
             
             // Parse HTML with cheerio
             const $ = cheerio.load(pageContent);
             
             // Remove script and style elements
             $('script, style, nav, header, footer, aside').remove();
             
             title = $('title').text().trim();
             content = $('main, article, .content, .post, .entry, body').text().trim();
             
           } catch (puppeteerError) {
             console.log('Puppeteer failed, using fallback method:', puppeteerError.message);
             const fallbackResult = await fetchContentFallback(url);
             title = fallbackResult.title;
             content = fallbackResult.content;
           }
    
           // Clean up the text
           const cleanText = content
             .replace(/\s+/g, ' ')
             .replace(/\n+/g, ' ')
             .trim();
    
    // Limit content length to avoid token limits
    const maxLength = 8000;
    const truncatedContent = cleanText.length > maxLength 
      ? cleanText.substring(0, maxLength) + '...' 
      : cleanText;
    
          console.log('Extracted content length:', truncatedContent.length);
          console.log('Sample content:', truncatedContent.substring(0, 500));
    
    // Use OpenAI to analyze the content
    const prompt = `Analyze the following web page content and extract ALL list items, tasks, products, or structured information.

Page Title: "${title}"
Content: "${truncatedContent}"

For EACH item you find, provide:
- item_name: The main text/title of the item (required)
- category: Choose the most appropriate category from: groceries, tasks, contacts, events, inventory, ideas, recipes, shopping, bills, products, services, other
- quantity: Any number or quantity mentioned (if visible, otherwise null)
- notes: Any additional details, context, or descriptions
- explanation: A short, helpful explanation of what this item is or why it might be useful (1-2 sentences)

Focus on:
- Product listings
- Task lists
- Shopping items
- Event information
- Contact details
- Any structured data

Return ONLY a valid JSON array of objects. Each object must have the structure described above.

Example format:
[
  {
    "item_name": "iPhone 15 Pro",
    "category": "products",
    "quantity": "1",
    "notes": "Latest model with advanced camera",
    "explanation": "Apple's flagship smartphone with professional-grade camera system and titanium design."
  }
]

If no list items are found, return an empty array: []`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.2,
    });

    const aiContent = response.choices[0].message.content;

    // Parse JSON from response
    let extractedItems;
    try {
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        extractedItems = JSON.parse(jsonMatch[0]);
      } else {
        extractedItems = JSON.parse(aiContent);
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', aiContent);
      throw new Error('Failed to parse list items from web content. Please try again with a different URL.');
    }

    // Validate the extracted items
    if (!Array.isArray(extractedItems)) {
      throw new Error('Invalid response format from AI');
    }

    // Validate and normalize
    const validatedItems = extractedItems.map(item => ({
      item_name: item.item_name || item.name || 'Unnamed item',
      category: item.category || 'other',
      quantity: item.quantity || null,
      notes: item.notes || null,
      explanation: item.explanation || null,
      source_type: 'url', // Mark as URL source
      metadata: {
        url: url,
        title: title,
        extracted_at: new Date().toISOString()
      }
    }));

    console.log(`Extracted ${validatedItems.length} items from URL`);
    return validatedItems;

  } catch (error) {
    console.error('Error in analyzeLink:', error);
    throw error;
  }
}
