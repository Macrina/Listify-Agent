/**
 * Evaluation Middleware for Listify Agent
 * Integrates LLM evaluations into the API flow with Arize tracing
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { trace } from '@opentelemetry/api';
import { flushTraces } from '../config/arize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run Python evaluation script
 * @param {string} scriptPath - Path to Python script
 * @param {Object} data - Data to pass to script
 * @returns {Promise<Object>} - Evaluation results
 */
async function runPythonEvaluation(scriptPath, data) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '..', '..', scriptPath);
    // Use tracing-enabled version if available, fallback to regular
    const scriptToUse = scriptPath.includes('run_evaluation') 
      ? scriptPath.replace('run_evaluation', 'run_evaluation_with_tracing')
      : scriptPath;
    const finalScript = path.join(__dirname, '..', '..', scriptToUse);
    
    // Check if tracing version exists, otherwise use regular
    const fs = require('fs');
    const actualScript = fs.existsSync(finalScript) ? finalScript : path.join(__dirname, '..', '..', scriptPath);
    
    const pythonProcess = spawn('python3', [actualScript], {
      cwd: path.join(__dirname, '..', '..'),
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.stdin.write(JSON.stringify(data));
    pythonProcess.stdin.end();

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Evaluation failed: ${stderr}`));
        return;
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (e) {
        reject(new Error(`Failed to parse evaluation result: ${e.message}`));
      }
    });
  });
}

/**
 * Evaluate extracted items using all three metrics with Arize tracing
 * @param {string} inputSource - Original input (text description, image description, or URL)
 * @param {string} inputType - 'text', 'image', or 'url'
 * @param {Array} extractedItems - Items extracted by the LLM
 * @param {Span} parentSpan - Optional parent span to link evaluations to
 * @returns {Promise<Object>} - Evaluation results
 */
export async function evaluateExtractedItems(inputSource, inputType, extractedItems, parentSpan = null) {
  const tracer = trace.getTracer('listify-agent-evaluations', '1.0.0');
  
  // Create parent span for all evaluations
  const evaluationSpan = tracer.startSpan('listify-agent.evaluation.all_metrics', {
    attributes: {
      'openinference.span.kind': 'EVALUATOR',
      'evaluator.input_type': inputType,
      'evaluator.items_count': extractedItems.length,
      'evaluator.input_preview': inputSource.substring(0, 200),
      'service.name': 'listify-agent',
      'service.version': '1.0.0'
    }
  });
  
  // Link to parent span if provided
  if (parentSpan) {
    const context = trace.setSpan(trace.context.active(), parentSpan);
    trace.setSpan(context, evaluationSpan);
  }
  
  try {
    const result = await runPythonEvaluation('evaluations/run_evaluation.py', {
      input_source: inputSource,
      input_type: inputType,
      extracted_items: extractedItems
    });
    
    // Record evaluation results in span
    if (result.overall) {
      evaluationSpan.setAttribute('evaluator.overall.score', result.overall.score);
      evaluationSpan.setAttribute('evaluator.overall.passed', result.overall.passed);
      evaluationSpan.setAttribute('evaluator.overall.confidence', result.overall.confidence || 0.0);
    }
    
    if (result.extraction_accuracy) {
      evaluationSpan.setAttribute('evaluator.extraction_accuracy.score', result.extraction_accuracy.score);
      evaluationSpan.setAttribute('evaluator.extraction_accuracy.passed', result.extraction_accuracy.passed);
    }
    
    if (result.structure_compliance) {
      evaluationSpan.setAttribute('evaluator.structure_compliance.score', result.structure_compliance.score);
      evaluationSpan.setAttribute('evaluator.structure_compliance.passed', result.structure_compliance.passed);
    }
    
    if (result.content_quality) {
      evaluationSpan.setAttribute('evaluator.content_quality.score', result.content_quality.score);
      evaluationSpan.setAttribute('evaluator.content_quality.passed', result.content_quality.passed);
    }
    
    // Set span status
    if (result.overall && result.overall.passed) {
      evaluationSpan.setStatus({ code: 1, message: `Evaluations passed. Overall: ${result.overall.score.toFixed(2)}` });
    } else {
      evaluationSpan.setStatus({ code: 2, message: `Some evaluations failed. Overall: ${result.overall?.score.toFixed(2) || 0.0}` });
    }
    
    evaluationSpan.end();
    
    // Flush traces to ensure they're exported
    await flushTraces();
    
    return result;
  } catch (error) {
    console.error('Evaluation error:', error);
    
    // Record error in span
    evaluationSpan.recordException(error);
    evaluationSpan.setStatus({ code: 2, message: `Evaluation failed: ${error.message}` });
    evaluationSpan.end();
    await flushTraces();
    
    // Return default result on error
    return {
      extraction_accuracy: { score: 0.0, passed: false, explanation: error.message },
      structure_compliance: { score: 0.0, passed: false, explanation: error.message },
      content_quality: { score: 0.0, passed: false, explanation: error.message },
      overall: { score: 0.0, passed: false }
    };
  }
}

/**
 * Middleware to add evaluation results to response
 * Can be used optionally to evaluate API responses
 */
export const evaluationMiddleware = async (req, res, next) => {
  // Only evaluate if evaluation is enabled
  if (process.env.ENABLE_EVALUATIONS !== 'true') {
    return next();
  }

  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json to evaluate response
  res.json = function(data) {
    // Only evaluate if extraction was successful
    if (data.success && data.data && data.data.items && Array.isArray(data.data.items)) {
      const inputSource = req.body?.text || req.body?.url || (req.file ? `Image: ${req.file.originalname}` : 'Unknown');
      const inputType = req.body?.text ? 'text' : (req.body?.url ? 'url' : 'image');
      
      // Run evaluation asynchronously with tracing (don't block response)
      // Pass the API request span as parent for linking
      evaluateExtractedItems(inputSource, inputType, data.data.items, req.span)
        .then(evaluationResults => {
          // Log evaluation results
          console.log('📊 Evaluation Results (sent to Arize):', {
            overall_score: evaluationResults.overall?.score,
            all_passed: Object.values(evaluationResults).every(r => r.passed),
            extraction_accuracy: evaluationResults.extraction_accuracy?.score,
            structure_compliance: evaluationResults.structure_compliance?.score,
            content_quality: evaluationResults.content_quality?.score
          });
        })
        .catch(err => {
          console.error('Evaluation failed:', err);
        });
    }

    return originalJson(data);
  };

  next();
};

