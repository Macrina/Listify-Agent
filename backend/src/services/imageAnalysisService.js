import openai from '../config/openai.js';
import fs from 'fs';

/**
 * Analyzes an image and extracts list items using OpenAI Vision
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<Array>} - Array of extracted list items
 */
export async function analyzeImage(imagePath) {
  try {
    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // Determine the image type
    const imageType = imagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

    // Create the prompt for list extraction
    const prompt = `You are an expert at extracting and structuring information from images.

Analyze this image and extract ALL visible list items, tasks, notes, or structured information.

For EACH item you find, provide:
- item_name: The main text/title of the item (required)
- category: Choose the most appropriate category from: groceries, tasks, contacts, events, inventory, ideas, recipes, shopping, bills, other
- quantity: Any number or quantity mentioned (if visible, otherwise null)
- priority: Estimate priority as "low", "medium", or "high" based on context clues (urgency words, checkboxes, highlighting, etc.)
- notes: Any additional details, context, or descriptions

Return ONLY a valid JSON array of objects. Each object must have the structure described above.

Example format:
[
  {
    "item_name": "Buy milk",
    "category": "groceries",
    "quantity": "2 gallons",
    "priority": "medium",
    "notes": "Prefer organic"
  }
]

If no list items are found, return an empty array: []`;

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
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
      ],
      max_tokens: 2000,
      temperature: 0.2, // Lower temperature for more consistent structured output
    });

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
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      throw new Error('Failed to parse list items from image. Please try again with a clearer image.');
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
      priority: item.priority || 'medium',
      notes: item.notes || null,
    }));

    return validatedItems;

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
    const prompt = `Extract list items from the following text and structure them.

Text: "${text}"

For EACH item, provide:
- item_name: The main text/title of the item (required)
- category: Choose from: groceries, tasks, contacts, events, inventory, ideas, recipes, shopping, bills, other
- quantity: Any number or quantity mentioned (if visible, otherwise null)
- priority: Estimate priority as "low", "medium", or "high"
- notes: Any additional details

Return ONLY a valid JSON array of objects.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
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
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const extractedItems = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);

    // Validate and normalize
    const validatedItems = extractedItems.map(item => ({
      item_name: item.item_name || item.name || 'Unnamed item',
      category: item.category || 'other',
      quantity: item.quantity || null,
      priority: item.priority || 'medium',
      notes: item.notes || null,
    }));

    return validatedItems;

  } catch (error) {
    console.error('Error in analyzeText:', error);
    throw error;
  }
}
