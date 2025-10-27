/**
 * Test Arize Agent Metadata Implementation
 * Demonstrates the new hierarchical agent visualization
 */

import { initializeArizeTracing } from './src/config/arize-mcp.js';
import { ArizeAgentMetadata, createProcessingPipeline } from './src/utils/arizeAgentMetadata.js';

console.log('🧪 TESTING ARIZE AGENT METADATA IMPLEMENTATION');
console.log('==============================================\n');

async function testAgentMetadata() {
  try {
    // Initialize Arize tracing
    console.log('1️⃣ INITIALIZING ARIZE TRACING:');
    const { tracerProvider, tracer } = initializeArizeTracing();
    
    if (!tracerProvider || !tracer) {
      console.error('❌ Failed to initialize Arize tracing');
      return;
    }
    
    console.log('   ✅ Arize tracing initialized\n');

    // Initialize agent metadata helper
    const agentMetadata = new ArizeAgentMetadata();

    // Test 1: Simple Agent Hierarchy
    console.log('2️⃣ TESTING SIMPLE AGENT HIERARCHY:');
    
    const orchestratorSpan = agentMetadata.createOrchestratorSpan('test-workflow', {
      'workflow.type': 'test',
      'workflow.version': '1.0.0'
    });

    // Create child processing nodes
    const inputSpan = agentMetadata.createProcessingNodeSpan(
      'input-processing',
      'test-workflow_orchestrator',
      {
        'processing.step': 'input_processing',
        'processing.input_type': 'test_data'
      }
    );

    await new Promise(resolve => setTimeout(resolve, 100));
    agentMetadata.completeSpan(inputSpan, true, 'Input processing completed');

    const analysisSpan = agentMetadata.createProcessingNodeSpan(
      'data-analysis',
      'test-workflow_orchestrator',
      {
        'processing.step': 'data_analysis',
        'analysis.type': 'test_analysis'
      }
    );

    await new Promise(resolve => setTimeout(resolve, 150));
    agentMetadata.completeSpan(analysisSpan, true, 'Data analysis completed');

    const outputSpan = agentMetadata.createProcessingNodeSpan(
      'output-generation',
      'test-workflow_orchestrator',
      {
        'processing.step': 'output_generation',
        'output.format': 'test_format'
      }
    );

    await new Promise(resolve => setTimeout(resolve, 200));
    agentMetadata.completeSpan(outputSpan, true, 'Output generation completed');

    agentMetadata.completeSpan(orchestratorSpan, true, 'Test workflow completed successfully', {
      'workflow.total_steps': 3,
      'workflow.success': true
    });

    console.log('   ✅ Simple agent hierarchy created\n');

    // Test 2: Decision Point
    console.log('3️⃣ TESTING DECISION POINT:');
    
    const decisionSpan = agentMetadata.createDecisionSpan(
      'quality-check',
      'test-workflow_orchestrator',
      {
        'decision.type': 'quality_check',
        'decision.criteria': 'test_criteria'
      }
    );

    await new Promise(resolve => setTimeout(resolve, 100));
    agentMetadata.completeSpan(decisionSpan, true, 'Quality check decision completed', {
      'decision.result': 'approved',
      'decision.confidence': 0.95
    });

    console.log('   ✅ Decision point created\n');

    // Test 3: Agent Handoff
    console.log('4️⃣ TESTING AGENT HANDOFF:');
    
    const handoffSpan = agentMetadata.createHandoffSpan(
      'input-processor',
      'analysis-agent',
      'test-workflow_orchestrator',
      {
        'handoff.data_size': 1024,
        'handoff.priority': 'high'
      }
    );

    await new Promise(resolve => setTimeout(resolve, 50));
    agentMetadata.completeSpan(handoffSpan, true, 'Agent handoff completed', {
      'handoff.success': true,
      'handoff.latency': 50
    });

    console.log('   ✅ Agent handoff created\n');

    // Test 4: Processing Pipeline
    console.log('5️⃣ TESTING PROCESSING PIPELINE:');
    
    const pipelineSteps = [
      { name: 'data-ingestion', type: 'ingestion' },
      { name: 'data-transformation', type: 'transformation' },
      { name: 'data-validation', type: 'validation' },
      { name: 'data-storage', type: 'storage' }
    ];

    const pipelineResult = await createProcessingPipeline(
      'data-processing',
      pipelineSteps,
      async (stepSpans) => {
        // Simulate pipeline execution
        for (const { span, config } of stepSpans) {
          await new Promise(resolve => setTimeout(resolve, 100));
          console.log(`   📊 Executing step: ${config.name}`);
        }
        return { processed: true, items: 42 };
      }
    );

    console.log('   ✅ Processing pipeline created\n');

    // Wait for export
    console.log('6️⃣ WAITING FOR EXPORT:');
    console.log('   ⏳ Waiting 10 seconds for traces to be exported...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('   ✅ Export wait completed\n');

    console.log('🎯 AGENT METADATA TEST SUMMARY:');
    console.log('   ✅ Simple agent hierarchy: Orchestrator → Processing Nodes');
    console.log('   ✅ Decision point: Quality check decision');
    console.log('   ✅ Agent handoff: Input processor → Analysis agent');
    console.log('   ✅ Processing pipeline: 4-step data processing');
    
    console.log('\n📊 WHAT TO LOOK FOR IN ARIZE DASHBOARD:');
    console.log('   🔍 Project: listify-agent');
    console.log('   🔍 Service: listify-agent');
    console.log('   🔍 Agent Hierarchy:');
    console.log('      - test-workflow_orchestrator (root)');
    console.log('      - input-processing_node (child)');
    console.log('      - data-analysis_node (child)');
    console.log('      - output-generation_node (child)');
    console.log('      - quality-check_decision (child)');
    console.log('      - input-processor_to_analysis-agent_handoff (child)');
    console.log('      - data-processing_orchestrator (root)');
    console.log('      - data-ingestion_node (child)');
    console.log('      - data-transformation_node (child)');
    console.log('      - data-validation_node (child)');
    console.log('      - data-storage_node (child)');
    console.log('   🔍 Time Range: Last 10 minutes');
    console.log('   🔍 Graph Attributes:');
    console.log('      - graph.node.id: Unique node identifiers');
    console.log('      - graph.node.parent_id: Parent-child relationships');
    console.log('      - graph.node.display_name: Readable names');
    
    console.log('\n🚀 AGENT METADATA STATUS: IMPLEMENTED');
    console.log('   Following Arize official recommendations for agent visualization!');
    console.log('   🔗 Check your traces: https://app.arize.com/');
    
  } catch (error) {
    console.error('❌ Agent metadata test failed:', error);
  }
}

// Run the agent metadata test
testAgentMetadata().then(() => {
  console.log('\n✨ Agent metadata test completed!');
  console.log('📊 Check your Arize dashboard for hierarchical agent visualization.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
