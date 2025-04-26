# Task Master for Claude Desktop

This is a modified version of [Task Master AI](https://github.com/eyaltoledano/claude-task-master) that works with Claude Desktop without requiring any external API keys.

## Overview

The original Task Master AI is a task management system for AI-driven development with Claude, designed to work with Cursor AI. It requires an Anthropic API key to function properly, as it makes calls to Claude's API for generating tasks and other AI-assisted features.

This modified version removes the dependency on external API calls by:

1. Detecting when it's being used by Claude Desktop
2. Using mock AI clients that simply return signals to Claude
3. Letting Claude handle the actual text generation using its own capabilities
4. Preserving the core task management functionality

## Key Modifications

### AI Client Utilities
- Replaced the Anthropic and Perplexity API clients with mock versions
- Added a `CLAUDE_DESKTOP` environment variable to toggle the mock mode
- Modified error handling to provide clear guidance for Claude Desktop users

### Parse PRD Functionality
- Updated to pass the prompt directly to Claude instead of making an API call
- Added support for generating tasks directly within Claude's context
- Preserved the file I/O and validation logic

### Server Implementation
- Simplified to focus on the core functionality
- Modified tool registration to support Claude Desktop mode
- Added initialization logic that works without external dependencies

## How It Works

When used with Claude Desktop:

1. The system initializes with `CLAUDE_DESKTOP=true` 
2. When a task would normally trigger an API call to Claude, the system instead:
   - Recognizes it's in Claude Desktop mode
   - Formulates the prompt that would normally be sent to the API
   - Returns this as a special signal to Claude
   - Claude can then process the request directly

This approach allows Task Master to work seamlessly without requiring API keys while still leveraging Claude's capabilities.

## Usage

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Make the server executable:
   ```
   chmod +x server.js
   ```

### Running with Claude Desktop

When using with Claude Desktop, the system will automatically detect it's being run in that context and will use the modified functionality.

### Available Tools

Currently, the following tools are implemented:

- `initialize_project`: Sets up the basic project structure for Task Master
- `parse_prd`: Parses a Product Requirements Document to generate tasks

More tools can be added following the same pattern.

## Extending

To add more tools from the original Task Master:

1. Create modified implementations of the functionality
2. Update the server.js to register the new tools
3. Follow the pattern of returning prompts directly to Claude instead of making API calls

## License

This project is a modified version of [Task Master AI](https://github.com/eyaltoledano/claude-task-master) and follows its original license.
