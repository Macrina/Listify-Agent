/**
 * Arize Agent Metadata Implementation
 * Following official Arize recommendations for agent/node visualization
 * https://arize.com/docs/ax/observe/agents/implementing-agent-metadata-for-arize
 */

import { trace } from '@opentelemetry/api';

/**
 * Agent Metadata Helper Class
 * Implements Arize's recommended agent metadata patterns
 */
export class ArizeAgentMetadata {
  constructor() {
    this.tracer = trace.getTracer('arize-agent-metadata', '1.0.0');
  }

  /**
   * Add graph attributes to spans following Arize recommendations
   * @param {Object} span - OpenTelemetry span
   * @param {string} nodeId - Unique name for the agent/node
   * @param {string} parentId - ID of the parent node (optional)
   * @param {Object} additionalAttributes - Additional attributes to set
   */
  addGraphAttributes(span, nodeId, parentId = null, additionalAttributes = {}) {
    if (!span || !span.isRecording()) return;

    // Required attributes for Arize agent visualization
    span.setAttribute('graph.node.id', nodeId);
    
    if (parentId) {
      span.setAttribute('graph.node.parent_id', parentId);
    }

    // Recommended display name (more readable)
    span.setAttribute('graph.node.display_name', nodeId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));

    // Additional metadata for better visualization
    span.setAttribute('agent.metadata.timestamp', new Date().toISOString());
    span.setAttribute('agent.metadata.version', '1.0.0');

    // Add any additional attributes
    Object.entries(additionalAttributes).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
  }

  /**
   * Create a hierarchical agent span with proper metadata
   * @param {string} operationName - Name of the operation
   * @param {string} nodeId - Unique identifier for this agent/node
   * @param {string} parentId - Parent node ID (optional)
   * @param {Object} attributes - Additional attributes
   * @returns {Object} Active span
   */
  createAgentSpan(operationName, nodeId, parentId = null, attributes = {}) {
    const span = this.tracer.startSpan(operationName, {
      attributes: {
        'openinference.span.kind': 'AGENT',
        'agent.operation': operationName,
        'agent.node_id': nodeId,
        ...attributes
      }
    });

    this.addGraphAttributes(span, nodeId, parentId, attributes);
    return span;
  }

  /**
   * Create a workflow orchestrator span (root level)
   * @param {string} workflowName - Name of the workflow
   * @param {Object} attributes - Additional attributes
   * @returns {Object} Active span
   */
  createOrchestratorSpan(workflowName, attributes = {}) {
    return this.createAgentSpan(
      `orchestrator-${workflowName}`,
      `${workflowName}_orchestrator`,
      null, // No parent for orchestrator
      {
        'agent.type': 'orchestrator',
        'agent.role': 'workflow_coordinator',
        ...attributes
      }
    );
  }

  /**
   * Create a processing node span (child level)
   * @param {string} nodeName - Name of the processing node
   * @param {string} parentId - Parent orchestrator ID
   * @param {Object} attributes - Additional attributes
   * @returns {Object} Active span
   */
  createProcessingNodeSpan(nodeName, parentId, attributes = {}) {
    return this.createAgentSpan(
      `process-${nodeName}`,
      `${nodeName}_node`,
      parentId,
      {
        'agent.type': 'processor',
        'agent.role': 'data_processor',
        ...attributes
      }
    );
  }

  /**
   * Create a decision point span
   * @param {string} decisionName - Name of the decision point
   * @param {string} parentId - Parent node ID
   * @param {Object} attributes - Additional attributes
   * @returns {Object} Active span
   */
  createDecisionSpan(decisionName, parentId, attributes = {}) {
    return this.createAgentSpan(
      `decision-${decisionName}`,
      `${decisionName}_decision`,
      parentId,
      {
        'agent.type': 'decision_maker',
        'agent.role': 'decision_point',
        ...attributes
      }
    );
  }

  /**
   * Create a handoff span for agent transitions
   * @param {string} fromAgent - Source agent ID
   * @param {string} toAgent - Target agent ID
   * @param {string} parentId - Parent node ID
   * @param {Object} attributes - Additional attributes
   * @returns {Object} Active span
   */
  createHandoffSpan(fromAgent, toAgent, parentId, attributes = {}) {
    return this.createAgentSpan(
      `handoff-${fromAgent}-to-${toAgent}`,
      `${fromAgent}_to_${toAgent}_handoff`,
      parentId,
      {
        'agent.type': 'handoff',
        'agent.role': 'transition',
        'agent.from': fromAgent,
        'agent.to': toAgent,
        ...attributes
      }
    );
  }

  /**
   * Mark span completion with status
   * @param {Object} span - OpenTelemetry span
   * @param {boolean} success - Whether the operation succeeded
   * @param {string} message - Status message
   * @param {Object} metadata - Additional completion metadata
   */
  completeSpan(span, success = true, message = 'Operation completed', metadata = {}) {
    if (!span || !span.isRecording()) return;

    // Set completion status
    span.setStatus({ 
      code: success ? 1 : 2, // 1 = OK, 2 = ERROR
      message: message 
    });

    // Add completion metadata
    span.setAttribute('agent.completion.success', success);
    span.setAttribute('agent.completion.message', message);
    span.setAttribute('agent.completion.timestamp', new Date().toISOString());

    // Add any additional completion metadata
    Object.entries(metadata).forEach(([key, value]) => {
      span.setAttribute(`agent.completion.${key}`, value);
    });

    span.end();
  }

  /**
   * Create a complete workflow with proper hierarchy
   * @param {string} workflowName - Name of the workflow
   * @param {Function} workflowFunction - Function to execute within the workflow
   * @param {Object} options - Workflow options
   * @returns {Promise} Result of the workflow function
   */
  async executeWorkflow(workflowName, workflowFunction, options = {}) {
    const orchestratorSpan = this.createOrchestratorSpan(workflowName, {
      'workflow.name': workflowName,
      'workflow.version': options.version || '1.0.0',
      'workflow.environment': options.environment || 'production'
    });

    try {
      const result = await workflowFunction(orchestratorSpan);
      this.completeSpan(orchestratorSpan, true, 'Workflow completed successfully', {
        'result_type': typeof result,
        'has_result': !!result
      });
      return result;
    } catch (error) {
      this.completeSpan(orchestratorSpan, false, `Workflow failed: ${error.message}`, {
        'error_type': error.constructor.name,
        'error_message': error.message
      });
      throw error;
    }
  }
}

