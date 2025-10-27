/**
 * Arize Evaluation Framework for Listify Agent
 * Comprehensive LLM quality monitoring and evaluation
 */

import { getTracer } from '../config/arize-fixed.js';

// Evaluation criteria and scoring functions
export class ArizeEvaluator {
  constructor() {
    this.tracer = getTracer();
  }

  /**
   * Evaluate tone appropriateness (1-5 scale)
   * @param {string} userQuery - The user's input
   * @param {string} agentResponse - The agent's response
   * @returns {Promise<Object>} Evaluation result with score and details
   */
  async evaluateTone(userQuery, agentResponse) {
    const span = this.tracer?.startSpan('evaluate-tone');
    
    try {
      const evaluation = {
        score: this._scoreTone(agentResponse),
        criteria: {
          professionalism: this._checkProfessionalism(agentResponse),
          empathy: this._checkEmpathy(agentResponse),
          clarity: this._checkClarity(agentResponse)
        },
        timestamp: new Date().toISOString(),
        evaluation_type: 'tone'
      };

      span?.setAttribute('evaluation.score', evaluation.score);
      span?.setAttribute('evaluation.type', 'tone');
      span?.setAttribute('input.user_query', userQuery);
      span?.setAttribute('output.agent_response', agentResponse);

      return evaluation;
    } finally {
      span?.end();
    }
  }

  /**
   * Evaluate tool calling accuracy (1-5 scale)
   * @param {string} userQuery - The user's input
   * @param {string} agentResponse - The agent's response
   * @param {Array} availableTools - List of available tools
   * @returns {Promise<Object>} Evaluation result with score and details
   */
  async evaluateToolCalling(userQuery, agentResponse, availableTools = []) {
    const span = this.tracer?.startSpan('evaluate-tool-calling');
    
    try {
      const evaluation = {
        score: this._scoreToolCalling(agentResponse, availableTools),
        criteria: {
          tool_selection: this._checkToolSelection(agentResponse, availableTools),
          efficiency: this._checkToolEfficiency(agentResponse),
          safety: this._checkToolSafety(agentResponse)
        },
        timestamp: new Date().toISOString(),
        evaluation_type: 'tool_calling'
      };

      span?.setAttribute('evaluation.score', evaluation.score);
      span?.setAttribute('evaluation.type', 'tool_calling');
      span?.setAttribute('available_tools_count', availableTools.length);

      return evaluation;
    } finally {
      span?.end();
    }
  }

  /**
   * Evaluate response correctness (1-5 scale)
   * @param {string} userQuery - The user's input
   * @param {string} agentResponse - The agent's response
   * @param {Object} context - Additional context for evaluation
   * @returns {Promise<Object>} Evaluation result with score and details
   */
  async evaluateCorrectness(userQuery, agentResponse, context = {}) {
    const span = this.tracer?.startSpan('evaluate-correctness');
    
    try {
      const evaluation = {
        score: this._scoreCorrectness(agentResponse, context),
        criteria: {
          accuracy: this._checkAccuracy(agentResponse, context),
          completeness: this._checkCompleteness(userQuery, agentResponse),
          actionability: this._checkActionability(agentResponse)
        },
        timestamp: new Date().toISOString(),
        evaluation_type: 'correctness'
      };

      span?.setAttribute('evaluation.score', evaluation.score);
      span?.setAttribute('evaluation.type', 'correctness');
      span?.setAttribute('context.has_codebase_info', !!context.codebaseFiles);

      return evaluation;
    } finally {
      span?.end();
    }
  }

