/**
 * Arize Evaluation Service
 * Service layer for integrating evaluations with the Listify Agent
 */

import ArizeEvaluator from './arizeEvaluator.js';
import { getTracer } from '../config/arize-fixed.js';

export class ArizeEvaluationService {
  constructor() {
    this.evaluator = new ArizeEvaluator();
    this.tracer = getTracer();
  }

  /**
   * Evaluate an image analysis interaction
   * @param {Object} interaction - Image analysis interaction data
   * @returns {Promise<Object>} Evaluation result
   */
  async evaluateImageAnalysis(interaction) {
    const span = this.tracer?.startSpan('evaluate-image-analysis');
    
    try {
      const { userQuery, agentResponse, imageMetadata, extractedItems } = interaction;

      // Create context for evaluation
      const context = {
        availableTools: ['image-analysis', 'item-extraction', 'category-classification'],
        codebaseFiles: [
          'backend/src/services/imageAnalysisService.js',
          'backend/src/config/openai.js',
          'frontend/src/components/ImageUploader.jsx'
        ],
        validCommands: [
          'npm start',
          'npm run dev',
          'npm install',
          'node src/server.js'
        ],
        validEndpoints: [
          '/api/analyze-image',
          '/api/health',
          '/api/lists'
        ],
        imageMetadata,
        extractedItems
      };

      const evaluation = await this.evaluator.evaluateInteraction({
        userQuery,
        agentResponse,
        context,
        id: `image_analysis_${Date.now()}`
      });

      // Add image-specific metrics
      evaluation.metrics = {
        image_size: imageMetadata?.size || 0,
        items_extracted: extractedItems?.length || 0,
        processing_time: interaction.processingTime || 0,
        confidence_score: interaction.confidence || 0
      };

      span?.setAttribute('evaluation.type', 'image_analysis');
      span?.setAttribute('evaluation.items_extracted', evaluation.metrics.items_extracted);
      span?.setAttribute('evaluation.processing_time', evaluation.metrics.processing_time);

      return evaluation;
    } finally {
      span?.end();
    }
  }

  /**
   * Evaluate a text analysis interaction
   * @param {Object} interaction - Text analysis interaction data
   * @returns {Promise<Object>} Evaluation result
   */
  async evaluateTextAnalysis(interaction) {
    const span = this.tracer?.startSpan('evaluate-text-analysis');
    
    try {
      const { userQuery, agentResponse, textContent, extractedItems } = interaction;

      const context = {
        availableTools: ['text-analysis', 'item-extraction', 'category-classification'],
        codebaseFiles: [
          'backend/src/services/imageAnalysisService.js',
          'backend/src/controllers/listController.js'
        ],
        validCommands: [
          'npm start',
          'npm run dev',
          'npm install'
        ],
        validEndpoints: [
          '/api/analyze-text',
          '/api/health',
          '/api/lists'
        ],
        textContent,
        extractedItems
      };

      const evaluation = await this.evaluator.evaluateInteraction({
        userQuery,
        agentResponse,
        context,
        id: `text_analysis_${Date.now()}`
      });

      // Add text-specific metrics
      evaluation.metrics = {
        text_length: textContent?.length || 0,
        items_extracted: extractedItems?.length || 0,
        processing_time: interaction.processingTime || 0,
        confidence_score: interaction.confidence || 0
      };

      span?.setAttribute('evaluation.type', 'text_analysis');
      span?.setAttribute('evaluation.text_length', evaluation.metrics.text_length);
      span?.setAttribute('evaluation.items_extracted', evaluation.metrics.items_extracted);

      return evaluation;
    } finally {
      span?.end();
    }
  }

  /**
   * Evaluate a link analysis interaction
   * @param {Object} interaction - Link analysis interaction data
   * @returns {Promise<Object>} Evaluation result
   */
  async evaluateLinkAnalysis(interaction) {
    const span = this.tracer?.startSpan('evaluate-link-analysis');
    
    try {
      const { userQuery, agentResponse, url, extractedContent } = interaction;

      const context = {
        availableTools: ['link-analysis', 'content-extraction', 'web-scraping'],
        codebaseFiles: [
          'backend/src/services/imageAnalysisService.js',
          'backend/src/utils/puppeteerConfig.js'
        ],
        validCommands: [
          'npm start',
          'npm run dev',
          'npm install'
        ],
        validEndpoints: [
          '/api/analyze-link',
          '/api/health',
          '/api/lists'
        ],
        url,
        extractedContent
      };

      const evaluation = await this.evaluator.evaluateInteraction({
        userQuery,
        agentResponse,
        context,
        id: `link_analysis_${Date.now()}`
      });

      // Add link-specific metrics
      evaluation.metrics = {
        url_length: url?.length || 0,
        content_extracted: extractedContent?.length || 0,
        processing_time: interaction.processingTime || 0,
        success: interaction.success || false
      };

      span?.setAttribute('evaluation.type', 'link_analysis');
      span?.setAttribute('evaluation.url_length', evaluation.metrics.url_length);
      span?.setAttribute('evaluation.content_extracted', evaluation.metrics.content_extracted);

      return evaluation;
    } finally {
      span?.end();
    }
  }

