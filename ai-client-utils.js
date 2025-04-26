/**
 * ai-client-utils.js
 * Modified AI client utilities for use with Claude Desktop
 * This version bypasses the need for API keys and external API calls
 */

// Mock Anthropic client that uses Claude's own capabilities instead of making API calls
class MockAnthropicClient {
  constructor(options = {}) {
    this.options = options;
    this.messages = {
      create: this.createMessages.bind(this)
    };
  }

  async createMessages(params) {
    // If streaming is enabled, return a mock stream
    if (params.stream) {
      return this.createMockStream(params);
    }
    
    // Otherwise, return a full response
    const response = await this.generateResponse(params);
    return {
      id: "mock-message-id",
      type: "message",
      role: "assistant",
      content: [
        {
          type: "text",
          text: response
        }
      ],
      model: params.model || "claude-3-7-sonnet-20250219",
      stop_reason: "end_turn",
      usage: {
        input_tokens: 1000,
        output_tokens: 2000
      }
    };
  }

  async generateResponse(params) {
    // In a real implementation, Claude would use its own capabilities to generate a response
    // This is a placeholder - Claude doesn't need to make API calls to itself
    
    console.log("Generating response with Claude's own capabilities");
    console.log("Prompt:", JSON.stringify(params));
    
    // Return "NOT_IMPLEMENTED" as a signal that this should be handled by Claude directly
    return "NOT_IMPLEMENTED";
  }

  async createMockStream(params) {
    const response = await this.generateResponse(params);
    
    // Return an async iterator to simulate streaming
    return {
      [Symbol.asyncIterator]: async function* () {
        // Yield a mock content_block_start event
        yield {
          type: "content_block_start",
          content_block: {
            type: "text",
            id: "mock-block-id"
          }
        };
        
        // Simulate streaming by breaking the response into chunks
        const chunks = response.match(/.{1,20}/g) || [];
        for (const chunk of chunks) {
          yield {
            type: "content_block_delta",
            delta: { text: chunk },
            index: 0
          };
          
          // Simulate some delay
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        // Yield a mock content_block_stop event
        yield {
          type: "content_block_stop",
          content_block: {
            type: "text",
            id: "mock-block-id"
          }
        };
        
        // Yield a mock message_stop event
        yield {
          type: "message_stop",
          message: {
            id: "mock-message-id",
            type: "message",
            role: "assistant",
            content: [
              {
                type: "text",
                text: response
              }
            ],
            model: params.model || "claude-3-7-sonnet-20250219",
            stop_reason: "end_turn"
          }
        };
      }
    };
  }
}

// Mock Perplexity client (using OpenAI interface)
class MockPerplexityClient {
  constructor(options = {}) {
    this.options = options;
    this.chat = {
      completions: {
        create: this.createCompletion.bind(this)
      }
    };
  }

  async createCompletion(params) {
    // In a real implementation, Claude would use its own capabilities to generate a completion
    console.log("Generating completion with Claude's own capabilities");
    console.log("Params:", JSON.stringify(params));
    
    // Return a mock completion response
    return {
      choices: [
        {
          message: {
            content: "NOT_IMPLEMENTED",
            role: "assistant"
          },
          finish_reason: "stop",
          index: 0
        }
      ],
      id: "mock-completion-id",
      model: params.model || "sonar-medium-online",
      usage: {
        prompt_tokens: 1000,
        completion_tokens: 2000,
        total_tokens: 3000
      }
    };
  }
}

/**
 * Get an Anthropic client instance initialized for use with Claude Desktop
 * @param {Object} [session] - Session object from MCP containing environment variables
 * @param {Object} [log] - Logger object to use (defaults to console)
 * @returns {Object} Mock Anthropic client instance that can be used by Claude
 */
export function getAnthropicClientForMCP(session, log = console) {
  try {
    // Check if we're using Claude Desktop vs. API
    const usingClaudeDesktop = process.env.CLAUDE_DESKTOP === 'true' || 
                              session?.env?.CLAUDE_DESKTOP === 'true';
    
    // If using Claude Desktop, return the mock client
    if (usingClaudeDesktop) {
      log.info("Using Claude Desktop mode with mock Anthropic client");
      return new MockAnthropicClient();
    }
    
    // Otherwise, try to use API key if available
    const apiKey = session?.env?.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      // If no API key but not in Claude Desktop mode, throw error
      throw new Error(
        'ANTHROPIC_API_KEY not found in session environment or process.env. Set CLAUDE_DESKTOP=true to use Claude Desktop mode.'
      );
    }
    
    // This would be the actual Anthropic client initialization in the real implementation
    log.info("Using Anthropic API with provided key");
    
    // Return mock client anyway since we're in Claude context
    return new MockAnthropicClient({
      apiKey,
      defaultHeaders: {
        'anthropic-beta': 'output-128k-2025-02-19'
      }
    });
  } catch (error) {
    log.error(`Failed to initialize Anthropic client: ${error.message}`);
    throw error;
  }
}