  /**
   * Detect hallucinations in the response
   * @param {string} agentResponse - The agent's response
   * @param {Object} context - Context including actual files, commands, etc.
   * @returns {Promise<Object>} Hallucination detection result
   */
  async detectHallucinations(agentResponse, context = {}) {
    const span = this.tracer?.startSpan('detect-hallucinations');
    
    try {
      const hallucinations = {
        has_hallucinations: false,
        hallucinated_items: [],
        confidence: 0,
        timestamp: new Date().toISOString(),
        evaluation_type: 'hallucination_detection'
      };

      // Check for file path hallucinations
      const fileHallucinations = this._checkFileHallucinations(agentResponse, context.codebaseFiles || []);
      if (fileHallucinations.length > 0) {
        hallucinations.has_hallucinations = true;
        hallucinations.hallucinated_items.push(...fileHallucinations);
      }

      // Check for command hallucinations
      const commandHallucinations = this._checkCommandHallucinations(agentResponse, context.validCommands || []);
      if (commandHallucinations.length > 0) {
        hallucinations.has_hallucinations = true;
        hallucinations.hallucinated_items.push(...commandHallucinations);
      }

      // Check for API endpoint hallucinations
      const apiHallucinations = this._checkAPIHallucinations(agentResponse, context.validEndpoints || []);
      if (apiHallucinations.length > 0) {
        hallucinations.has_hallucinations = true;
        hallucinations.hallucinated_items.push(...apiHallucinations);
      }

      hallucinations.confidence = this._calculateHallucinationConfidence(hallucinations.hallucinated_items);

      span?.setAttribute('evaluation.has_hallucinations', hallucinations.has_hallucinations);
      span?.setAttribute('evaluation.hallucination_count', hallucinations.hallucinated_items.length);
      span?.setAttribute('evaluation.confidence', hallucinations.confidence);

      return hallucinations;
    } finally {
      span?.end();
    }
  }

  /**
   * Comprehensive evaluation of a complete interaction
   * @param {Object} interaction - Complete interaction data
   * @returns {Promise<Object>} Complete evaluation result
   */
  async evaluateInteraction(interaction) {
    const span = this.tracer?.startSpan('evaluate-interaction');
    
    try {
      const { userQuery, agentResponse, context = {} } = interaction;

      // Run all evaluations in parallel
      const [tone, toolCalling, correctness, hallucinations] = await Promise.all([
        this.evaluateTone(userQuery, agentResponse),
        this.evaluateToolCalling(userQuery, agentResponse, context.availableTools),
        this.evaluateCorrectness(userQuery, agentResponse, context),
        this.detectHallucinations(agentResponse, context)
      ]);

      const overallScore = this._calculateOverallScore(tone.score, toolCalling.score, correctness.score, hallucinations.has_hallucinations);

      const evaluation = {
        overall_score: overallScore,
        evaluations: {
          tone,
          tool_calling: toolCalling,
          correctness,
          hallucinations
        },
        metadata: {
          timestamp: new Date().toISOString(),
          interaction_id: interaction.id || `interaction_${Date.now()}`,
          user_query_length: userQuery.length,
          agent_response_length: agentResponse.length
        }
      };

      span?.setAttribute('evaluation.overall_score', overallScore);
      span?.setAttribute('evaluation.tone_score', tone.score);
      span?.setAttribute('evaluation.tool_score', toolCalling.score);
      span?.setAttribute('evaluation.correctness_score', correctness.score);
      span?.setAttribute('evaluation.has_hallucinations', hallucinations.has_hallucinations);

      return evaluation;
    } finally {
      span?.end();
    }
  }

  // Private helper methods for scoring

  _scoreTone(response) {
    let score = 3; // Start with average

    // Check for professionalism indicators
    if (this._checkProfessionalism(response)) score += 1;
    if (this._checkEmpathy(response)) score += 0.5;
    if (this._checkClarity(response)) score += 0.5;

    // Check for negative indicators
    if (this._hasUnprofessionalLanguage(response)) score -= 1;
    if (this._hasConfusingLanguage(response)) score -= 0.5;

    return Math.max(1, Math.min(5, Math.round(score)));
  }

  _scoreToolCalling(response, availableTools) {
    let score = 3; // Start with average

    if (this._checkToolSelection(response, availableTools)) score += 1;
    if (this._checkToolEfficiency(response)) score += 0.5;
    if (this._checkToolSafety(response)) score += 0.5;

    return Math.max(1, Math.min(5, Math.round(score)));
  }

