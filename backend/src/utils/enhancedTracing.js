/**
 * Enhanced Arize Tracing with Rich Information
 * Provides comprehensive trace data for better dashboard visibility
 */

import { 
  createAgentSpan, 
  createLLMSpan, 
  createToolSpan, 
  createEvaluatorSpan,
  addLLMInputMessages,
  addLLMOutputMessages,
  addSpanMetadata,
  addSpanTags,
  setSpanStatus,
  recordSpanException,
  SpanKinds
} from './tracing-mcp.js';

class EnhancedArizeTracing {
  constructor() {
    this.tracer = null;
  }

  // Enhanced Agent Span with rich context
  createRichAgentSpan(operationName, description, context = {}) {
    const span = createAgentSpan(operationName, description, {
      'agent.operation': operationName,
      'agent.description': description,
      'agent.context': JSON.stringify(context),
      'agent.timestamp': new Date().toISOString(),
      'agent.environment': process.env.NODE_ENV || 'development',
      'agent.version': '1.0.0'
    });

    // Add rich metadata
    addSpanMetadata(span, {
      'user.id': context.userId || 'anonymous',
      'session.id': context.sessionId || this.generateSessionId(),
      'request.id': context.requestId || this.generateRequestId(),
      'feature.flag': context.featureFlag || 'default',
      'business.context': context.businessContext || 'general'
    });

    // Add tags for better filtering
    addSpanTags(span, [
      'agent-operation',
      context.operationType || 'general',
      context.priority || 'normal'
    ]);

    return span;
  }

  // Enhanced LLM Span with detailed token information
  createRichLLMSpan(operationName, modelName, messages, options = {}) {
    const span = createLLMSpan(operationName, modelName, JSON.stringify(messages), {
      'llm.operation': operationName,
      'llm.model.name': modelName,
      'llm.model.version': options.modelVersion || 'latest',
      'llm.temperature': options.temperature || 0.7,
      'llm.max_tokens': options.maxTokens || 1000,
      'llm.top_p': options.topP || 1.0,
      'llm.frequency_penalty': options.frequencyPenalty || 0,
      'llm.presence_penalty': options.presencePenalty || 0,
      'llm.stream': options.stream || false,
      'llm.stop_sequences': JSON.stringify(options.stopSequences || []),
      'llm.user': options.user || 'system'
    });

    // Add input messages with rich context
    addLLMInputMessages(span, messages);

    // Add prompt engineering context
    span.setAttribute('llm.prompt.template', options.promptTemplate || 'default');
    span.setAttribute('llm.prompt.variables', JSON.stringify(options.promptVariables || {}));
    span.setAttribute('llm.prompt.engineering', options.promptEngineering || 'standard');

    // Add business context
    span.setAttribute('llm.business.use_case', options.useCase || 'general');
    span.setAttribute('llm.business.domain', options.domain || 'general');
    span.setAttribute('llm.business.priority', options.priority || 'normal');

    return span;
  }

  // Enhanced Tool Span with execution details
  createRichToolSpan(operationName, toolName, args, options = {}) {
    const span = createToolSpan(operationName, toolName, args, {
      'tool.operation': operationName,
      'tool.name': toolName,
      'tool.version': options.toolVersion || '1.0.0',
      'tool.category': options.category || 'utility',
      'tool.dangerous': options.dangerous || false,
      'tool.requires_auth': options.requiresAuth || false,
      'tool.timeout': options.timeout || 30000,
      'tool.retry_count': options.retryCount || 0,
      'tool.cache_enabled': options.cacheEnabled || false
    });

    // Add execution context
    span.setAttribute('tool.execution.start_time', new Date().toISOString());
    span.setAttribute('tool.execution.environment', process.env.NODE_ENV || 'development');
    span.setAttribute('tool.execution.user_agent', options.userAgent || 'listify-agent');
    span.setAttribute('tool.execution.ip_address', options.ipAddress || 'unknown');

    // Add business context
    span.setAttribute('tool.business.purpose', options.purpose || 'general');
    span.setAttribute('tool.business.impact', options.impact || 'low');
    span.setAttribute('tool.business.cost_center', options.costCenter || 'general');

    return span;
  }