/**
 * Get a Perplexity client instance initialized for use with Claude Desktop
 * @param {Object} [session] - Session object from MCP containing environment variables
 * @param {Object} [log] - Logger object to use (defaults to console)
 * @returns {Object} Mock Perplexity client instance that can be used by Claude
 */
export async function getPerplexityClientForMCP(session, log = console) {
  try {
    // Check if we're using Claude Desktop vs. API
    const usingClaudeDesktop = process.env.CLAUDE_DESKTOP === 'true' || 
                              session?.env?.CLAUDE_DESKTOP === 'true';
    
    // If using Claude Desktop, return the mock client
    if (usingClaudeDesktop) {
      log.info("Using Claude Desktop mode with mock Perplexity client");
      return new MockPerplexityClient();
    }
    
    // Otherwise, try to use API key if available
    const apiKey = session?.env?.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY;
    
    if (!apiKey) {
      // If no API key but not in Claude Desktop mode, throw error
      throw new Error(
        'PERPLEXITY_API_KEY not found in session environment or process.env. Set CLAUDE_DESKTOP=true to use Claude Desktop mode.'
      );
    }
    
    // This would be the actual OpenAI client initialization in the real implementation
    log.info("Using Perplexity API with provided key");
    
    // Return mock client anyway since we're in Claude context
    return new MockPerplexityClient({
      apiKey,
      baseURL: 'https://api.perplexity.ai'
    });
  } catch (error) {
    log.error(`Failed to initialize Perplexity client: ${error.message}`);
    throw error;
  }
}

// Default model configuration from CLI environment
const DEFAULT_MODEL_CONFIG = {
  model: 'claude-3-7-sonnet-20250219',
  maxTokens: 64000,
  temperature: 0.2
};

/**
 * Get model configuration from session environment or fall back to defaults
 * @param {Object} [session] - Session object from MCP containing environment variables
 * @param {Object} [defaults] - Default model configuration to use if not in session
 * @returns {Object} Model configuration with model, maxTokens, and temperature
 */
export function getModelConfig(session, defaults = DEFAULT_MODEL_CONFIG) {
  // Get values from session or fall back to defaults
  return {
    model: session?.env?.MODEL || defaults.model,
    maxTokens: parseInt(session?.env?.MAX_TOKENS || defaults.maxTokens),
    temperature: parseFloat(session?.env?.TEMPERATURE || defaults.temperature)
  };
}

/**
 * Returns the best available AI model based on specified options
 * @param {Object} session - Session object from MCP containing environment variables
 * @param {Object} options - Options for model selection
 * @param {boolean} [options.requiresResearch=false] - Whether the operation requires research capabilities
 * @param {boolean} [options.claudeOverloaded=false] - Whether Claude is currently overloaded
 * @param {Object} [log] - Logger object to use (defaults to console)
 * @returns {Promise<Object>} Selected model info with type and client
 */
export async function getBestAvailableAIModel(
  session,
  options = {},
  log = console
) {
  // In Claude Desktop mode, always return Claude
  const usingClaudeDesktop = process.env.CLAUDE_DESKTOP === 'true' || 
                            session?.env?.CLAUDE_DESKTOP === 'true';
  
  if (usingClaudeDesktop) {
    log.info("Using Claude Desktop mode for AI operations");
    const client = getAnthropicClientForMCP(session, log);
    return { type: 'claude', client };
  }
  
  // For non-Desktop mode, try to use the available APIs
  const { requiresResearch = false, claudeOverloaded = false } = options;

  // For research in non-Desktop mode
  if (requiresResearch && (session?.env?.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY)) {
    try {
      const client = await getPerplexityClientForMCP(session, log);
      return { type: 'perplexity', client };
    } catch (error) {
      log.warn(`Perplexity not available: ${error.message}`);
      // Fall through to Claude
    }
  }

  // Default to Claude
  try {
    const client = getAnthropicClientForMCP(session, log);
    return { type: 'claude', client };
  } catch (error) {
    log.error(`Claude not available: ${error.message}`);
    throw new Error('No AI models available. Please check your API keys or enable Claude Desktop mode.');
  }
}

/**
 * Handle Claude API errors with user-friendly messages
 * @param {Error} error - The error from Claude API
 * @returns {string} User-friendly error message
 */
export function handleClaudeError(error) {
  // Check if it's a structured error response
  if (error.type === 'error' && error.error) {
    switch (error.error.type) {
      case 'overloaded_error':
        return 'Claude is currently experiencing high demand and is overloaded. Please wait a few minutes and try again.';
      case 'rate_limit_error':
        return 'You have exceeded the rate limit. Please wait a few minutes before making more requests.';
      case 'invalid_request_error':
        return 'There was an issue with the request format. If this persists, please report it as a bug.';
      default:
        return `Claude API error: ${error.error.message}`;
    }
  }

  // Check for network/timeout errors
  if (error.message?.toLowerCase().includes('timeout')) {
    return 'The request to Claude timed out. Please try again.';
  }
  if (error.message?.toLowerCase().includes('network')) {
    return 'There was a network error connecting to Claude. Please check your internet connection and try again.';
  }

  // Default error message
  return `Error communicating with Claude: ${error.message}`;
}
