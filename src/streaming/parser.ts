import { EventSourceParserStream } from "eventsource-parser/stream";
import type { StreamEvent } from "./events";

/**
 * Parse SSE response body into typed StreamEvent objects.
 *
 * Uses eventsource-parser for spec-compliant SSE parsing that handles:
 * - Chunked responses that split mid-message
 * - Multi-line data fields
 * - SSE comments and pings
 *
 * @param response - Fetch Response with SSE body
 * @param controller - AbortController for cancellation
 * @yields Typed StreamEvent objects
 *
 * @internal
 */
export async function* parseSSEResponse(
  response: Response,
  controller: AbortController,
): AsyncGenerator<StreamEvent> {
  if (!response.body) {
    throw new Error("Response body is null");
  }

  const eventStream = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new EventSourceParserStream());

  try {
    for await (const event of eventStream) {
      // Check for abort before processing
      if (controller.signal.aborted) break;

      // Skip comments and pings (no data field)
      if (!event.data) continue;

      // Parse JSON data and add event type
      const data = JSON.parse(event.data);
      yield {
        event: event.event ?? "message",
        ...data,
      } as StreamEvent;
    }
  } finally {
    // Ensure controller is aborted on completion/error
    if (!controller.signal.aborted) {
      controller.abort();
    }
  }
}