  // Enhanced Evaluator Span with detailed metrics
  createRichEvaluatorSpan(operationName, evaluationType, input, options = {}) {
    const span = createEvaluatorSpan(operationName, evaluationType, input, {
      'evaluator.operation': operationName,
      'evaluator.type': evaluationType,
      'evaluator.version': options.evaluatorVersion || '1.0.0',
      'evaluator.model': options.evaluatorModel || 'gpt-4o-mini',
      'evaluator.confidence_threshold': options.confidenceThreshold || 0.8,
      'evaluator.sampling_rate': options.samplingRate || 1.0,
      'evaluator.batch_size': options.batchSize || 1,
      'evaluator.timeout': options.timeout || 30000
    });

    // Add evaluation context
    span.setAttribute('evaluator.input.type', typeof input);
    span.setAttribute('evaluator.input.size', JSON.stringify(input).length);
    span.setAttribute('evaluator.input.complexity', this.calculateComplexity(input));
    span.setAttribute('evaluator.input.language', options.language || 'en');
    span.setAttribute('evaluator.input.domain', options.domain || 'general');

    // Add business context
    span.setAttribute('evaluator.business.criticality', options.criticality || 'medium');
    span.setAttribute('evaluator.business.sla', options.sla || 'standard');
    span.setAttribute('evaluator.business.alert_threshold', options.alertThreshold || 0.5);

    return span;
  }

  // Add comprehensive output to spans
  addRichOutput(span, output, options = {}) {
    if (!span || !output) return;

    // Basic output
    span.setAttribute('output.value', typeof output === 'string' ? output : JSON.stringify(output));
    span.setAttribute('output.type', typeof output);
    span.setAttribute('output.size', JSON.stringify(output).length);
    span.setAttribute('output.timestamp', new Date().toISOString());

    // Rich output context
    if (options.quality) {
      span.setAttribute('output.quality.score', options.quality.score || 0);
      span.setAttribute('output.quality.confidence', options.quality.confidence || 0);
      span.setAttribute('output.quality.metrics', JSON.stringify(options.quality.metrics || {}));
    }

    if (options.performance) {
      span.setAttribute('output.performance.latency', options.performance.latency || 0);
      span.setAttribute('output.performance.throughput', options.performance.throughput || 0);
      span.setAttribute('output.performance.efficiency', options.performance.efficiency || 0);
    }

    if (options.business) {
      span.setAttribute('output.business.value', options.business.value || 0);
      span.setAttribute('output.business.impact', options.business.impact || 'low');
      span.setAttribute('output.business.satisfaction', options.business.satisfaction || 0);
    }

    // Add evaluation results if available
    if (options.evaluation) {
      span.setAttribute('output.evaluation.overall_score', options.evaluation.overall_score || 0);
      span.setAttribute('output.evaluation.tone_score', options.evaluation.tone_score || 0);
      span.setAttribute('output.evaluation.correctness_score', options.evaluation.correctness_score || 0);
      span.setAttribute('output.evaluation.has_hallucinations', options.evaluation.has_hallucinations || false);
      span.setAttribute('output.evaluation.confidence', options.evaluation.confidence || 0);
    }
  }

  // Add comprehensive token information
  addTokenInformation(span, tokenData) {
    if (!span || !tokenData) return;

    // Basic token counts
    span.setAttribute('llm.token_count.prompt', tokenData.prompt || 0);
    span.setAttribute('llm.token_count.completion', tokenData.completion || 0);
    span.setAttribute('llm.token_count.total', tokenData.total || 0);

    // Detailed token information
    span.setAttribute('llm.token_count.prompt_tokens', tokenData.promptTokens || 0);
    span.setAttribute('llm.token_count.completion_tokens', tokenData.completionTokens || 0);
    span.setAttribute('llm.token_count.total_tokens', tokenData.totalTokens || 0);

    // Cost information
    if (tokenData.cost) {
      span.setAttribute('llm.cost.prompt', tokenData.cost.prompt || 0);
      span.setAttribute('llm.cost.completion', tokenData.cost.completion || 0);
      span.setAttribute('llm.cost.total', tokenData.cost.total || 0);
      span.setAttribute('llm.cost.currency', tokenData.cost.currency || 'USD');
    }

    // Efficiency metrics
    span.setAttribute('llm.efficiency.tokens_per_second', tokenData.tokensPerSecond || 0);
    span.setAttribute('llm.efficiency.cost_per_token', tokenData.costPerToken || 0);
    span.setAttribute('llm.efficiency.utilization', tokenData.utilization || 0);
  }

