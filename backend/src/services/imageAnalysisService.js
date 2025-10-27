import openai from '../config/openai.js';
import fs from 'fs';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import { launchOptimizedBrowser, navigateWithFallback } from '../utils/puppeteerConfig.js';

/**
 * Analyzes an image and extracts list items using OpenAI Vision
 * @param {Buffer|string} imageData - Image buffer or file path
 * @param {string} mimeType - MIME type of the image
 * @returns {Promise<Array>} - Array of extracted list items
 */
export async function analyzeImage(imageData, mimeType = 'image/jpeg') {
  try {
    console.log('Starting image analysis with:', {
      isBuffer: Buffer.isBuffer(imageData),
      mimeType: mimeType,
      dataSize: Buffer.isBuffer(imageData) ? imageData.length : 'N/A'
    });

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

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      max_tokens: 2000,
      temperature: 0.2,
    });

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
    
    return validItems;

  } catch (error) {
    console.error('Error in analyzeImage:', error);
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
    console.log('Starting text analysis');

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

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.2,
    });

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
    
    return validItems;

  } catch (error) {
    console.error('Error in analyzeText:', error);
    throw error;
  }
}

/**
 * Fallback function to analyze links using fetch instead of Puppeteer
 * @param {string} url - URL to analyze
 * @returns {Promise<Array>} - Array of extracted list items
 */
async function analyzeLinkWithFetch(url) {
  try {
    console.log('Using fetch-based link analysis for:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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

    const response_openai = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const rawOutput = response_openai.choices[0].message.content;
    console.log('OpenAI response received for link analysis.');

    let extractedItems = [];
    try {
      const parsed = JSON.parse(rawOutput);
      extractedItems = parsed.items || [];
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
    return itemsWithMetadata;

  } catch (error) {
    console.error('Error in fetch-based link analysis:', error);
    throw error;
  }
}

/**
 * Analyzes a URL and extracts list items from the webpage
 * @param {string} url - URL to analyze
 * @returns {Promise<Array>} - Array of extracted list items
 */
export async function analyzeLink(url) {
  try {
    console.log('Starting link analysis for:', url);

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

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.2,
      });

      const content_response = response.choices[0].message.content;
      console.log('Link analysis response:', content_response);

      // Parse the JSON response
      let extractedItems = [];
      try {
        const jsonMatch = content_response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          extractedItems = JSON.parse(jsonMatch[0]);
        } else {
          extractedItems = JSON.parse(content_response);
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
        source_type: 'url',
        metadata: {
          analysis_timestamp: new Date().toISOString(),
          url: url,
          content_length: textContent.length
        }
      }));

      console.log(`Successfully extracted ${validItems.length} items from URL`);
      
      return validItems;

    } catch (pageError) {
      await browser.close();
      throw pageError;
    }

  } catch (error) {
    console.error('Error in analyzeLink:', error);
    throw error;
  }
}