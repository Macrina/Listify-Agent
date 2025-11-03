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
  SpanAttributes,
  createToolSpan
} from '../utils/tracing.js';

/**
 * Analyzes an image and extracts list items using OpenAI Vision
 * @param {Buffer|string} imageData - Image buffer or file path
 * @param {string} mimeType - MIME type of the image
 * @param {Span} parentSpan - Optional parent span from API request context
 * @returns {Promise<Array>} - Array of extracted list items
 */
export async function analyzeImage(imageData, mimeType = 'image/jpeg', parentSpan = null, parentNodeId = null) {
  // Get active context - use parent span if provided
  const activeContext = parentSpan 
    ? trace.setSpan(context.active(), parentSpan)
    : context.active();
  
  const tracer = trace.getTracer('listify-agent', '1.0.0');
  
  // Create agent span with descriptive naming for semantic analysis
  const agentSpan = tracer.startSpan('listify-agent.vision.semantic_analysis', {
    attributes: {
      [SpanAttributes.OPENINFERENCE_SPAN_KIND]: SpanKinds.AGENT,
      [SpanAttributes.INPUT_MIME_TYPE]: mimeType,
      'operation.type': 'semantic_analysis',
      'operation.method': 'openai_vision',
      'operation.category': 'ai_vision',
      'operation.task': 'list_extraction',
      'agent.name': 'listify-agent',
      'agent.version': '1.0.0',
      'service.name': 'listify-agent',
      'service.version': '1.0.0'
    }
  }, activeContext);

  // Add graph attributes for agent visualization - link to API request if available
  addGraphAttributes(agentSpan, 'vision_semantic_analyzer', parentNodeId, 'Vision Semantic Analyzer');

  // Track overall timing
  const overallStartTime = Date.now();
  const stageTimings = {};

  try {
    console.log('Starting image analysis with:', {
      isBuffer: Buffer.isBuffer(imageData),
      mimeType: mimeType,
      dataSize: Buffer.isBuffer(imageData) ? imageData.length : 'N/A'
    });

    // ============================================
    // STAGE 1: Image Preparation & Metadata Extraction
    // ============================================
    const prepStartTime = Date.now();
    const prepSpan = tracer.startSpan('listify-agent.vision.image_preparation', {
      attributes: {
        [SpanAttributes.OPENINFERENCE_SPAN_KIND]: SpanKinds.TOOL,
        'tool.name': 'image_preparation',
        'tool.operation': 'extract_metadata_and_encode'
      }
    }, trace.setSpan(context.active(), agentSpan));

    // Handle both memory storage (production) and disk storage (development)
    let imageBuffer;
    if (Buffer.isBuffer(imageData)) {
      // Buffer from memory storage (production)
      console.log('Processing buffer data (production)');
      imageBuffer = imageData;
      prepSpan.addEvent('source_type', { type: 'memory_buffer' });
    } else {
      // File path from disk storage (development)
      console.log('Processing file path (development):', imageData);
      imageBuffer = fs.readFileSync(imageData);
      prepSpan.addEvent('source_type', { type: 'file_path', path: imageData });
    }
    
    // Extract image metadata
    const imageSizeBytes = imageBuffer.length;
    const imageSizeMB = Math.round(imageSizeBytes / (1024 * 1024) * 100) / 100;
    const format = mimeType.split('/')[1] || 'unknown';
    
    // Try to get image dimensions (basic parsing for PNG/JPEG)
    let imageWidth = null;
    let imageHeight = null;
    let imageAspectRatio = null;
    
    try {
      if (format === 'png' && imageBuffer.length > 24) {
        // PNG dimensions are at bytes 16-23
        imageWidth = imageBuffer.readUInt32BE(16);
        imageHeight = imageBuffer.readUInt32BE(20);
      } else if ((format === 'jpeg' || format === 'jpg') && imageBuffer.length > 20) {
        // JPEG dimensions require parsing SOF marker
        let offset = 2; // Skip FF D8
        while (offset < imageBuffer.length - 8) {
          if (imageBuffer[offset] === 0xFF && (imageBuffer[offset + 1] >= 0xC0 && imageBuffer[offset + 1] <= 0xC3)) {
            // Found SOF marker
            imageHeight = imageBuffer.readUInt16BE(offset + 5);
            imageWidth = imageBuffer.readUInt16BE(offset + 7);
            break;
          }
          offset += 2 + imageBuffer.readUInt16BE(offset + 2);
        }
      }
      
      if (imageWidth && imageHeight) {
        imageAspectRatio = parseFloat((imageWidth / imageHeight).toFixed(2));
      }
    } catch (dimError) {
      // Dimension extraction failed - not critical
      console.log('Could not extract image dimensions:', dimError.message);
    }

    // Convert to base64 for API
    const base64Image = imageBuffer.toString('base64');
    const base64Length = base64Image.length;
    const base64SizeKB = Math.round(base64Length / 1024);
    
    // Use provided mimeType or determine from file extension
    const imageType = mimeType || (typeof imageData === 'string' && imageData.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
    
    // Add comprehensive image metadata to preparation span
    prepSpan.setAttribute('image.size_bytes', imageSizeBytes);
    prepSpan.setAttribute('image.size_mb', imageSizeMB);
    prepSpan.setAttribute('image.format', format);
    prepSpan.setAttribute('image.mime_type', imageType);
    prepSpan.setAttribute('image.base64_length', base64Length);
    prepSpan.setAttribute('image.base64_size_kb', base64SizeKB);
    
    if (imageWidth && imageHeight) {
      prepSpan.setAttribute('image.width', imageWidth);
      prepSpan.setAttribute('image.height', imageHeight);
      prepSpan.setAttribute('image.aspect_ratio', imageAspectRatio);
      prepSpan.setAttribute('image.resolution', `${imageWidth}x${imageHeight}`);
      prepSpan.setAttribute('image.pixels', imageWidth * imageHeight);
    }
    
    prepSpan.setAttribute('preparation.success', true);
    setSpanStatus(prepSpan, true);
    prepSpan.end();
    
    stageTimings.preparation = Date.now() - prepStartTime;
    agentSpan.addEvent('stage_complete', { stage: 'preparation', duration_ms: stageTimings.preparation });
    
    // Add all image metadata to agent span
    agentSpan.setAttribute('input.image_size_bytes', imageSizeBytes);
    agentSpan.setAttribute('input.image_size_mb', imageSizeMB);
    agentSpan.setAttribute('input.format', format);
    agentSpan.setAttribute('input.mime_type', imageType);
    if (imageWidth && imageHeight) {
      agentSpan.setAttribute('input.image_width', imageWidth);
      agentSpan.setAttribute('input.image_height', imageHeight);
      agentSpan.setAttribute('input.image_aspect_ratio', imageAspectRatio);
      agentSpan.setAttribute('input.image_resolution', `${imageWidth}x${imageHeight}`);
    }
    agentSpan.setAttribute('input.base64_size_kb', base64SizeKB);

    // ============================================
    // STAGE 2: Prompt Template & Configuration
    // ============================================
    const promptStartTime = Date.now();
    
    // Define prompt template with version tracking
    const promptTemplate = `You are an expert at extracting and structuring information from images.

Analyze this image and extract ALL visible list items, tasks, notes, or structured information.

For EACH item you find, provide:
- item_name: The main text/title of the item (required)
- category: Choose the most appropriate category from: groceries, tasks, contacts, events, inventory, ideas, recipes, shopping, bills, other
- quantity: Any number or quantity mentioned (if visible, otherwise null)
- notes: Any additional details, context, or descriptions
- explanation: A short, helpful explanation of what this item is or why it might be useful (1-2 sentences)

CRITICAL FORMATTING REQUIREMENTS:
1. You MUST return a valid JSON object with an "items" array property
2. Do NOT wrap your response in markdown code blocks
3. Do NOT use \`\`\`json or \`\`\` tags
4. Do NOT include any text before or after the JSON
5. Return ONLY valid JSON starting with { and ending with }
6. If no items found, return: {"items": []}

Example correct format:
{"items": [{"item_name": "Buy milk", "category": "groceries", "quantity": "2 gallons", "notes": "Prefer organic", "explanation": "Essential dairy product"}]}`;

    // Model configuration
    const modelConfig = {
      model: 'gpt-4o',
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
      image_detail: 'high'
    };

    // Store prompt template metadata
    agentSpan.setAttribute('prompt.template_version', 'v1.0');
    agentSpan.setAttribute('prompt.template_type', 'list_extraction');
    agentSpan.setAttribute('prompt.template_length', promptTemplate.length);
    agentSpan.setAttribute('prompt.has_examples', true);
    agentSpan.setAttribute('prompt.categories', JSON.stringify(['groceries', 'tasks', 'contacts', 'events', 'inventory', 'ideas', 'recipes', 'shopping', 'bills', 'other']));
    agentSpan.setAttribute('prompt.template_preview', promptTemplate.substring(0, 200) + '...');
    
    // Store model configuration
    agentSpan.setAttribute('model.name', modelConfig.model);
    agentSpan.setAttribute('model.temperature', modelConfig.temperature);
    agentSpan.setAttribute('model.max_tokens', modelConfig.max_tokens);
    agentSpan.setAttribute('model.response_format', JSON.stringify(modelConfig.response_format));
    agentSpan.setAttribute('model.image_detail', modelConfig.image_detail);
    
    stageTimings.prompt_preparation = Date.now() - promptStartTime;
    agentSpan.addEvent('stage_complete', { stage: 'prompt_preparation', duration_ms: stageTimings.prompt_preparation });

    // Call OpenAI Vision API
    console.log('Calling OpenAI Vision API...');
    
    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: promptTemplate
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${imageType};base64,${base64Image}`,
              detail: modelConfig.image_detail
            }
          }
        ]
      }
    ];

    // ============================================
    // STAGE 3: LLM API Call
    // ============================================
    const llmCallStartTime = Date.now();
    
    // Create LLM span with detailed naming
    const llmSpan = createLLMSpan('openai.vision.gpt4o.list_extraction', modelConfig.model, promptTemplate, {
      [SpanAttributes.LLM_TEMPERATURE]: modelConfig.temperature,
      [SpanAttributes.LLM_MAX_TOKENS]: modelConfig.max_tokens,
      'llm.provider': 'openai',
      'llm.task': 'vision_list_extraction',
      'llm.response_format': JSON.stringify(modelConfig.response_format),
      'llm.image_detail': modelConfig.image_detail,
      'llm.prompt_template_version': 'v1.0'
    }, agentSpan);

    // Add graph attributes for LLM visualization
    addGraphAttributes(llmSpan, 'vision_llm', 'image_analyzer', 'Vision LLM');

    // Add input messages
    addLLMInputMessages(llmSpan, messages);
    
    // Track API call attempt (for retry logic if needed)
    let apiCallAttempts = 1;
    const maxRetries = 3;
    let response;
    let apiCallSuccess = false;
    let apiCallError = null;
    
    agentSpan.addEvent('llm_call_start', {
      attempt: apiCallAttempts,
      model: modelConfig.model,
      timestamp: new Date().toISOString()
    });

    // Use response_format to enforce JSON output (reduces markdown wrapping and latency)
    try {
      response = await openai.chat.completions.create({
        model: modelConfig.model,
        messages: messages,
        max_tokens: modelConfig.max_tokens,
        temperature: modelConfig.temperature,
        response_format: modelConfig.response_format,
      });
      apiCallSuccess = true;
    } catch (apiError) {
      apiCallError = apiError;
      llmSpan.recordException(apiError);
      agentSpan.addEvent('llm_call_error', {
        attempt: apiCallAttempts,
        error: apiError.message,
        error_type: apiError.constructor.name
      });
      throw apiError; // Re-throw to be handled by outer try-catch
    }
    
    const llmCallDuration = Date.now() - llmCallStartTime;
    stageTimings.llm_call = llmCallDuration;
    agentSpan.addEvent('stage_complete', { 
      stage: 'llm_api_call', 
      duration_ms: llmCallDuration,
      success: apiCallSuccess
    });
    
    // Record retry information
    agentSpan.setAttribute('llm.retry.attempts', apiCallAttempts);
    agentSpan.setAttribute('llm.retry.max_attempts', maxRetries);
    agentSpan.setAttribute('llm.retry.success', apiCallSuccess);

    // Add LLM response attributes with cost calculation
    const promptTokens = response.usage.prompt_tokens;
    const completionTokens = response.usage.completion_tokens;
    const totalTokens = response.usage.total_tokens;
    
    // GPT-4o Vision pricing: $2.50 per 1M input tokens, $10.00 per 1M output tokens
    const inputCostPer1M = 2.50;
    const outputCostPer1M = 10.00;
    const cost = (promptTokens / 1_000_000) * inputCostPer1M + (completionTokens / 1_000_000) * outputCostPer1M;
    
    // Set all required OpenInference LLM attributes for Arize recognition
    // CRITICAL: These exact attribute names are required for Arize cost tracking
    llmSpan.setAttribute(SpanAttributes.LLM_MODEL_NAME, 'gpt-4o');
    llmSpan.setAttribute(SpanAttributes.LLM_PROVIDER, 'openai');
    llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_PROMPT, promptTokens);
    llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_COMPLETION, completionTokens);
    llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_TOTAL, totalTokens);
    
    // Set cost attributes using OpenInference semantic conventions
    // Note: Arize auto-calculates costs, but we set these for manual tracking
    const promptCost = (promptTokens / 1_000_000) * inputCostPer1M;
    const completionCost = (completionTokens / 1_000_000) * outputCostPer1M;
    llmSpan.setAttribute(SpanAttributes.LLM_COST_PROMPT, promptCost);
    llmSpan.setAttribute(SpanAttributes.LLM_COST_COMPLETION, completionCost);
    llmSpan.setAttribute(SpanAttributes.LLM_COST_TOTAL, cost);
    
    // Additional attributes for debugging and observability
    const outputContent = response.choices[0].message.content;
    const outputLength = outputContent.length;
    const finishReason = response.choices[0].finish_reason;
    
    llmSpan.setAttribute('llm.response_length', outputLength);
    llmSpan.setAttribute('llm.finish_reason', finishReason);
    llmSpan.setAttribute('llm.api_duration_ms', llmCallDuration);
    llmSpan.setAttribute('llm.tokens_per_second', Math.round(totalTokens / (llmCallDuration / 1000)));
    llmSpan.setAttribute('llm.prompt_tokens_per_kb', Math.round((promptTokens / base64SizeKB) * 10) / 10);
    
    // Token breakdown by stage (approximate)
    // Vision API tokens are mostly from image encoding
    const estimatedImageTokens = Math.round((base64Length / 4) * 0.75); // Base64 -> token estimation
    const textTokens = promptTokens - estimatedImageTokens;
    llmSpan.setAttribute('llm.token_breakdown.image_tokens_est', estimatedImageTokens);
    llmSpan.setAttribute('llm.token_breakdown.text_tokens', textTokens);
    llmSpan.setAttribute('llm.token_breakdown.completion_tokens', completionTokens);
    
    // CRITICAL: Set output.value for Arize to recognize this as an LLM span
    llmSpan.setAttribute(SpanAttributes.OUTPUT_VALUE, outputContent);

    // Add output messages (this also helps Arize recognize the span)
    addLLMOutputMessages(llmSpan, [response.choices[0].message]);
    
    // Record reasoning/processing events
    llmSpan.addEvent('response_received', {
      finish_reason: finishReason,
      content_length: outputLength,
      token_count: totalTokens
    });
    
    setSpanStatus(llmSpan, true);
    llmSpan.end();
    
    console.log(`📊 LLM Span: tokens=${totalTokens}, cost=$${cost.toFixed(6)}, prompt=${promptTokens}, completion=${completionTokens}`);

    console.log('OpenAI Vision API response received');
    console.log('Token usage:', response.usage);

    const content = outputContent;
    console.log('Raw response:', content.substring(0, 200) + '...');
    
    // ============================================
    // STAGE 4: Response Parsing & Validation
    // ============================================
    const parseStartTime = Date.now();
    const parseSpan = tracer.startSpan('listify-agent.vision.response_parsing', {
      attributes: {
        [SpanAttributes.OPENINFERENCE_SPAN_KIND]: SpanKinds.TOOL,
        'tool.name': 'json_parser',
        'tool.operation': 'extract_and_validate_items'
      }
    }, trace.setSpan(context.active(), agentSpan));

    // Parse the JSON response with detailed tracking
    let extractedItems = [];
    let parsingSuccess = false;
    let hadMarkdown = false;
    let parseError = null;
    
    try {
      // Remove markdown code blocks if present
      let cleanedContent = content.trim();
      const originalLength = cleanedContent.length;
      
      // Remove ```json or ``` code blocks
      if (cleanedContent.startsWith('```')) {
        hadMarkdown = true;
        cleanedContent = cleanedContent.replace(/^```(?:json)?\s*\n?/i, '');
        cleanedContent = cleanedContent.replace(/\n?```\s*$/i, '');
        cleanedContent = cleanedContent.trim();
      }
      
      parseSpan.setAttribute('parsing.markdown_detected', hadMarkdown);
      parseSpan.setAttribute('parsing.original_length', originalLength);
      parseSpan.setAttribute('parsing.cleaned_length', cleanedContent.length);
      parseSpan.setAttribute('parsing.length_reduction', originalLength - cleanedContent.length);
      
      // Try to parse as JSON
      let parsed;
      try {
        parsed = JSON.parse(cleanedContent);
      } catch (directParseError) {
        // Try parsing as array if object parse fails
        const jsonMatch = cleanedContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw directParseError;
        }
      }
      
      // Extract items from parsed JSON
      if (Array.isArray(parsed)) {
        extractedItems = parsed;
      } else if (parsed.items && Array.isArray(parsed.items)) {
        extractedItems = parsed.items;
      } else if (parsed.data && Array.isArray(parsed.data)) {
        extractedItems = parsed.data;
      } else {
        throw new Error('Unexpected JSON structure: no items array found');
      }
      
      parsingSuccess = true;
      parseSpan.setAttribute('parsing.success', true);
      parseSpan.setAttribute('parsing.items_extracted', extractedItems.length);
      parseSpan.setAttribute('parsing.json_structure', Array.isArray(parsed) ? 'direct_array' : 'object_with_items');
      
    } catch (error) {
      parseError = error;
      parsingSuccess = false;
      console.error('Failed to parse JSON response:', error);
      console.log('Raw content preview:', content.substring(0, 500));
      
      parseSpan.setAttribute('parsing.success', false);
      parseSpan.setAttribute('parsing.error', error.message);
      parseSpan.setAttribute('parsing.error_type', error.constructor.name);
      parseSpan.recordException(error);
      
      extractedItems = [];
    }
    
    const parseDuration = Date.now() - parseStartTime;
    stageTimings.parsing = parseDuration;
    parseSpan.setAttribute('parsing.duration_ms', parseDuration);
    setSpanStatus(parseSpan, parsingSuccess);
    parseSpan.end();
    
    agentSpan.addEvent('stage_complete', { 
      stage: 'response_parsing', 
      duration_ms: parseDuration,
      success: parsingSuccess,
      items_extracted: extractedItems.length
    });
    
    // Track parsing details in agent span
    agentSpan.setAttribute('output.parsing.success', parsingSuccess);
    agentSpan.setAttribute('output.parsing.duration_ms', parseDuration);
    agentSpan.setAttribute('output.parsing.markdown_removed', hadMarkdown);
    if (!parsingSuccess && parseError) {
      agentSpan.setAttribute('output.parsing.error', parseError.message);
    }

    // ============================================
    // STAGE 5: Item Validation & Quality Scoring
    // ============================================
    const validationStartTime = Date.now();
    const validationSpan = tracer.startSpan('listify-agent.vision.item_validation', {
      attributes: {
        [SpanAttributes.OPENINFERENCE_SPAN_KIND]: SpanKinds.TOOL,
        'tool.name': 'item_validator',
        'tool.operation': 'validate_and_score_items'
      }
    }, trace.setSpan(context.active(), agentSpan));
    
    // Validate and clean the extracted items
    let validItems = [];
    let invalidItems = [];
    let validationMetrics = {
      total_items: extractedItems.length,
      valid_items: 0,
      invalid_items: 0,
      items_with_name: 0,
      items_with_category: 0,
      items_with_quantity: 0,
      items_with_notes: 0,
      items_with_explanation: 0,
      categories_found: new Set(),
      avg_name_length: 0,
      avg_explanation_length: 0
    };
    
    extractedItems.forEach((item, index) => {
      if (item && typeof item.item_name === 'string' && item.item_name.trim().length > 0) {
        const cleanedItem = {
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
        };
        
        validItems.push(cleanedItem);
        validationMetrics.valid_items++;
        validationMetrics.items_with_name++;
        if (cleanedItem.category && cleanedItem.category !== 'other') {
          validationMetrics.items_with_category++;
        }
        if (cleanedItem.quantity) validationMetrics.items_with_quantity++;
        if (cleanedItem.notes) validationMetrics.items_with_notes++;
        if (cleanedItem.explanation) validationMetrics.items_with_explanation++;
        
        validationMetrics.categories_found.add(cleanedItem.category);
        validationMetrics.avg_name_length += cleanedItem.item_name.length;
        if (cleanedItem.explanation) {
          validationMetrics.avg_explanation_length += cleanedItem.explanation.length;
        }
      } else {
        invalidItems.push({ index, item, reason: !item ? 'null_item' : (!item.item_name ? 'missing_name' : 'empty_name') });
        validationMetrics.invalid_items++;
      }
    });
    
    // Calculate averages
    if (validItems.length > 0) {
      validationMetrics.avg_name_length = Math.round(validationMetrics.avg_name_length / validItems.length);
      validationMetrics.avg_explanation_length = Math.round(validationMetrics.avg_explanation_length / validationMetrics.items_with_explanation || 1);
    }
    
    // Calculate confidence score (based on completeness)
    const completenessScore = (
      (validationMetrics.items_with_name / validationMetrics.total_items || 0) * 0.3 +
      (validationMetrics.items_with_category / validationMetrics.total_items || 0) * 0.2 +
      (validationMetrics.items_with_explanation / validationMetrics.total_items || 0) * 0.3 +
      (validationMetrics.items_with_quantity / validationMetrics.total_items || 0) * 0.1 +
      (validationMetrics.items_with_notes / validationMetrics.total_items || 0) * 0.1
    );
    
    // Add validation metrics to span
    validationSpan.setAttribute('validation.total_items', validationMetrics.total_items);
    validationSpan.setAttribute('validation.valid_items', validationMetrics.valid_items);
    validationSpan.setAttribute('validation.invalid_items', validationMetrics.invalid_items);
    validationSpan.setAttribute('validation.completeness_score', Math.round(completenessScore * 100) / 100);
    validationSpan.setAttribute('validation.items_with_category', validationMetrics.items_with_category);
    validationSpan.setAttribute('validation.items_with_explanation', validationMetrics.items_with_explanation);
    validationSpan.setAttribute('validation.categories_count', validationMetrics.categories_found.size);
    validationSpan.setAttribute('validation.categories', JSON.stringify([...validationMetrics.categories_found]));
    validationSpan.setAttribute('validation.avg_name_length', validationMetrics.avg_name_length);
    validationSpan.setAttribute('validation.avg_explanation_length', validationMetrics.avg_explanation_length);
    
    if (invalidItems.length > 0) {
      validationSpan.setAttribute('validation.invalid_items_reasons', JSON.stringify(invalidItems.map(i => i.reason)));
    }
    
    const validationDuration = Date.now() - validationStartTime;
    stageTimings.validation = validationDuration;
    validationSpan.setAttribute('validation.duration_ms', validationDuration);
    setSpanStatus(validationSpan, true);
    validationSpan.end();
    
    agentSpan.addEvent('stage_complete', { 
      stage: 'item_validation', 
      duration_ms: validationDuration,
      valid_items: validItems.length,
      invalid_items: invalidItems.length
    });

    console.log(`Successfully extracted ${validItems.length} items from image (${invalidItems.length} invalid)`);
    
    // Add comprehensive output attributes to agent span
    agentSpan.setAttribute('output.item_count', validItems.length);
    agentSpan.setAttribute('output.items_total', validationMetrics.total_items);
    agentSpan.setAttribute('output.items_valid', validationMetrics.valid_items);
    agentSpan.setAttribute('output.items_invalid', validationMetrics.invalid_items);
    agentSpan.setAttribute('output.success', validItems.length > 0);
    agentSpan.setAttribute('output.categories', JSON.stringify([...validationMetrics.categories_found]));
    agentSpan.setAttribute('output.categories_count', validationMetrics.categories_found.size);
    agentSpan.setAttribute('output.completeness_score', Math.round(completenessScore * 100) / 100);
    agentSpan.setAttribute('output.confidence', completenessScore >= 0.8 ? 'high' : (completenessScore >= 0.5 ? 'medium' : 'low'));
    agentSpan.setAttribute('output.avg_name_length', validationMetrics.avg_name_length);
    agentSpan.setAttribute('output.avg_explanation_length', validationMetrics.avg_explanation_length);
    agentSpan.setAttribute('output.summary', `Successfully extracted ${validItems.length} items from image (${completenessScore >= 0.8 ? 'high' : 'medium'} confidence)`);
    
    if (validItems.length > 0) {
      agentSpan.setAttribute('output.sample_items', JSON.stringify(validItems.slice(0, 3).map(item => item.item_name)));
    }
    
    // Add timing breakdown
    const overallDuration = Date.now() - overallStartTime;
    stageTimings.total = overallDuration;
    agentSpan.setAttribute('timing.total_ms', overallDuration);
    agentSpan.setAttribute('timing.preparation_ms', stageTimings.preparation);
    agentSpan.setAttribute('timing.prompt_preparation_ms', stageTimings.prompt_preparation);
    agentSpan.setAttribute('timing.llm_call_ms', stageTimings.llm_call);
    agentSpan.setAttribute('timing.parsing_ms', stageTimings.parsing);
    agentSpan.setAttribute('timing.validation_ms', stageTimings.validation);
    agentSpan.setAttribute('timing.breakdown', JSON.stringify(stageTimings));
    
    // Add efficiency metrics
    agentSpan.setAttribute('efficiency.items_per_second', Math.round((validItems.length / (overallDuration / 1000)) * 100) / 100);
    agentSpan.setAttribute('efficiency.tokens_per_item', validItems.length > 0 ? Math.round(totalTokens / validItems.length) : 0);
    agentSpan.setAttribute('efficiency.cost_per_item', validItems.length > 0 ? Math.round((cost / validItems.length) * 10000) / 10000 : 0);

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
    
    // Calculate partial timing if error occurred mid-process
    const errorTime = Date.now() - overallStartTime;
    if (Object.keys(stageTimings).length > 0) {
      agentSpan.setAttribute('timing.failed_at_ms', errorTime);
      agentSpan.setAttribute('timing.breakdown_partial', JSON.stringify(stageTimings));
    }
    
    // Record error in span with detailed context
    recordSpanException(agentSpan, error, {
      'output.success': false,
      'output.item_count': 0,
      'error.context': 'image_analysis',
      'error.stage': stageTimings.llm_call ? 'post_llm' : (stageTimings.preparation ? 'post_preparation' : 'preparation'),
      'error.timestamp': new Date().toISOString()
    });
    
    agentSpan.addEvent('analysis_failed', {
      error: error.message,
      error_type: error.constructor.name,
      stage_failed_at: Date.now() - overallStartTime
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
export async function analyzeText(text, parentSpan = null, parentNodeId = null) {
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

  // Add graph attributes for agent visualization - link to API request if available
  addGraphAttributes(agentSpan, 'text_analyzer', parentNodeId, 'Text Analyzer');

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

CRITICAL FORMATTING REQUIREMENTS:
1. You MUST return a valid JSON object with an "items" array property
2. Do NOT wrap your response in markdown code blocks
3. Do NOT use \`\`\`json or \`\`\` tags
4. Do NOT include any text before or after the JSON
5. Return ONLY valid JSON starting with { and ending with }
6. If no items found, return: {"items": []}

Example correct format:
{"items": [{"item_name": "Buy milk", "category": "groceries", "quantity": null, "notes": null, "explanation": "Essential dairy product"}]}

Text to analyze:
${text}`;

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

    // Use response_format to enforce JSON output (reduces markdown wrapping and latency)
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      max_tokens: 2000,
      temperature: 0.2,
      response_format: { type: 'json_object' }, // Forces JSON output, no markdown
    });

    // Add LLM response attributes with cost calculation
    const promptTokens = response.usage.prompt_tokens;
    const completionTokens = response.usage.completion_tokens;
    const totalTokens = response.usage.total_tokens;
    
    // GPT-4o pricing: $2.50 per 1M input tokens, $10.00 per 1M output tokens
    const inputCostPer1M = 2.50;
    const outputCostPer1M = 10.00;
    const cost = (promptTokens / 1_000_000) * inputCostPer1M + (completionTokens / 1_000_000) * outputCostPer1M;
    
    // Set all required OpenInference LLM attributes for Arize recognition
    // CRITICAL: These exact attribute names are required for Arize cost tracking
    llmSpan.setAttribute(SpanAttributes.LLM_MODEL_NAME, 'gpt-4o');
    llmSpan.setAttribute(SpanAttributes.LLM_PROVIDER, 'openai');
    llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_PROMPT, promptTokens);
    llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_COMPLETION, completionTokens);
    llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_TOTAL, totalTokens);
    
    // Set cost attributes using OpenInference semantic conventions
    // Note: Arize auto-calculates costs, but we set these for manual tracking
    const promptCost = (promptTokens / 1_000_000) * inputCostPer1M;
    const completionCost = (completionTokens / 1_000_000) * outputCostPer1M;
    llmSpan.setAttribute(SpanAttributes.LLM_COST_PROMPT, promptCost);
    llmSpan.setAttribute(SpanAttributes.LLM_COST_COMPLETION, completionCost);
    llmSpan.setAttribute(SpanAttributes.LLM_COST_TOTAL, cost);
    
    // Additional attributes for debugging
    llmSpan.setAttribute('llm.response_length', response.choices[0].message.content.length);
    llmSpan.setAttribute('llm.finish_reason', response.choices[0].finish_reason);
    
    // CRITICAL: Set output.value for Arize to recognize this as an LLM span
    const outputContent = response.choices[0].message.content;
    llmSpan.setAttribute(SpanAttributes.OUTPUT_VALUE, outputContent);

    // Add output messages (this also helps Arize recognize the span)
    addLLMOutputMessages(llmSpan, [response.choices[0].message]);
    setSpanStatus(llmSpan, true);
    llmSpan.end();
    
    console.log(`📊 LLM Span (text): tokens=${totalTokens}, cost=$${cost.toFixed(6)}, prompt=${promptTokens}, completion=${completionTokens}`);

    const content = response.choices[0].message.content;
    console.log('Text analysis response:', content);

    // Parse the JSON response - response_format should ensure raw JSON
    let extractedItems = [];
    const parseStartTime = Date.now();
    try {
      // Remove markdown code blocks if present (defensive - should not be needed with response_format)
      let cleanedContent = content.trim();
      const hadMarkdown = cleanedContent.startsWith('```');
      
      if (hadMarkdown) {
        // Remove opening ```json or ```
        cleanedContent = cleanedContent.replace(/^```(?:json)?\s*\n?/i, '');
        // Remove closing ```
        cleanedContent = cleanedContent.replace(/\n?```\s*$/i, '');
        cleanedContent = cleanedContent.trim();
        console.log('⚠️ Markdown wrapper detected (should not happen with response_format), cleaned content:', cleanedContent.substring(0, 100));
      }
      
      // Parse JSON - expect object with "items" array or direct array
      const parsed = JSON.parse(cleanedContent);
      
      if (Array.isArray(parsed)) {
        // Direct array response (legacy format)
        extractedItems = parsed;
        console.log('Parsed as direct array, found', extractedItems.length, 'items');
      } else if (parsed.items && Array.isArray(parsed.items)) {
        // Object with items array (expected format with response_format)
        extractedItems = parsed.items;
        console.log('Extracted items from object, found', extractedItems.length, 'items');
      } else if (parsed.data && Array.isArray(parsed.data)) {
        // Alternative format
        extractedItems = parsed.data;
        console.log('Extracted items from data property, found', extractedItems.length, 'items');
      } else {
        console.warn('Unexpected JSON format:', Object.keys(parsed));
        extractedItems = [];
      }
      
      const parseDuration = Date.now() - parseStartTime;
      agentSpan.setAttribute('output.parsing.success', true);
      agentSpan.setAttribute('output.parsing.duration_ms', parseDuration);
      agentSpan.setAttribute('output.markdown_removed', hadMarkdown);
      agentSpan.setAttribute('output.raw_response_length', content.length);
      agentSpan.setAttribute('output.cleaned_response_length', cleanedContent.length);
      agentSpan.setAttribute('output.response_format_enforced', true);
    } catch (parseError) {
      const parseDuration = Date.now() - parseStartTime;
      console.error('Failed to parse JSON response:', parseError);
      console.error('Raw content (first 500 chars):', content.substring(0, 500));
      agentSpan.setAttribute('output.parsing.success', false);
      agentSpan.setAttribute('output.parsing.duration_ms', parseDuration);
      agentSpan.setAttribute('output.parsing.error', parseError.message);
      agentSpan.setAttribute('output.raw_content_preview', content.substring(0, 500));
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
async function analyzeLinkWithFetch(url, parentSpan = null, parentNodeId = null) {
  // Get active context - use parent span if provided
  const activeContext = parentSpan 
    ? trace.setSpan(context.active(), parentSpan)
    : context.active();
  
  const tracer = trace.getTracer('listify-agent', '1.0.0');
  
  // Create agent span for fetch-based link analysis
  const agentSpan = tracer.startSpan('listify-agent.link-analysis-fetch', {
    attributes: {
      [SpanAttributes.OPENINFERENCE_SPAN_KIND]: SpanKinds.AGENT,
      'operation.type': 'link_analysis',
      'operation.category': 'web_scraping',
      'operation.method': 'fetch',
      'agent.name': 'listify-agent',
      'agent.version': '1.0.0',
      'service.name': 'listify-agent',
      'service.version': '1.0.0'
    }
  }, activeContext);

  // Add graph attributes for agent visualization - link to API request if available
  addGraphAttributes(agentSpan, 'link_analyzer_fetch', parentNodeId, 'Link Analyzer (Fetch)');

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
               
    // Extract text content - try to get structured data first, then fallback to body text
    let textContent = '';
    
    // Try to extract structured data from JSON-LD scripts (common for lists/rankings)
    const jsonLdScripts = $('script[type="application/ld+json"]');
    if (jsonLdScripts.length > 0) {
      console.log(`Found ${jsonLdScripts.length} JSON-LD script(s), extracting structured data...`);
      jsonLdScripts.each((i, el) => {
        try {
          const jsonData = JSON.parse($(el).html());
          // Extract list items from structured data if available
          if (jsonData.itemListElement && Array.isArray(jsonData.itemListElement)) {
            const itemsText = jsonData.itemListElement.map((item, idx) => {
              const itemData = item.item || item;
              return `${idx + 1}. ${itemData.name || itemData.title || 'Item'}${itemData.description ? ' - ' + itemData.description : ''}`;
            }).join('\n');
            textContent += itemsText + '\n';
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      });
    }
    
    // Also extract visible text from body
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    if (bodyText.length > textContent.length) {
      textContent = bodyText;
    }
    
    // Clean up text content
    textContent = textContent.trim();
    
    console.log('Page content extracted via fetch, length:', textContent.length);
    console.log('Content preview (first 500 chars):', textContent.substring(0, 500));
    
    // Analyze the text content using OpenAI
    const prompt = `You are an expert at extracting and structuring information from web page content.

Analyze this web page content and extract ALL list items, entries, products, movies, shows, articles, or any structured information that appears in a list format.

For EACH item you find, provide:
- item_name: The main text/title of the item (required)
- category: Choose the most appropriate category from: groceries, tasks, contacts, events, inventory, ideas, recipes, shopping, bills, entertainment, media, products, services, other
- quantity: Any number, rank, position, or quantity mentioned (if visible, otherwise null)
- notes: Any additional details, context, ratings, descriptions, or metadata
- explanation: A short, helpful explanation of what this item is or why it might be useful (1-2 sentences)

IMPORTANT: Extract ALL items from lists, rankings, tables, or structured content. This includes:
- Movie/TV show rankings and lists
- Product listings
- Article titles
- Any numbered or bulleted lists
- Table rows with item information
- Chart or ranking data

CRITICAL FORMATTING REQUIREMENTS:
1. You MUST return a valid JSON object with an "items" array property
2. Do NOT wrap your response in markdown code blocks
3. Do NOT use \`\`\`json or \`\`\` tags
4. Do NOT include any text before or after the JSON
5. Return ONLY valid JSON starting with { and ending with }
6. If no items found, return: {"items": []}

Example correct format:
{"items": [{"item_name": "The Shawshank Redemption", "category": "entertainment", "quantity": "1", "notes": "Rating: 9.3", "explanation": "Classic drama film"}]}

Web page content:
${textContent.substring(0, 4000)}`;

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
      // Add LLM response attributes with cost calculation
      const promptTokens = response_openai.usage.prompt_tokens;
      const completionTokens = response_openai.usage.completion_tokens;
      const totalTokens = response_openai.usage.total_tokens;
      
      // GPT-4o pricing: $2.50 per 1M input tokens, $10.00 per 1M output tokens
      const inputCostPer1M = 2.50;
      const outputCostPer1M = 10.00;
      const cost = (promptTokens / 1_000_000) * inputCostPer1M + (completionTokens / 1_000_000) * outputCostPer1M;
      
      // Set all required OpenInference LLM attributes for Arize recognition
      llmSpan.setAttribute(SpanAttributes.LLM_MODEL_NAME, 'gpt-4o');
      llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_PROMPT, promptTokens);
      llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_COMPLETION, completionTokens);
      llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_TOTAL, totalTokens);
      
      // Set cost attributes - use both formats for maximum compatibility
      llmSpan.setAttribute('llm.usage.total_cost', cost);
      llmSpan.setAttribute('llm.cost_usd', cost);
      llmSpan.setAttribute('llm.usage.input_cost', (promptTokens / 1_000_000) * inputCostPer1M);
      llmSpan.setAttribute('llm.usage.output_cost', (completionTokens / 1_000_000) * outputCostPer1M);
      llmSpan.setAttribute('llm.cost.input_usd', (promptTokens / 1_000_000) * inputCostPer1M);
      llmSpan.setAttribute('llm.cost.output_usd', (completionTokens / 1_000_000) * outputCostPer1M);
      
      llmSpan.setAttribute('llm.response_length', response_openai.choices[0].message.content.length);
      llmSpan.setAttribute('llm.finish_reason', response_openai.choices[0].finish_reason);
      llmSpan.setAttribute('llm.provider', 'openai');
      
      // CRITICAL: Set output.value for Arize to recognize this as an LLM span
      const outputContent = response_openai.choices[0].message.content;
      llmSpan.setAttribute(SpanAttributes.OUTPUT_VALUE, outputContent);

    // Add output messages (this also helps Arize recognize the span)
    addLLMOutputMessages(llmSpan, [response_openai.choices[0].message]);
    setSpanStatus(llmSpan, true);
    llmSpan.end();
    
    console.log(`📊 LLM Span (link-fetch): tokens=${totalTokens}, cost=$${cost.toFixed(6)}, prompt=${promptTokens}, completion=${completionTokens}`);
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
export async function analyzeLink(url, parentSpan = null, parentNodeId = null) {
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

  // Add graph attributes for agent visualization - link to API request if available
  addGraphAttributes(agentSpan, 'link_analyzer', parentNodeId, 'Link Analyzer');

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
      return await analyzeLinkWithFetch(url, parentSpan, parentNodeId);
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

CRITICAL FORMATTING REQUIREMENTS:
1. You MUST return a valid JSON object with an "items" array property
2. Do NOT wrap your response in markdown code blocks
3. Do NOT use \`\`\`json or \`\`\` tags
4. Do NOT include any text before or after the JSON
5. Return ONLY valid JSON starting with { and ending with }
6. If no items found, return: {"items": []}

Example correct format:
{"items": [{"item_name": "Buy milk", "category": "groceries", "quantity": null, "notes": null, "explanation": "Essential dairy product"}]}

Web page content:
${textContent.substring(0, 8000)}`;

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

      // Use response_format to enforce JSON output (reduces markdown wrapping and latency)
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 2000,
        temperature: 0.2,
        response_format: { type: 'json_object' }, // Forces JSON output, no markdown
      });

      // Add LLM response attributes
      // Add LLM response attributes with cost calculation
      const promptTokens = response.usage.prompt_tokens;
      const completionTokens = response.usage.completion_tokens;
      const totalTokens = response.usage.total_tokens;
      
      // GPT-4o pricing: $2.50 per 1M input tokens, $10.00 per 1M output tokens
      const inputCostPer1M = 2.50;
      const outputCostPer1M = 10.00;
      const cost = (promptTokens / 1_000_000) * inputCostPer1M + (completionTokens / 1_000_000) * outputCostPer1M;
      
      // Set all required OpenInference LLM attributes for Arize recognition
      llmSpan.setAttribute(SpanAttributes.LLM_MODEL_NAME, 'gpt-4o');
      llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_PROMPT, promptTokens);
      llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_COMPLETION, completionTokens);
      llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_TOTAL, totalTokens);
      
      // Set cost attributes - use both formats for maximum compatibility
      llmSpan.setAttribute('llm.usage.total_cost', cost);
      llmSpan.setAttribute('llm.cost_usd', cost);
      llmSpan.setAttribute('llm.usage.input_cost', (promptTokens / 1_000_000) * inputCostPer1M);
      llmSpan.setAttribute('llm.usage.output_cost', (completionTokens / 1_000_000) * outputCostPer1M);
      llmSpan.setAttribute('llm.cost.input_usd', (promptTokens / 1_000_000) * inputCostPer1M);
      llmSpan.setAttribute('llm.cost.output_usd', (completionTokens / 1_000_000) * outputCostPer1M);
      
      llmSpan.setAttribute('llm.response_length', response.choices[0].message.content.length);
      llmSpan.setAttribute('llm.finish_reason', response.choices[0].finish_reason);
      llmSpan.setAttribute('llm.provider', 'openai');
      
      // CRITICAL: Set output.value for Arize to recognize this as an LLM span
      const outputContent = response.choices[0].message.content;
      llmSpan.setAttribute(SpanAttributes.OUTPUT_VALUE, outputContent);

      // Add output messages (this also helps Arize recognize the span)
      addLLMOutputMessages(llmSpan, [response.choices[0].message]);
      setSpanStatus(llmSpan, true);
      llmSpan.end();
      
      console.log(`📊 LLM Span (link-puppeteer): tokens=${totalTokens}, cost=$${cost.toFixed(6)}, prompt=${promptTokens}, completion=${completionTokens}`);

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
      
      return await analyzeLinkWithFetch(url, parentSpan, parentNodeId);
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