  // Add comprehensive evaluation results
  addEvaluationResults(span, evaluationData) {
    if (!span || !evaluationData) return;

    // Basic evaluation scores
    span.setAttribute('eval.overall_score', evaluationData.overall_score || 0);
    span.setAttribute('eval.tone_score', evaluationData.tone_score || 0);
    span.setAttribute('eval.correctness_score', evaluationData.correctness_score || 0);
    span.setAttribute('eval.tool_score', evaluationData.tool_score || 0);
    span.setAttribute('eval.has_hallucinations', evaluationData.has_hallucinations || false);

    // Detailed evaluation metrics
    span.setAttribute('eval.confidence', evaluationData.confidence || 0);
    span.setAttribute('eval.hallucination_count', evaluationData.hallucination_count || 0);
    span.setAttribute('eval.hallucination_rate', evaluationData.hallucination_rate || 0);
    span.setAttribute('eval.accuracy', evaluationData.accuracy || 0);
    span.setAttribute('eval.completeness', evaluationData.completeness || 0);
    span.setAttribute('eval.actionability', evaluationData.actionability || 0);

    // Evaluation context
    span.setAttribute('eval.evaluator_model', evaluationData.evaluator_model || 'gpt-4o-mini');
    span.setAttribute('eval.evaluation_time', evaluationData.evaluation_time || 0);
    span.setAttribute('eval.evaluation_cost', evaluationData.evaluation_cost || 0);
    span.setAttribute('eval.evaluation_method', evaluationData.evaluation_method || 'llm_judge');

    // Business impact
    span.setAttribute('eval.business.impact', evaluationData.business_impact || 'low');
    span.setAttribute('eval.business.priority', evaluationData.business_priority || 'normal');
    span.setAttribute('eval.business.sla_met', evaluationData.sla_met || true);
  }

  // Add comprehensive annotations
  addRichAnnotations(span, annotations) {
    if (!span || !annotations) return;

    // System annotations
    span.setAttribute('annotation.system.version', process.env.npm_package_version || '1.0.0');
    span.setAttribute('annotation.system.node_version', process.version);
    span.setAttribute('annotation.system.platform', process.platform);
    span.setAttribute('annotation.system.arch', process.arch);
    span.setAttribute('annotation.system.memory', process.memoryUsage().heapUsed);

    // Custom annotations
    Object.entries(annotations).forEach(([key, value]) => {
      span.setAttribute(`annotation.custom.${key}`, value);
    });

    // Performance annotations
    span.setAttribute('annotation.performance.cpu_usage', process.cpuUsage().user);
    span.setAttribute('annotation.performance.memory_usage', process.memoryUsage().heapUsed);
    span.setAttribute('annotation.performance.uptime', process.uptime());

    // Business annotations
    span.setAttribute('annotation.business.timestamp', new Date().toISOString());
    span.setAttribute('annotation.business.environment', process.env.NODE_ENV || 'development');
    span.setAttribute('annotation.business.region', process.env.AWS_REGION || 'us-east-1');
    span.setAttribute('annotation.business.tenant', process.env.TENANT_ID || 'default');
  }

  // Helper methods
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  calculateComplexity(input) {
    if (typeof input === 'string') {
      return input.length > 1000 ? 'high' : input.length > 100 ? 'medium' : 'low';
    }
    if (typeof input === 'object') {
      return Object.keys(input).length > 10 ? 'high' : Object.keys(input).length > 5 ? 'medium' : 'low';
    }
    return 'low';
  }

  // Complete span with rich information
  completeRichSpan(span, output, options = {}) {
    if (!span) return;

    // Add rich output
    this.addRichOutput(span, output, options);

    // Add token information if available
    if (options.tokens) {
      this.addTokenInformation(span, options.tokens);
    }

    // Add evaluation results if available
    if (options.evaluation) {
      this.addEvaluationResults(span, options.evaluation);
    }

    // Add annotations
    this.addRichAnnotations(span, options.annotations || {});

    // Set final status
    setSpanStatus(span, options.success !== false, options.message || 'Operation completed successfully');

    // End span
    span.end();
  }
}

export default EnhancedArizeTracing;
