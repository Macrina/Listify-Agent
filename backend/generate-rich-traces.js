/**
 * Enhanced Arize Trace Generator
 * Creates rich, detailed traces for better dashboard visibility
 */

import { initializeArizeTracing } from './src/config/arize-mcp.js';
import EnhancedArizeTracing from './src/utils/enhancedTracing.js';
import { addLLMOutputMessages } from './src/utils/tracing-mcp.js';

console.log('🚀 ENHANCED ARIZE TRACE GENERATOR');
console.log('=================================\n');

async function generateRichTraces() {
  try {
    // Initialize Arize tracing
    console.log('1️⃣ INITIALIZING ARIZE TRACING:');
    const { tracerProvider, tracer } = initializeArizeTracing();
    
    if (!tracerProvider || !tracer) {
      console.error('❌ Failed to initialize Arize tracing');
      process.exit(1);
    }
    
    console.log('   ✅ Arize tracing initialized\n');

    // Initialize enhanced tracing
    const enhancedTracing = new EnhancedArizeTracing();

    // Test 1: Rich Agent Span with Image Analysis
    console.log('2️⃣ CREATING RICH AGENT SPAN (Image Analysis):');
    
    const agentSpan = enhancedTracing.createRichAgentSpan(
      'analyze-image-request',
      'Analyze uploaded image and extract list items',
      {
        userId: 'user_12345',
        sessionId: 'session_abc123',
        requestId: 'req_xyz789',
        operationType: 'image_analysis',
        priority: 'high',
        businessContext: 'user_upload',
        featureFlag: 'enhanced_analysis'
      }
    );

    // Simulate image analysis with rich data
    const imageAnalysisResult = {
      success: true,
      items: [
        { name: 'apple', category: 'groceries', quantity: '5', confidence: 0.95 },
        { name: 'milk', category: 'groceries', quantity: '1 gallon', confidence: 0.92 },
        { name: 'bread', category: 'groceries', quantity: '2 loaves', confidence: 0.88 }
      ],
      processingTime: 2500,
      imageMetadata: {
        width: 1920,
        height: 1080,
        format: 'jpeg',
        size: 245760
      }
    };

    // Add rich output with evaluation
    enhancedTracing.addRichOutput(agentSpan, imageAnalysisResult, {
      quality: {
        score: 4.5,
        confidence: 0.92,
        metrics: {
          accuracy: 0.95,
          completeness: 0.88,
          clarity: 0.90
        }
      },
      performance: {
        latency: 2500,
        throughput: 1.2,
        efficiency: 0.85
      },
      business: {
        value: 8.5,
        impact: 'high',
        satisfaction: 0.92
      },
      evaluation: {
        overall_score: 4.5,
        tone_score: 4.0,
        correctness_score: 5.0,
        tool_score: 4.0,
        has_hallucinations: false,
        confidence: 0.92
      },
      tokens: {
        prompt: 150,
        completion: 200,
        total: 350,
        cost: {
          prompt: 0.0003,
          completion: 0.0006,
          total: 0.0009,
          currency: 'USD'
        },
        tokensPerSecond: 0.14,
        costPerToken: 0.0000026,
        utilization: 0.85
      },
      annotations: {
        'image.analysis.version': '2.1.0',
        'image.analysis.model': 'gpt-4o-vision',
        'image.analysis.confidence_threshold': 0.8,
        'image.analysis.max_items': 10,
        'business.cost_center': 'ai_services',
        'business.project': 'listify_agent',
        'business.feature': 'image_analysis'
      }
    });

    enhancedTracing.completeRichSpan(agentSpan, imageAnalysisResult, {
      success: true,
      message: 'Image analysis completed successfully'
    });

    console.log('   ✅ Rich agent span created with comprehensive data\n');

    // Test 2: Rich LLM Span with Token Information
    console.log('3️⃣ CREATING RICH LLM SPAN (OpenAI Chat):');
    
    const llmSpan = enhancedTracing.createRichLLMSpan(
      'openai-chat-completion',
      'gpt-4o',
      [
        { role: 'system', content: 'You are a helpful assistant that extracts list items from images.' },
        { role: 'user', content: 'Please analyze this image and extract all visible list items with categories and quantities.' }
      ],
      {
        modelVersion: '2024-10-25',
        temperature: 0.7,
        maxTokens: 1000,
        topP: 1.0,
        frequencyPenalty: 0,
        presencePenalty: 0,
        stream: false,
        promptTemplate: 'image_analysis_v2',
        promptVariables: { image_type: 'jpeg', analysis_type: 'list_extraction' },
        promptEngineering: 'chain_of_thought',
        useCase: 'image_analysis',
        domain: 'list_management',
        priority: 'high'
      }
    );

    // Simulate LLM response with rich token data
    const llmResponse = {
      content: 'I can see 3 items in the image: 5 apples in the groceries category, 1 gallon of milk in the groceries category, and 2 loaves of bread in the groceries category.',
      finishReason: 'stop',
      usage: {
        prompt_tokens: 150,
        completion_tokens: 200,
        total_tokens: 350
      }
    };

    // Add output messages
    addLLMOutputMessages(llmSpan, [
      { role: 'assistant', content: llmResponse.content }
    ]);

    // Add comprehensive token information
    enhancedTracing.addTokenInformation(llmSpan, {
      prompt: 150,
      completion: 200,
      total: 350,
      promptTokens: 150,
      completionTokens: 200,
      totalTokens: 350,
      cost: {
        prompt: 0.0003,
        completion: 0.0006,
        total: 0.0009,
        currency: 'USD'
      },
      tokensPerSecond: 0.14,
      costPerToken: 0.0000026,
      utilization: 0.85
    });

    enhancedTracing.completeRichSpan(llmSpan, llmResponse, {
      success: true,
      message: 'LLM completion successful'
    });

    console.log('   ✅ Rich LLM span created with detailed token information\n');

    // Test 3: Rich Tool Span with Execution Details
    console.log('4️⃣ CREATING RICH TOOL SPAN (Image Processing):');
    
    const toolSpan = enhancedTracing.createRichToolSpan(
      'process-image-tool',
      'imageProcessor',
      {
        imageData: 'base64_encoded_image_data...',
        mimeType: 'image/jpeg',
        options: {
          resize: true,
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.9
        }
      },
      {
        toolVersion: '1.2.0',
        category: 'image_processing',
        dangerous: false,
        requiresAuth: false,
        timeout: 30000,
        retryCount: 0,
        cacheEnabled: true,
        purpose: 'image_optimization',
        impact: 'medium',
        costCenter: 'ai_services'
      }
    );

    // Simulate tool execution
    const toolResult = {
      success: true,
      processedImage: 'processed_base64_data...',
      metadata: {
        originalSize: 245760,
        processedSize: 198432,
        compressionRatio: 0.81,
        processingTime: 1200
      }
    };

    enhancedTracing.completeRichSpan(toolSpan, toolResult, {
      success: true,
      message: 'Image processing completed successfully'
    });

    console.log('   ✅ Rich tool span created with execution details\n');

    // Test 4: Rich Evaluator Span with Quality Metrics
    console.log('5️⃣ CREATING RICH EVALUATOR SPAN (Quality Assessment):');
    
    const evalSpan = enhancedTracing.createRichEvaluatorSpan(
      'quality-assessment',
      'comprehensive_evaluation',
      {
        userQuery: 'Analyze this image and extract list items',
        agentResponse: 'I found 3 items: 5 apples, 1 gallon of milk, and 2 loaves of bread',
        context: {
          imageType: 'jpeg',
          expectedItems: 3,
          actualItems: 3
        }
      },
      {
        evaluatorVersion: '2.0.0',
        evaluatorModel: 'gpt-4o-mini',
        confidenceThreshold: 0.8,
        samplingRate: 1.0,
        batchSize: 1,
        timeout: 30000,
        criticality: 'high',
        sla: 'standard',
        alertThreshold: 0.5,
        language: 'en',
        domain: 'list_management'
      }
    );

    // Simulate evaluation with rich metrics
    const evaluationResult = {
      overall_score: 4.5,
      tone_score: 4.0,
      correctness_score: 5.0,
      tool_score: 4.0,
      has_hallucinations: false,
      confidence: 0.92,
      hallucination_count: 0,
      hallucination_rate: 0.0,
      accuracy: 0.95,
      completeness: 0.88,
      actionability: 0.90,
      evaluator_model: 'gpt-4o-mini',
      evaluation_time: 1500,
      evaluation_cost: 0.0003,
      evaluation_method: 'llm_judge',
      business_impact: 'high',
      business_priority: 'high',
      sla_met: true
    };

    // Add comprehensive evaluation results
    enhancedTracing.addEvaluationResults(evalSpan, evaluationResult);

    enhancedTracing.completeRichSpan(evalSpan, evaluationResult, {
      success: true,
      message: 'Quality assessment completed successfully'
    });

    console.log('   ✅ Rich evaluator span created with quality metrics\n');

    // Test 5: Cross-Service Integration Span
    console.log('6️⃣ CREATING CROSS-SERVICE INTEGRATION SPAN:');
    
    const integrationSpan = enhancedTracing.createRichAgentSpan(
      'cross-service-integration',
      'Python service calling Node.js backend',
      {
        userId: 'user_12345',
        sessionId: 'session_abc123',
        requestId: 'req_integration_456',
        operationType: 'cross_service',
        priority: 'medium',
        businessContext: 'api_integration',
        featureFlag: 'enhanced_integration'
      }
    );

    // Simulate cross-service call
    const integrationResult = {
      success: true,
      services: ['python-arize-service', 'listify-agent'],
      endpoints: ['/api/health', '/api/lists'],
      responseTimes: [45, 1200],
      totalLatency: 1245,
      dataTransferred: 2048
    };

    enhancedTracing.addRichOutput(integrationSpan, integrationResult, {
      performance: {
        latency: 1245,
        throughput: 1.6,
        efficiency: 0.90
      },
      business: {
        value: 7.5,
        impact: 'medium',
        satisfaction: 0.88
      },
      annotations: {
        'integration.type': 'python_to_nodejs',
        'integration.protocol': 'http',
        'integration.version': '1.0.0',
        'integration.retry_count': 0,
        'integration.cache_hit': false
      }
    });

    enhancedTracing.completeRichSpan(integrationSpan, integrationResult, {
      success: true,
      message: 'Cross-service integration completed successfully'
    });

    console.log('   ✅ Cross-service integration span created\n');

    console.log('🎯 ENHANCED TRACE GENERATION SUMMARY:');
    console.log('   ✅ Rich agent span with comprehensive context');
    console.log('   ✅ Rich LLM span with detailed token information');
    console.log('   ✅ Rich tool span with execution details');
    console.log('   ✅ Rich evaluator span with quality metrics');
    console.log('   ✅ Cross-service integration span');
    
    console.log('\n📊 WHAT TO LOOK FOR IN ARIZE DASHBOARD:');
    console.log('   🔍 Project: listify-agent');
    console.log('   🔍 Service: listify-agent');
    console.log('   🔍 Span Names: analyze-image-request, openai-chat-completion, process-image-tool, quality-assessment, cross-service-integration');
    console.log('   🔍 Time Range: Last 5 minutes');
    console.log('   🔍 Rich Data:');
    console.log('      - Input/Output: Detailed request/response data');
    console.log('      - Token Information: Complete token counts and costs');
    console.log('      - Evaluation Results: Quality scores and metrics');
    console.log('      - Annotations: System and business context');
    console.log('      - Performance: Latency, throughput, efficiency');
    console.log('      - Business: Value, impact, satisfaction');
    
    console.log('\n🚀 ENHANCED TRACES STATUS: 100% RICH DATA');
    console.log('   All spans now contain comprehensive information for better dashboard visibility!');
    
  } catch (error) {
    console.error('❌ Enhanced trace generation failed:', error);
    process.exit(1);
  }
}

// Run the enhanced trace generation
generateRichTraces().then(() => {
  console.log('\n✨ Enhanced trace generation completed!');
  console.log('📊 Check your Arize dashboard for rich, detailed traces.');
  console.log('🔗 Direct link: https://app.arize.com/');
  process.exit(0);
}).catch(error => {
  console.error('❌ Enhanced trace generation failed:', error);
  process.exit(1);
});