  _scoreCorrectness(response, context) {
    let score = 3; // Start with average

    if (this._checkAccuracy(response, context)) score += 1;
    if (this._checkCompleteness(response, context)) score += 0.5;
    if (this._checkActionability(response)) score += 0.5;

    return Math.max(1, Math.min(5, Math.round(score)));
  }

  _calculateOverallScore(toneScore, toolScore, correctnessScore, hasHallucinations) {
    let overall = (toneScore + toolScore + correctnessScore) / 3;
    
    // Penalize hallucinations heavily
    if (hasHallucinations) {
      overall *= 0.5; // Reduce score by 50% if hallucinations detected
    }

    return Math.max(1, Math.min(5, Math.round(overall * 10) / 10));
  }

  // Specific check methods

  _checkProfessionalism(response) {
    const professionalIndicators = [
      'please', 'thank you', 'i understand', 'i can help',
      'let me', 'i\'ll', 'certainly', 'absolutely'
    ];
    
    const unprofessionalIndicators = [
      'dude', 'bro', 'lol', 'haha', 'wtf', 'omg'
    ];

    const hasProfessional = professionalIndicators.some(indicator => 
      response.toLowerCase().includes(indicator)
    );
    
    const hasUnprofessional = unprofessionalIndicators.some(indicator => 
      response.toLowerCase().includes(indicator)
    );

    return hasProfessional && !hasUnprofessional;
  }

  _checkEmpathy(response) {
    const empathyIndicators = [
      'i understand', 'i can see', 'i know how', 'i\'m sorry',
      'that must be', 'i can imagine', 'let me help'
    ];

    return empathyIndicators.some(indicator => 
      response.toLowerCase().includes(indicator)
    );
  }

  _checkClarity(response) {
    // Check for clear structure and explanations
    const hasSteps = /\d+\.|step|first|then|next|finally/i.test(response);
    const hasExamples = /example|for instance|such as/i.test(response);
    const hasClearLanguage = response.length > 50 && response.length < 1000;

    return hasSteps || hasExamples || hasClearLanguage;
  }

  _checkToolSelection(response, availableTools) {
    // Check if mentioned tools are actually available
    const mentionedTools = this._extractMentionedTools(response);
    return mentionedTools.every(tool => 
      availableTools.some(available => 
        available.toLowerCase().includes(tool.toLowerCase())
      )
    );
  }

  _checkToolEfficiency(response) {
    // Check for efficient tool usage patterns
    const hasSpecificParams = /--\w+|-\w+\s+\w+/.test(response);
    const hasMultipleTools = (response.match(/npm|git|node|python/g) || []).length > 1;
    
    return hasSpecificParams && !hasMultipleTools;
  }

  _checkToolSafety(response) {
    // Check for dangerous commands
    const dangerousCommands = [
      'rm -rf', 'sudo rm', 'del /f', 'format', 'fdisk',
      'dd if=', 'mkfs', 'chmod 777'
    ];

    return !dangerousCommands.some(cmd => 
      response.toLowerCase().includes(cmd.toLowerCase())
    );
  }

  _checkAccuracy(response, context) {
    // Basic accuracy checks based on context
    if (context.codebaseFiles) {
      const mentionedFiles = this._extractFilePaths(response);
      return mentionedFiles.every(file => 
        context.codebaseFiles.some(actualFile => 
          actualFile.includes(file) || file.includes(actualFile)
        )
      );
    }
    return true; // Default to true if no context
  }

  _checkCompleteness(userQuery, response) {
    // Check if response addresses the user's question
    if (!userQuery || !response || typeof userQuery !== 'string' || typeof response !== 'string') {
      return false;
    }
    
    const queryKeywords = userQuery.toLowerCase().split(/\s+/);
    const responseKeywords = response.toLowerCase().split(/\s+/);
    
    const keywordMatches = queryKeywords.filter(keyword => 
      responseKeywords.some(responseKeyword => 
        responseKeyword.includes(keyword) || keyword.includes(responseKeyword)
      )
    );

    return keywordMatches.length / queryKeywords.length > 0.3;
  }

