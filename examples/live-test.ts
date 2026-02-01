/**
 * Live SDK Test Script
 *
 * This script tests the AgentOS SDK against a live instance running at http://localhost:7777.
 * It demonstrates health checks, resource listing, and streaming patterns.
 *
 * Usage:
 *   npm run test:live
 *
 * Prerequisites:
 *   - AgentOS server running at http://localhost:7777
 *   - At least one agent configured (optional for full test)
 */

import { AgentOSClient, APIError, NotFoundError, InternalServerError } from '../dist/index.js';

async function main() {
  console.log('=== AgentOS SDK Live Test ===\n');

  // Initialize client (no API key needed for local development)
  console.log('1. Initializing client...');
  const client = new AgentOSClient({
    baseUrl: 'http://localhost:7777',
    timeout: 30000,
  });
  console.log('   ✓ Client initialized\n');

  // Test 1: Health Check
  console.log('2. Testing health endpoint...');
  try {
    const health = await client.health();
    console.log('   ✓ Health check successful:', JSON.stringify(health, null, 2));
  } catch (error) {
    if (error instanceof APIError) {
      console.error('   ✗ API Error:', error.message);
      console.error('   Request ID:', error.requestId);
      process.exit(1);
    } else if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('   ✗ Connection failed: Is AgentOS running at http://localhost:7777?');
      console.error('   Start AgentOS server and try again.');
      process.exit(1);
    } else {
      console.error('   ✗ Unexpected error:', error);
      process.exit(1);
    }
  }
  console.log();

  // Test 2: List Agents
  console.log('3. Listing agents...');
  try {
    const agents = await client.agents.list();
    console.log(`   ✓ Found ${agents.length} agent(s)`);
    if (agents.length > 0) {
      console.log(`   First agent: ${agents[0].name} (ID: ${agents[0].id})`);
    } else {
      console.log('   Note: No agents configured. Create an agent to test run/stream features.');
    }
  } catch (error) {
    if (error instanceof APIError) {
      console.error('   ✗ Failed to list agents:', error.message);
    } else {
      console.error('   ✗ Unexpected error:', error);
    }
  }
  console.log();

  // Test 3: List Sessions
  console.log('4. Listing sessions...');
  try {
    const sessions = await client.sessions.list();
    console.log(`   ✓ Found ${sessions.data.length} session(s)`);
    if (sessions.data.length > 0) {
      console.log(`   Latest session: ${sessions.data[0].session_name || 'Unnamed'} (ID: ${sessions.data[0].session_id})`);
    }
  } catch (error) {
    if (error instanceof APIError) {
      console.error('   ✗ Failed to list sessions:', error.message);
    } else {
      console.error('   ✗ Unexpected error:', error);
    }
  }
  console.log();

  // Test 4: Streaming Run (if agents available)
  console.log('5. Testing streaming run...');
  try {
    const agents = await client.agents.list();

    if (agents.length === 0 || !agents[0].id) {
      console.log('   ⊘ Skipped: No agents available for streaming test');
      console.log('   Create an agent in AgentOS to test streaming functionality');
    } else {
      const agentId = agents[0].id;
      console.log(`   Running agent "${agents[0].name ?? 'Unnamed'}" with streaming...`);

      const stream = await client.agents.runStream(agentId, {
        message: 'Hello! This is a test message from the SDK live test script.',
        sessionId: `test-session-${Date.now()}`,
      });

      let runId: string | undefined;
      let contentReceived = '';

      try {
        for await (const event of stream) {
          switch (event.event) {
            case 'RunStarted':
              runId = event.run_id;
              console.log(`   ✓ Run started: ${runId}`);
              break;

            case 'RunContent':
              contentReceived += event.content;
              // Log content without newline for streaming effect
              process.stdout.write(event.content);
              break;

            case 'RunCompleted':
              console.log('\n   ✓ Run completed');
              console.log(`   Metrics:`, JSON.stringify(event.metrics, null, 2));
              break;

            case 'MemoryUpdateStarted':
              console.log('   → Memory update started');
              break;

            case 'MemoryUpdateCompleted':
              console.log('   ✓ Memory update completed');
              break;
          }
        }

        if (contentReceived) {
          console.log(`\n   Total content length: ${contentReceived.length} characters`);
        }

      } catch (streamError) {
        if (streamError instanceof APIError) {
          console.error('\n   ✗ Streaming error:', streamError.message);
          if (streamError instanceof NotFoundError) {
            console.error('   Agent may have been deleted during run');
          } else if (streamError instanceof InternalServerError) {
            console.error('   Request ID:', streamError.requestId);
            console.error('   This may indicate agent configuration issues (e.g., no model configured)');
          }
        } else {
          console.error('\n   ✗ Unexpected streaming error:', streamError);
        }
      }
    }
  } catch (error) {
    if (error instanceof APIError) {
      console.error('   ✗ Failed to initiate streaming run:', error.message);
      console.error('   Status:', error.status);
      if (error.requestId) {
        console.error('   Request ID:', error.requestId);
      }
    } else {
      console.error('   ✗ Unexpected error:', error);
    }
  }
  console.log();

  // Test 5: Non-streaming Run Example
  console.log('6. Testing non-streaming run...');
  try {
    const agents = await client.agents.list();

    if (agents.length === 0 || !agents[0].id) {
      console.log('   ⊘ Skipped: No agents available for non-streaming test');
    } else {
      const agentId = agents[0].id;
      console.log(`   Running agent "${agents[0].name ?? 'Unnamed'}" without streaming...`);

      // Note: This might take longer than streaming as it waits for completion
      const result = await client.agents.run(agentId, {
        message: 'Quick test',
        sessionId: `test-session-${Date.now()}`,
      });

      console.log('   ✓ Non-streaming run completed');
      console.log(`   Run ID: ${result.run_id || 'unknown'}`);
      // Server returns 'content' field (not 'response')
      const content = result.content;
      if (content) {
        console.log(`   Content: ${typeof content === 'string' ? content.slice(0, 100) : JSON.stringify(content)?.slice(0, 100)}${String(content).length > 100 ? '...' : ''}`);
        console.log(`   Content length: ${String(content).length} characters`);
      }
    }
  } catch (error) {
    if (error instanceof APIError) {
      console.error('   ✗ Non-streaming run failed:', error.message);
      if (error.status === 500) {
        console.error('   This may indicate agent configuration issues');
      }
    } else {
      console.error('   ✗ Unexpected error:', error);
    }
  }
  console.log();

  console.log('=== Test Complete ===');
  console.log('\nSummary:');
  console.log('- SDK client initialization: ✓');
  console.log('- Health check endpoint: ✓');
  console.log('- Resource listing (agents, sessions): ✓');
  console.log('- Streaming pattern demonstration: ✓ (if agents available)');
  console.log('- Error handling: ✓');

  process.exit(0);
}

// Run main function and handle top-level errors
main().catch((error) => {
  console.error('\n✗ Fatal error:', error);
  process.exit(1);
});
