/**
 * Teams Live Test Script
 *
 * This script tests the AgentOS SDK teams resource against a live instance running at http://localhost:7777.
 * It demonstrates health checks, resource listing, and streaming patterns for teams.
 *
 * Usage:
 *   npm run test:teams
 *
 * Prerequisites:
 *   - AgentOS server running at http://localhost:7777
 *   - At least one team configured (optional for full test)
 */

import { AgentOSClient, APIError, NotFoundError, InternalServerError, TeamEventType } from '../dist/index.js';

async function main() {
  console.log('=== AgentOS SDK Teams Test ===\n');

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

  // Test 2: List Teams
  console.log('3. Listing teams...');
  try {
    const teams = await client.teams.list();
    console.log(`   ✓ Found ${teams.length} team(s)`);
    if (teams.length > 0) {
      console.log(`   First team: ${teams[0].name} (ID: ${teams[0].id})`);
    } else {
      console.log('   Note: No teams configured. Create a team to test run/stream features.');
    }
  } catch (error) {
    if (error instanceof APIError) {
      console.error('   ✗ Failed to list teams:', error.message);
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

  // Test 4: Streaming Run (if teams available)
  console.log('5. Testing streaming run...');
  try {
    const teams = await client.teams.list();

    if (teams.length === 0 || !teams[0].id) {
      console.log('   ⊘ Skipped: No teams available for streaming test');
      console.log('   Create a team in AgentOS to test streaming functionality');
    } else {
      const teamId = teams[0].id;
      console.log(`   Running team "${teams[0].name ?? 'Unnamed'}" with streaming...`);

      const stream = await client.teams.runStream(teamId, {
        message: 'Hello! This is a test message from the SDK live test script.',
        sessionId: `test-session-${Date.now()}`,
      });

      let runId: string | undefined;
      let contentReceived = '';

      try {
        for await (const event of stream) {
          switch (event.event) {
            case TeamEventType.TeamRunStarted:
              runId = event.run_id;
              console.log(`   ✓ Run started: ${runId}`);
              break;

            case TeamEventType.TeamRunContent:
              contentReceived += String(event.content ?? '');
              // Log content without newline for streaming effect
              process.stdout.write(String(event.content ?? ''));
              break;

            case TeamEventType.TeamRunCompleted:
              console.log('\n   ✓ Run completed');
              console.log(`   Metrics:`, JSON.stringify(event.metrics, null, 2));
              break;

            case TeamEventType.TeamMemoryUpdateStarted:
              console.log('   → Memory update started');
              break;

            case TeamEventType.TeamMemoryUpdateCompleted:
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
            console.error('   Team may have been deleted during run');
          } else if (streamError instanceof InternalServerError) {
            console.error('   Request ID:', streamError.requestId);
            console.error('   This may indicate team configuration issues (e.g., no model configured)');
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
    const teams = await client.teams.list();

    if (teams.length === 0 || !teams[0].id) {
      console.log('   ⊘ Skipped: No teams available for non-streaming test');
    } else {
      const teamId = teams[0].id;
      console.log(`   Running team "${teams[0].name ?? 'Unnamed'}" without streaming...`);

      // Note: This might take longer than streaming as it waits for completion
      const result = await client.teams.run(teamId, {
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
        console.error('   This may indicate team configuration issues');
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
  console.log('- Resource listing (teams, sessions): ✓');
  console.log('- Streaming pattern demonstration: ✓ (if teams available)');
  console.log('- Error handling: ✓');

  process.exit(0);
}

// Run main function and handle top-level errors
main().catch((error) => {
  console.error('\n✗ Fatal error:', error);
  process.exit(1);
});