  _checkActionability(response) {
    // Check if response provides actionable steps
    const actionIndicators = [
      'run', 'execute', 'type', 'click', 'select', 'choose',
      'navigate', 'open', 'create', 'edit', 'modify'
    ];

    return actionIndicators.some(indicator => 
      response.toLowerCase().includes(indicator)
    );
  }

  _checkFileHallucinations(response, actualFiles) {
    const mentionedFiles = this._extractFilePaths(response);
    return mentionedFiles.filter(file => 
      !actualFiles.some(actualFile => 
        actualFile.includes(file) || file.includes(actualFile)
      )
    ).map(file => ({
      type: 'file_path',
      item: file,
      reason: 'File does not exist in codebase'
    }));
  }

  _checkCommandHallucinations(response, validCommands) {
    const mentionedCommands = this._extractCommands(response);
    return mentionedCommands.filter(cmd => 
      !validCommands.some(validCmd => 
        validCmd.includes(cmd) || cmd.includes(validCmd)
      )
    ).map(cmd => ({
      type: 'command',
      item: cmd,
      reason: 'Command does not exist or is invalid'
    }));
  }

  _checkAPIHallucinations(response, validEndpoints) {
    const mentionedEndpoints = this._extractAPIEndpoints(response);
    return mentionedEndpoints.filter(endpoint => 
      !validEndpoints.some(validEndpoint => 
        validEndpoint.includes(endpoint) || endpoint.includes(validEndpoint)
      )
    ).map(endpoint => ({
      type: 'api_endpoint',
      item: endpoint,
      reason: 'API endpoint does not exist'
    }));
  }

  _calculateHallucinationConfidence(hallucinatedItems) {
    // Higher confidence with more specific hallucinations
    const specificTypes = hallucinatedItems.filter(item => 
      item.type === 'file_path' || item.type === 'command'
    );
    
    return Math.min(1.0, 0.5 + (specificTypes.length * 0.2));
  }

  // Utility methods

  _extractMentionedTools(response) {
    const toolPatterns = [
      /npm\s+\w+/g,
      /git\s+\w+/g,
      /node\s+\w+/g,
      /python\s+\w+/g
    ];

    const tools = [];
    toolPatterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) tools.push(...matches);
    });

    return tools;
  }

  _extractFilePaths(response) {
    const filePatterns = [
      /[\w\-\.]+\/[\w\-\.\/]+\.\w+/g,
      /[\w\-\.]+\.\w+/g
    ];

    const files = [];
    filePatterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) files.push(...matches);
    });

    return files.filter(file => file.length > 3 && file.length < 100);
  }

  _extractCommands(response) {
    const commandPatterns = [
      /npm\s+run\s+\w+/g,
      /npm\s+install\s+\w+/g,
      /git\s+\w+/g,
      /node\s+\w+/g
    ];

    const commands = [];
    commandPatterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) commands.push(...matches);
    });

    return commands;
  }

  _extractAPIEndpoints(response) {
    const endpointPatterns = [
      /\/api\/[\w\-\.\/]+/g,
      /https?:\/\/[\w\-\.]+\/[\w\-\.\/]+/g
    ];

    const endpoints = [];
    endpointPatterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) endpoints.push(...matches);
    });

    return endpoints;
  }

  _hasUnprofessionalLanguage(response) {
    const unprofessionalWords = ['dude', 'bro', 'lol', 'wtf', 'omg'];
    return unprofessionalWords.some(word => 
      response.toLowerCase().includes(word)
    );
  }

  _hasConfusingLanguage(response) {
    const confusingPatterns = [
      /\?\?\?/g,
      /\.\.\./g,
      /i think maybe/g,
      /i'm not sure/g
    ];

    return confusingPatterns.some(pattern => pattern.test(response));
  }
}

// Export the evaluator class
export default ArizeEvaluator;