/**
 * Convenience functions for common agent patterns
 */

/**
 * Create a simple agent span with metadata
 * @param {string} agentName - Name of the agent
 * @param {string} operation - Operation being performed
 * @param {string} parentId - Parent agent ID (optional)
 * @param {Object} attributes - Additional attributes
 * @returns {Object} Active span
 */
export function createAgentSpan(agentName, operation, parentId = null, attributes = {}) {
  const metadataHelper = new ArizeAgentMetadata();
  return metadataHelper.createAgentSpan(operation, agentName, parentId, attributes);
}

/**
 * Create a processing pipeline with proper hierarchy
 * @param {string} pipelineName - Name of the pipeline
 * @param {Array} steps - Array of step configurations
 * @param {Function} executor - Function to execute the pipeline
 * @returns {Promise} Pipeline result
 */
export async function createProcessingPipeline(pipelineName, steps, executor) {
  const metadataHelper = new ArizeAgentMetadata();
  
  return metadataHelper.executeWorkflow(pipelineName, async (orchestratorSpan) => {
    const orchestratorId = `${pipelineName}_orchestrator`;
    
    // Create spans for each step
    const stepSpans = steps.map((step, index) => {
      const stepSpan = metadataHelper.createProcessingNodeSpan(
        step.name,
        orchestratorId,
        {
          'pipeline.step_index': index,
          'pipeline.step_name': step.name,
          'pipeline.step_type': step.type || 'processing'
        }
      );
      
      return { span: stepSpan, config: step };
    });

    try {
      // Execute the pipeline
      const result = await executor(stepSpans);
      
      // Complete all step spans
      stepSpans.forEach(({ span }) => {
        metadataHelper.completeSpan(span, true, 'Step completed successfully');
      });
      
      return result;
    } catch (error) {
      // Complete spans with error status
      stepSpans.forEach(({ span }) => {
        metadataHelper.completeSpan(span, false, `Step failed: ${error.message}`);
      });
      throw error;
    }
  });
}

export default ArizeAgentMetadata;
