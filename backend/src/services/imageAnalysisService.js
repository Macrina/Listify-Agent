import openai from '../config/openai.js';
import fs from 'fs';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import { launchOptimizedBrowser, navigateWithFallback } from '../utils/puppeteerConfig.js';
import { trace, context } from '@opentelemetry/api';
import { 
  createLLMSpan, 
  addLLMInputMessages, 
  addLLMOutputMessages, 
  setSpanStatus, 
  recordSpanException,
  addSpanMetadata,
  addSpanTags,
  addGraphAttributes,
  SpanKinds,
  SpanAttributes
} from '../utils/tracing.js';

/**
 * Analyzes an image and extracts list items using OpenAI Vision
 * @param {Buffer|string} imageData - Image buffer or file path
 * @param {string} mimeType - MIME type of the image
 * @param {Span} parentSpan - Optional parent span from API request context
 * @returns {Promise<Array>} - Array of extracted list items
 */
export async function analyzeImage(imageData, mimeType = 'image/jpeg', parentSpan = null) {
  // Get active context - use parent span if provided
  const activeContext = parentSpan 
    ? trace.setSpan(context.active(), parentSpan)
    : context.active();
  
  const tracer = trace.getTracer('listify-agent', '1.0.0');
  
  // Create agent span for image analysis - linked to parent span
  const agentSpan = tracer.startSpan('listify-agent.image-analysis', {
    attributes: {
      [SpanAttributes.OPENINFERENCE_SPAN_KIND]: SpanKinds.AGENT,
      [SpanAttributes.INPUT_MIME_TYPE]: mimeType,
      'operation.type': 'image_analysis',
      'operation.category': 'ai_vision',
      'agent.name': 'listify-agent',
      'agent.version': '1.0.0',
      'service.name': 'listify-agent',
      'service.version': '1.0.0'
    }
  }, activeContext);

  // Add graph attributes for agent visualization
  addGraphAttributes(agentSpan, 'image_analyzer', null, 'Image Analyzer');

  try {
    console.log('Starting image analysis with:', {
      isBuffer: Buffer.isBuffer(imageData),
      mimeType: mimeType,
      dataSize: Buffer.isBuffer(imageData) ? imageData.length : 'N/A'
    });

    // Add input attributes
    agentSpan.setAttribute('input.image_size_bytes', Buffer.isBuffer(imageData) ? imageData.length : 0);
    agentSpan.setAttribute('input.image_size_mb', Buffer.isBuffer(imageData) ? Math.round(imageData.length / (1024 * 1024) * 100) / 100 : 0);
    agentSpan.setAttribute('input.format', mimeType.split('/')[-1] || 'unknown');

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

    // Call OpenAI Vision API
    console.log('Calling OpenAI Vision API...');
    
    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${imageType};base64,${base64Image}`,
              detail: 'high'
            }
          }
        ]
      }
    ];

    // Create LLM span for OpenAI Vision call
    const llmSpan = createLLMSpan('openai.vision.completion', 'gpt-4o', prompt, {
      [SpanAttributes.LLM_TEMPERATURE]: 0.2,
      [SpanAttributes.LLM_MAX_TOKENS]: 2000,
      'llm.provider': 'openai',
      'llm.task': 'vision_analysis',
      'llm.response_format': 'json_object'
    }, agentSpan);

    // Add graph attributes for LLM visualization
    addGraphAttributes(llmSpan, 'vision_llm', 'image_analyzer', 'Vision LLM');

    // Add input messages
    addLLMInputMessages(llmSpan, messages);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      max_tokens: 2000,
      temperature: 0.2,
    });

    // Add LLM response attributes
    llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_PROMPT, response.usage.prompt_tokens);
    llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_COMPLETION, response.usage.completion_tokens);
    llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_TOTAL, response.usage.total_tokens);
    llmSpan.setAttribute('llm.response_length', response.choices[0].message.content.length);
    llmSpan.setAttribute('llm.finish_reason', response.choices[0].finish_reason);

    // Add output messages
    addLLMOutputMessages(llmSpan, [response.choices[0].message]);
    setSpanStatus(llmSpan, true);
    llmSpan.end();

    console.log('OpenAI Vision API response received');
    console.log('Token usage:', response.usage);

    const content = response.choices[0].message.content;
    console.log('Raw response:', content);

    // Parse the JSON response
    let extractedItems = [];
    try {
      // Clean the response to extract JSON
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        extractedItems = JSON.parse(jsonMatch[0]);
      } else {
        console.warn('No JSON array found in response, trying to parse entire content');
        extractedItems = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.log('Raw content:', content);
      
      // Fallback: try to extract items manually
      extractedItems = [];
    }

    // Validate and clean the extracted items
    const validItems = extractedItems.filter(item => {
      return item && 
             typeof item.item_name === 'string' && 
             item.item_name.trim().length > 0;
    }).map(item => ({
      item_name: item.item_name.trim(),
      category: item.category || 'other',
      quantity: item.quantity || null,
      notes: item.notes || null,
      explanation: item.explanation || null,
      source_type: 'photo',
      metadata: {
        analysis_timestamp: new Date().toISOString(),
        image_type: imageType,
        confidence: 'high'
      }
    }));

    console.log(`Successfully extracted ${validItems.length} items from image`);
    
    // Add output attributes to agent span
    agentSpan.setAttribute('output.item_count', validItems.length);
    agentSpan.setAttribute('output.success', true);
    agentSpan.setAttribute('output.categories', JSON.stringify([...new Set(validItems.map(item => item.category))]));
    agentSpan.setAttribute('output.total_items', validItems.length);
    agentSpan.setAttribute('output.summary', `Successfully extracted ${validItems.length} items from image`);
    
    if (validItems.length > 0) {
      agentSpan.setAttribute('output.sample_items', JSON.stringify(validItems.slice(0, 3).map(item => item.item_name)));
    }

    // Add metadata
    addSpanMetadata(agentSpan, {
      analysis_timestamp: new Date().toISOString(),
      image_type: imageType,
      confidence: 'high'
    });

    setSpanStatus(agentSpan, true);
    agentSpan.end();
    
    return validItems;

  } catch (error) {
    console.error('Error in analyzeImage:', error);
    
    // Record error in span
    recordSpanException(agentSpan, error, {
      'output.success': false,
      'output.item_count': 0,
      'error.context': 'image_analysis'
    });
    agentSpan.end();
    
    throw error;
  }
}

/**
 * Analyzes text input and extracts list items
 * @param {string} text - Text to analyze
 * @returns {Promise<Array>} - Array of extracted list items
 */
export async function analyzeText(text, parentSpan = null) {
  // Get active context - use parent span if provided
  const activeContext = parentSpan 
    ? trace.setSpan(context.active(), parentSpan)
    : context.active();
  
  const tracer = trace.getTracer('listify-agent', '1.0.0');
  
  // Create agent span for text analysis - linked to parent span
  const agentSpan = tracer.startSpan('listify-agent.text-analysis', {
    attributes: {
      [SpanAttributes.OPENINFERENCE_SPAN_KIND]: SpanKinds.AGENT,
      'operation.type': 'text_analysis',
      'operation.category': 'ai_text',
      'agent.name': 'listify-agent',
      'agent.version': '1.0.0',
      'service.name': 'listify-agent',
      'service.version': '1.0.0'
    }
  }, activeContext);

  // Add graph attributes for agent visualization
  addGraphAttributes(agentSpan, 'text_analyzer', null, 'Text Analyzer');

  try {
    console.log('Starting text analysis');

    // Add input attributes
    agentSpan.setAttribute('input.text_length', text.length);
    agentSpan.setAttribute('input.text_preview', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
    agentSpan.setAttribute('input.word_count', text.split(/\s+/).length);

    const prompt = `You are an expert at extracting and structuring information from text.

Analyze this text and extract ALL list items, tasks, notes, or structured information.

For EACH item you find, provide:
- item_name: The main text/title of the item (required)
- category: Choose the most appropriate category from: groceries, tasks, contacts, events, inventory, ideas, recipes, shopping, bills, other
- quantity: Any number or quantity mentioned (if visible, otherwise null)
- notes: Any additional details, context, or descriptions
- explanation: A short, helpful explanation of what this item is or why it might be useful (1-2 sentences)

Return ONLY a valid JSON array of objects. Each object must have the structure described above.

Text to analyze:
${text}

If no list items are found, return an empty array: []`;

    // Create LLM span for OpenAI text completion
    const llmSpan = createLLMSpan('openai.text.completion', 'gpt-4o', prompt, {
      [SpanAttributes.LLM_TEMPERATURE]: 0.2,
      [SpanAttributes.LLM_MAX_TOKENS]: 2000,
      'llm.provider': 'openai',
      'llm.task': 'text_analysis',
      'llm.response_format': 'json_object'
    }, agentSpan);

    // Add graph attributes for LLM visualization
    addGraphAttributes(llmSpan, 'text_llm', 'text_analyzer', 'Text LLM');

    // Add input messages
    const messages = [{ role: 'user', content: prompt }];
    addLLMInputMessages(llmSpan, messages);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      max_tokens: 2000,
      temperature: 0.2,
    });

    // Add LLM response attributes
    llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_PROMPT, response.usage.prompt_tokens);
    llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_COMPLETION, response.usage.completion_tokens);
    llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_TOTAL, response.usage.total_tokens);
    llmSpan.setAttribute('llm.response_length', response.choices[0].message.content.length);
    llmSpan.setAttribute('llm.finish_reason', response.choices[0].finish_reason);

    // Add output messages
    addLLMOutputMessages(llmSpan, [response.choices[0].message]);
    setSpanStatus(llmSpan, true);
    llmSpan.end();

    const content = response.choices[0].message.content;
    console.log('Text analysis response:', content);

    // Parse the JSON response
    let extractedItems = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        extractedItems = JSON.parse(jsonMatch[0]);
      } else {
        extractedItems = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      extractedItems = [];
    }

    // Validate and clean the extracted items
    const validItems = extractedItems.filter(item => {
      return item && 
             typeof item.item_name === 'string' && 
             item.item_name.trim().length > 0;
    }).map(item => ({
      item_name: item.item_name.trim(),
      category: item.category || 'other',
      quantity: item.quantity || null,
      notes: item.notes || null,
      explanation: item.explanation || null,
      source_type: 'text',
      metadata: {
        analysis_timestamp: new Date().toISOString(),
        text_length: text.length
      }
    }));

    console.log(`Successfully extracted ${validItems.length} items from text`);
    
    // Add output attributes to agent span
    agentSpan.setAttribute('output.item_count', validItems.length);
    agentSpan.setAttribute('output.success', true);
    agentSpan.setAttribute('output.categories', JSON.stringify([...new Set(validItems.map(item => item.category))]));
    agentSpan.setAttribute('output.total_items', validItems.length);
    agentSpan.setAttribute('output.summary', `Successfully extracted ${validItems.length} items from text`);
    
    if (validItems.length > 0) {
      agentSpan.setAttribute('output.sample_items', JSON.stringify(validItems.slice(0, 3).map(item => item.item_name)));
    }

    // Add metadata
    addSpanMetadata(agentSpan, {
      analysis_timestamp: new Date().toISOString(),
      text_length: text.length,
      confidence: 'high'
    });

    setSpanStatus(agentSpan, true);
    agentSpan.end();
    
    return validItems;

  } catch (error) {
    console.error('Error in analyzeText:', error);
    
    // Record error in span
    recordSpanException(agentSpan, error, {
      'output.success': false,
      'output.item_count': 0,
      'error.context': 'text_analysis'
    });
    agentSpan.end();
    
    throw error;
  }
}

       /**
 * Fallback function to analyze links using fetch instead of Puppeteer
        * @param {string} url - URL to analyze
 * @returns {Promise<Array>} - Array of extracted list items
 */
async function analyzeLinkWithFetch(url) {
  // Create agent span for fetch-based link analysis
  const agentSpan = createAgentSpan('listify-agent.link-analysis-fetch', {
    'operation.type': 'link_analysis',
    'operation.category': 'web_scraping',
    'operation.method': 'fetch',
    'agent.name': 'listify-agent',
    'agent.version': '1.0.0',
    'service.name': 'listify-agent',
    'service.version': '1.0.0'
  });

  // Add graph attributes for agent visualization
  addGraphAttributes(agentSpan, 'link_analyzer_fetch', null, 'Link Analyzer (Fetch)');

  try {
    console.log('Using fetch-based link analysis for:', url);

    // Add input attributes
    agentSpan.setAttribute('input.url', url);
    agentSpan.setAttribute('input.method', 'fetch');
    agentSpan.setAttribute('input.fallback', true);
               
               const response = await fetch(url, {
                 headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
               });
               
               if (!response.ok) {
                 if (response.status === 403) {
                   throw new Error('Access denied: The website blocked our request. Please try a different URL or check if the site allows automated access.');
                 } else if (response.status === 404) {
                   throw new Error('Page not found: The URL does not exist or is no longer available.');
                 } else if (response.status === 429) {
                   throw new Error('Rate limited: Too many requests. Please try again later.');
                 } else if (response.status >= 500) {
                   throw new Error('Server error: The website is experiencing issues. Please try again later.');
                 } else {
                   throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                 }
               }
               
               const html = await response.text();
               const $ = cheerio.load(html);
               
    // Extract text content
    const textContent = $('body').text().replace(/\s+/g, ' ').trim();
    
    console.log('Page content extracted via fetch, length:', textContent.length);
    
    // Analyze the text content using OpenAI
    const prompt = `You are an expert at extracting and structuring information from web page content.

Analyze this web page content and extract ALL list items, tasks, notes, or structured information.

For EACH item you find, provide:
- item_name: The main text/title of the item (required)
- category: Choose the most appropriate category from: groceries, tasks, contacts, events, inventory, ideas, recipes, shopping, bills, other
- quantity: Any number or quantity mentioned (if visible, otherwise null)
- notes: Any additional details, context, or descriptions
- explanation: A short, helpful explanation of what this item is or why it might be useful (1-2 sentences)

Return ONLY a valid JSON array of objects. Each object must have the structure described above.

Web page content:
${textContent.substring(0, 4000)} // Limit content to avoid token limits

If no list items are found, return an empty array: []`;

    // Create LLM span for OpenAI text completion
    const llmSpan = createLLMSpan('openai.text.completion', 'gpt-4o', prompt, {
      [SpanAttributes.LLM_TEMPERATURE]: 0.2,
      [SpanAttributes.LLM_MAX_TOKENS]: 2000,
      'llm.provider': 'openai',
      'llm.task': 'web_content_analysis',
      'llm.response_format': 'json_object'
    }, agentSpan);

    // Add graph attributes for LLM visualization
    addGraphAttributes(llmSpan, 'web_content_llm', 'link_analyzer_fetch', 'Web Content LLM');

    // Add input messages
    const messages = [{ role: 'user', content: prompt }];
    addLLMInputMessages(llmSpan, messages);

    const response_openai = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
      messages: messages,
    });

    // Add LLM response attributes
    llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_PROMPT, response_openai.usage.prompt_tokens);
    llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_COMPLETION, response_openai.usage.completion_tokens);
    llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_TOTAL, response_openai.usage.total_tokens);
    llmSpan.setAttribute('llm.response_length', response_openai.choices[0].message.content.length);
    llmSpan.setAttribute('llm.finish_reason', response_openai.choices[0].finish_reason);

    // Add output messages
    addLLMOutputMessages(llmSpan, [response_openai.choices[0].message]);
    setSpanStatus(llmSpan, true);
    llmSpan.end();

    const rawOutput = response_openai.choices[0].message.content;
    console.log('OpenAI response received for link analysis.');

    let extractedItems = [];
    try {
      const parsed = JSON.parse(rawOutput);
      
      // Handle both array and object responses
      if (Array.isArray(parsed)) {
        extractedItems = parsed;
      } else if (parsed.items && Array.isArray(parsed.items)) {
        extractedItems = parsed.items;
      } else if (parsed.data && Array.isArray(parsed.data)) {
        extractedItems = parsed.data;
      } else {
        console.error('Unexpected JSON structure in fetch response:', parsed);
        extractedItems = [];
      }
      
      if (!Array.isArray(extractedItems)) {
        throw new Error('Expected an array of items from LLM output.');
      }
    } catch (parseError) {
      console.error('Failed to parse LLM output as JSON:', rawOutput, parseError);
      throw new Error('LLM returned invalid JSON format.');
    }

    // Add source metadata
    const itemsWithMetadata = extractedItems.map(item => ({
      ...item,
      source_type: 'url',
      source_reference: url,
      metadata: {
        analysis_timestamp: new Date().toISOString(),
        analysis_method: 'fetch',
        content_length: textContent.length
      }
    }));

    console.log(`Successfully extracted ${itemsWithMetadata.length} items from URL using fetch method.`);
    
    // Add output attributes to agent span
    agentSpan.setAttribute('output.item_count', itemsWithMetadata.length);
    agentSpan.setAttribute('output.success', true);
    agentSpan.setAttribute('output.categories', JSON.stringify([...new Set(itemsWithMetadata.map(item => item.category))]));
    agentSpan.setAttribute('output.total_items', itemsWithMetadata.length);
    agentSpan.setAttribute('output.summary', `Successfully extracted ${itemsWithMetadata.length} items from URL using fetch`);
    
    if (itemsWithMetadata.length > 0) {
      agentSpan.setAttribute('output.sample_items', JSON.stringify(itemsWithMetadata.slice(0, 3).map(item => item.item_name)));
    }

    // Add metadata
    addSpanMetadata(agentSpan, {
      analysis_timestamp: new Date().toISOString(),
      analysis_method: 'fetch',
      content_length: textContent.length,
      url: url
    });

    setSpanStatus(agentSpan, true);
    agentSpan.end();
    
    return itemsWithMetadata;
           
         } catch (error) {
    console.error('Error in fetch-based link analysis:', error);
    
    // Record error in span
    recordSpanException(agentSpan, error, {
      'output.success': false,
      'output.item_count': 0,
      'error.context': 'link_analysis_fetch'
    });
    agentSpan.end();
    
    throw error;
         }
       }

       /**
 * Analyzes a URL and extracts list items from the webpage
        * @param {string} url - URL to analyze
        * @returns {Promise<Array>} - Array of extracted list items
        */
export async function analyzeLink(url, parentSpan = null) {
  // Get active context - use parent span if provided
  const activeContext = parentSpan 
    ? trace.setSpan(context.active(), parentSpan)
    : context.active();
  
  const tracer = trace.getTracer('listify-agent', '1.0.0');
  
  // Create agent span for link analysis - linked to parent span
  const agentSpan = tracer.startSpan('listify-agent.link-analysis', {
    attributes: {
      [SpanAttributes.OPENINFERENCE_SPAN_KIND]: SpanKinds.AGENT,
      'operation.type': 'link_analysis',
      'operation.category': 'web_scraping',
      'operation.method': 'puppeteer',
      'agent.name': 'listify-agent',
      'agent.version': '1.0.0',
      'service.name': 'listify-agent',
      'service.version': '1.0.0'
    }
  }, activeContext);

  // Add graph attributes for agent visualization
  addGraphAttributes(agentSpan, 'link_analyzer', null, 'Link Analyzer');

  try {
    console.log('Starting link analysis for:', url);

    // Add input attributes
    agentSpan.setAttribute('input.url', url);
    agentSpan.setAttribute('input.method', 'puppeteer');
           
           // Validate URL
           try {
             new URL(url);
           } catch (urlError) {
             throw new Error('Invalid URL format');
           }

    // Try to launch browser with fallback handling
    let browser, page;
    try {
      const browserConfig = await launchOptimizedBrowser();
      browser = browserConfig.browser;
      page = browserConfig.page;
    } catch (puppeteerError) {
      console.warn('⚠️ Puppeteer failed to launch, falling back to fetch-based analysis:', puppeteerError.message);
      return await analyzeLinkWithFetch(url);
    }

    try {
      // Navigate to the URL with fallback
      await navigateWithFallback(page, url);
      
      // Wait for content to load
      await page.waitForTimeout(2000);
      
      // Get page content
      const content = await page.content();
      const $ = cheerio.load(content);
      
      // Extract text content
      const textContent = $('body').text().replace(/\s+/g, ' ').trim();
      
      console.log('Page content extracted, length:', textContent.length);
      
      // Close browser
             await browser.close();
             
      // Analyze the text content
      const prompt = `You are an expert at extracting and structuring information from web page content.

Analyze this web page content and extract ALL list items, tasks, notes, or structured information.

For EACH item you find, provide:
- item_name: The main text/title of the item (required)
- category: Choose the most appropriate category from: groceries, tasks, contacts, events, inventory, ideas, recipes, shopping, bills, other
- quantity: Any number or quantity mentioned (if visible, otherwise null)
- notes: Any additional details, context, or descriptions
- explanation: A short, helpful explanation of what this item is or why it might be useful (1-2 sentences)

Return ONLY a valid JSON array of objects. Each object must have the structure described above.

Web page content:
${textContent.substring(0, 8000)} // Limit content length

If no list items are found, return an empty array: []`;

      // Create LLM span for OpenAI text completion
      const llmSpan = createLLMSpan('openai.text.completion', 'gpt-4o', prompt, {
        [SpanAttributes.LLM_TEMPERATURE]: 0.2,
        [SpanAttributes.LLM_MAX_TOKENS]: 2000,
        'llm.provider': 'openai',
        'llm.task': 'web_content_analysis',
        'llm.response_format': 'json_object'
      }, agentSpan);

      // Add graph attributes for LLM visualization
      addGraphAttributes(llmSpan, 'web_content_llm', 'link_analyzer', 'Web Content LLM');

      // Add input messages
      const messages = [{ role: 'user', content: prompt }];
      addLLMInputMessages(llmSpan, messages);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
        messages: messages,
      max_tokens: 2000,
      temperature: 0.2,
    });

      // Add LLM response attributes
      llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_PROMPT, response.usage.prompt_tokens);
      llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_COMPLETION, response.usage.completion_tokens);
      llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_TOTAL, response.usage.total_tokens);
      llmSpan.setAttribute('llm.response_length', response.choices[0].message.content.length);
      llmSpan.setAttribute('llm.finish_reason', response.choices[0].finish_reason);

      // Add output messages
      addLLMOutputMessages(llmSpan, [response.choices[0].message]);
      setSpanStatus(llmSpan, true);
      llmSpan.end();

      const content_response = response.choices[0].message.content;
      console.log('Link analysis response:', content_response);

      // Parse the JSON response
      let extractedItems = [];
      try {
        const parsed = JSON.parse(content_response);
        
        // Handle both array and object responses
        if (Array.isArray(parsed)) {
          extractedItems = parsed;
        } else if (parsed.items && Array.isArray(parsed.items)) {
          extractedItems = parsed.items;
        } else if (parsed.data && Array.isArray(parsed.data)) {
          extractedItems = parsed.data;
        } else {
          console.error('Unexpected JSON structure:', parsed);
          extractedItems = [];
        }
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        // Try to extract array from string if JSON parsing fails
        try {
          const jsonMatch = content_response.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            extractedItems = JSON.parse(jsonMatch[0]);
          }
        } catch (fallbackError) {
          console.error('Fallback parsing also failed:', fallbackError);
          extractedItems = [];
        }
      }

      // Validate and clean the extracted items
      const validItems = extractedItems.filter(item => {
        return item && 
               typeof item.item_name === 'string' && 
               item.item_name.trim().length > 0;
      }).map(item => ({
        item_name: item.item_name.trim(),
      category: item.category || 'other',
      quantity: item.quantity || null,
      notes: item.notes || null,
      explanation: item.explanation || null,
        source_type: 'url',
      metadata: {
          analysis_timestamp: new Date().toISOString(),
        url: url,
          content_length: textContent.length
      }
    }));

      console.log(`Successfully extracted ${validItems.length} items from URL`);
      
      // Add output attributes to agent span
      agentSpan.setAttribute('output.item_count', validItems.length);
      agentSpan.setAttribute('output.success', true);
      agentSpan.setAttribute('output.categories', JSON.stringify([...new Set(validItems.map(item => item.category))]));
      agentSpan.setAttribute('output.total_items', validItems.length);
      agentSpan.setAttribute('output.summary', `Successfully extracted ${validItems.length} items from URL using Puppeteer`);
      
      if (validItems.length > 0) {
        agentSpan.setAttribute('output.sample_items', JSON.stringify(validItems.slice(0, 3).map(item => item.item_name)));
      }

      // Add metadata
      addSpanMetadata(agentSpan, {
        analysis_timestamp: new Date().toISOString(),
        analysis_method: 'puppeteer',
        content_length: textContent.length,
        url: url
      });

      setSpanStatus(agentSpan, true);
      agentSpan.end();
      
      return validItems;

    } catch (pageError) {
      console.error('Error during Puppeteer page operations, falling back to fetch:', pageError);
      if (browser) {
        await browser.close();
      }
      
      // Record error in span
      recordSpanException(agentSpan, pageError, {
        'output.success': false,
        'output.item_count': 0,
        'error.context': 'link_analysis_puppeteer',
        'error.fallback': true
      });
      agentSpan.end();
      
      return await analyzeLinkWithFetch(url);
    }

  } catch (error) {
    console.error('Error in analyzeLink:', error);
    
    // Record error in span
    recordSpanException(agentSpan, error, {
      'output.success': false,
      'output.item_count': 0,
      'error.context': 'link_analysis'
    });
    agentSpan.end();
    
    throw error;
  }
}