  /**
   * Evaluate AgentDB operations
   * @param {Object} interaction - AgentDB operation data
   * @returns {Promise<Object>} Evaluation result
   */
  async evaluateAgentDBOperation(interaction) {
    const span = this.tracer?.startSpan('evaluate-agentdb-operation');
    
    try {
      const { operation, query, result, executionTime } = interaction;

      const context = {
        availableTools: ['agentdb-query', 'agentdb-insert', 'agentdb-update'],
        codebaseFiles: [
          'backend/src/services/agentdbService.js',
          'backend/src/config/agentdb.js'
        ],
        validCommands: [
          'npm start',
          'npm run dev'
        ],
        validEndpoints: [
          '/api/lists',
          '/api/items',
          '/api/health'
        ],
        operation,
        query,
        result
      };

      const evaluation = await this.evaluator.evaluateInteraction({
        userQuery: `AgentDB ${operation} operation`,
        agentResponse: `Operation completed: ${operation}`,
        context,
        id: `agentdb_${operation}_${Date.now()}`
      });

      // Add AgentDB-specific metrics
      evaluation.metrics = {
        operation_type: operation,
        execution_time: executionTime || 0,
        rows_affected: result?.rowsAffected || 0,
        success: result?.success || false
      };

      span?.setAttribute('evaluation.type', 'agentdb_operation');
      span?.setAttribute('evaluation.operation', operation);
      span?.setAttribute('evaluation.execution_time', evaluation.metrics.execution_time);

      return evaluation;
    } finally {
      span?.end();
    }
  }

  /**
   * Log evaluation results to Arize
   * @param {Object} evaluation - Evaluation result
   * @param {string} interactionType - Type of interaction
   * @returns {Promise<void>}
   */
  async logEvaluationToArize(evaluation, interactionType = 'general') {
    const span = this.tracer?.startSpan('log-evaluation-to-arize');
    
    try {
      // Create Arize-compatible log entry
      const arizeLog = {
        timestamp: evaluation.metadata?.timestamp || new Date().toISOString(),
        interaction_id: evaluation.metadata?.interaction_id,
        interaction_type: interactionType,
        overall_score: evaluation.overall_score,
        tone_score: evaluation.evaluations?.tone?.score,
        tool_calling_score: evaluation.evaluations?.tool_calling?.score,
        correctness_score: evaluation.evaluations?.correctness?.score,
        has_hallucinations: evaluation.evaluations?.hallucinations?.has_hallucinations,
        hallucination_count: evaluation.evaluations?.hallucinations?.hallucinated_items?.length || 0,
        metrics: evaluation.metrics || {},
        evaluation_details: evaluation.evaluations
      };

      // Log to Arize via span attributes
      span?.setAttribute('arize.evaluation.overall_score', arizeLog.overall_score);
      span?.setAttribute('arize.evaluation.tone_score', arizeLog.tone_score);
      span?.setAttribute('arize.evaluation.tool_score', arizeLog.tool_calling_score);
      span?.setAttribute('arize.evaluation.correctness_score', arizeLog.correctness_score);
      span?.setAttribute('arize.evaluation.has_hallucinations', arizeLog.has_hallucinations);
      span?.setAttribute('arize.evaluation.interaction_type', interactionType);

      // Add metrics as attributes
      if (arizeLog.metrics) {
        Object.entries(arizeLog.metrics).forEach(([key, value]) => {
          span?.setAttribute(`arize.metrics.${key}`, value);
        });
      }

      console.log('📊 Evaluation logged to Arize:', {
        interaction_id: arizeLog.interaction_id,
        overall_score: arizeLog.overall_score,
        has_hallucinations: arizeLog.has_hallucinations
      });

    } finally {
      span?.end();
    }
  }

  /**
   * Get evaluation summary for dashboard
   * @param {Array} evaluations - Array of evaluation results
   * @returns {Object} Summary statistics
   */
  getEvaluationSummary(evaluations) {
    if (!evaluations || evaluations.length === 0) {
      return {
        total_evaluations: 0,
        average_overall_score: 0,
        average_tone_score: 0,
        average_tool_score: 0,
        average_correctness_score: 0,
        hallucination_rate: 0,
        quality_trend: 'stable'
      };
    }

    const total = evaluations.length;
    const overallScores = evaluations.map(e => e.overall_score);
    const toneScores = evaluations.map(e => e.evaluations?.tone?.score || 0);
    const toolScores = evaluations.map(e => e.evaluations?.tool_calling?.score || 0);
    const correctnessScores = evaluations.map(e => e.evaluations?.correctness?.score || 0);
    const hallucinations = evaluations.filter(e => e.evaluations?.hallucinations?.has_hallucinations);

    return {
      total_evaluations: total,
      average_overall_score: this._calculateAverage(overallScores),
      average_tone_score: this._calculateAverage(toneScores),
      average_tool_score: this._calculateAverage(toolScores),
      average_correctness_score: this._calculateAverage(correctnessScores),
      hallucination_rate: (hallucinations.length / total) * 100,
      quality_trend: this._calculateTrend(overallScores)
    };
  }

  _calculateAverage(scores) {
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  }

  _calculateTrend(scores) {
    if (scores.length < 2) return 'stable';
    
    const recent = scores.slice(-5);
    const older = scores.slice(-10, -5);
    
    const recentAvg = this._calculateAverage(recent);
    const olderAvg = this._calculateAverage(older);
    
    if (recentAvg > olderAvg + 0.2) return 'improving';
    if (recentAvg < olderAvg - 0.2) return 'declining';
    return 'stable';
  }
}

// Export the service
export default ArizeEvaluationService;
