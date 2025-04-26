/**
 * parse-prd-direct.js
 * Modified direct function implementation for parsing PRD documents with Claude Desktop
 */

import path from 'path';
import fs from 'fs';
import { getAnthropicClientForMCP, getModelConfig } from './ai-client-utils.js';

/**
 * Generate tasks from PRD content using Claude's native capabilities
 * This function replaces the external API call with direct use of Claude's abilities
 * 
 * @param {string} prdContent - The content of the PRD document
 * @param {string} prdPath - Path to the PRD file (for reference)
 * @param {number} numTasks - Number of tasks to generate
 * @param {Object} options - Options for generation
 * @returns {Object} Generated tasks data
 */
async function generateTasksFromPRD(prdContent, prdPath, numTasks, options = {}) {
  const { log = console } = options;
  
  log.info(`Generating ${numTasks} tasks from PRD at ${prdPath}`);
  
  // Create the system prompt for task generation
  const systemPrompt = `You are an AI assistant tasked with breaking down a Product Requirements Document (PRD) into a set of sequential development tasks. Your goal is to create exactly ${numTasks} well-structured, actionable development tasks based on the PRD provided.

First, carefully read and analyze the attached PRD

Before creating the task list, work through the following steps inside <prd_breakdown> tags in your thinking block:

1. List the key components of the PRD
2. Identify the main features and functionalities described
3. Note any specific technical requirements or constraints mentioned
4. Outline a high-level sequence of tasks that would be needed to implement the PRD

Consider dependencies, maintainability, and the fact that you don't have access to any existing codebase. Balance between providing detailed task descriptions and maintaining a high-level perspective.

After your breakdown, create a JSON object containing an array of tasks and a metadata object. Each task should follow this structure:

{
  "id": number,
  "title": string,
  "description": string,
  "status": "pending",
  "dependencies": number[] (IDs of tasks this depends on),
  "priority": "high" | "medium" | "low",
  "details": string (implementation details),
  "testStrategy": string (validation approach)
}

Guidelines for creating tasks:
1. Number tasks from 1 to ${numTasks}.
2. Make each task atomic and focused on a single responsibility.
3. Order tasks logically, considering dependencies and implementation sequence.
4. Start with setup and core functionality, then move to advanced features.
5. Provide a clear validation/testing approach for each task.
6. Set appropriate dependency IDs (tasks can only depend on lower-numbered tasks).
7. Assign priority based on criticality and dependency order.
8. Include detailed implementation guidance in the "details" field.
9. Strictly adhere to any specific requirements for libraries, database schemas, frameworks, tech stacks, or other implementation details mentioned in the PRD.
10. Fill in gaps left by the PRD while preserving all explicit requirements.
11. Provide the most direct path to implementation, avoiding over-engineering.

The final output should be valid JSON with this structure:

{
  "tasks": [
    {
      "id": 1,
      "title": "Example Task Title",
      "description": "Brief description of the task",
      "status": "pending",
      "dependencies": [],
      "priority": "high",
      "details": "Detailed implementation guidance",
      "testStrategy": "Approach for validating this task"
    },
    // ... more tasks ...
  ],
  "metadata": {
    "projectName": "PRD Implementation",
    "totalTasks": ${numTasks},
    "sourceFile": "${prdPath}",
    "generatedAt": "${new Date().toISOString().split('T')[0]}"
  }
}

Remember to provide comprehensive task details that are LLM-friendly, consider dependencies and maintainability carefully, and keep in mind that you don't have the existing codebase as context. Aim for a balance between detailed guidance and high-level planning.

Your response should be valid JSON only, with no additional explanation or comments.`;

  // This is where Claude would normally need to analyze the PRD and generate tasks
  // Since this is running within Claude, it can directly analyze the content
  
  log.info("Claude is analyzing the PRD and generating tasks...");
  
  // In an actual implementation, Claude would parse the PRD and generate tasks here
  // For this mock version, we'll return a signal that Claude should handle this directly
  return {
    shouldBeHandledByClaudeDirectly: true,
    systemPrompt,
    userPrompt: `Here's the Product Requirements Document (PRD) to break down into ${numTasks} tasks:\n\n${prdContent}`
  };
}

/**
 * Direct function wrapper for parsing PRD documents and generating tasks.
 * Modified to work with Claude Desktop without external API calls.
 *
 * @param {Object} args - Command arguments containing input, numTasks or tasks, and output options.
 * @param {Object} log - Logger object.
 * @param {Object} context - Context object containing session data.
 * @returns {Promise<Object>} - Result object with success status and data/error information.
 */
export async function parsePRDDirect(args, log, context = {}) {
  const { session } = context;

  try {
    log.info(`Parsing PRD document with args: ${JSON.stringify(args)}`);

    // Set Claude Desktop mode for testing
    process.env.CLAUDE_DESKTOP = 'true';
    
    // Initialize AI client for PRD parsing - now uses mock client
    let aiClient;
    try {
      aiClient = getAnthropicClientForMCP(session, log);
    } catch (error) {
      log.error(`Failed to initialize AI client: ${error.message}`);
      return {
        success: false,
        error: {
          code: 'AI_CLIENT_ERROR',
          message: `Cannot initialize AI client: ${error.message}`
        },
        fromCache: false
      };
    }

    // Validate required parameters
    if (!args.projectRoot) {
      const errorMessage = 'Project root is required for parsePRDDirect';
      log.error(errorMessage);
      return {
        success: false,
        error: { code: 'MISSING_PROJECT_ROOT', message: errorMessage },
        fromCache: false
      };
    }

    if (!args.input) {
      const errorMessage = 'Input file path is required for parsePRDDirect';
      log.error(errorMessage);
      return {
        success: false,
        error: { code: 'MISSING_INPUT_PATH', message: errorMessage },
        fromCache: false
      };
    }

    if (!args.output) {
      const errorMessage = 'Output file path is required for parsePRDDirect';
      log.error(errorMessage);
      return {
        success: false,
        error: { code: 'MISSING_OUTPUT_PATH', message: errorMessage },
        fromCache: false
      };
    }

    // Resolve input path (expecting absolute path or path relative to project root)
    const projectRoot = args.projectRoot;
    const inputPath = path.isAbsolute(args.input)
      ? args.input
      : path.resolve(projectRoot, args.input);

    // Verify input file exists
    if (!fs.existsSync(inputPath)) {
      const errorMessage = `Input file not found: ${inputPath}`;
      log.error(errorMessage);
      return {
        success: false,
        error: {
          code: 'INPUT_FILE_NOT_FOUND',
          message: errorMessage,
          details: `Checked path: ${inputPath}\nProject root: ${projectRoot}\nInput argument: ${args.input}`
        },
        fromCache: false
      };
    }

    // Read the PRD content
    const prdContent = fs.readFileSync(inputPath, 'utf8');
    log.info(`Read ${prdContent.length} bytes from ${inputPath}`);

    // Resolve output path (expecting absolute path or path relative to project root)
    const outputPath = path.isAbsolute(args.output)
      ? args.output
      : path.resolve(projectRoot, args.output);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      log.info(`Creating output directory: ${outputDir}`);
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Parse number of tasks - handle both string and number values
    let numTasks = 10; // Default
    if (args.numTasks) {
      numTasks =
        typeof args.numTasks === 'string'
          ? parseInt(args.numTasks, 10)
          : args.numTasks;
      if (isNaN(numTasks)) {
        numTasks = 10; // Fallback to default if parsing fails
        log.warn(`Invalid numTasks value: ${args.numTasks}. Using default: 10`);
      }
    }

    // Extract the append flag from args
    const append = Boolean(args.append) === true;

    // Log key parameters including append flag
    log.info(
      `Preparing to parse PRD from ${inputPath} and output to ${outputPath} with ${numTasks} tasks, append mode: ${append}`
    );

    // Get model config from session
    const modelConfig = getModelConfig(session);

    // Generate tasks using Claude's native capabilities
    const result = await generateTasksFromPRD(
      prdContent,
      inputPath,
      numTasks,
      { log, session, modelConfig }
    );

    // Check if this should be handled directly by Claude
    if (result.shouldBeHandledByClaudeDirectly) {
      return {
        success: true,
        data: {
          message: "PRD parsing should be handled directly by Claude",
          shouldBeHandledByClaudeDirectly: true,
          systemPrompt: result.systemPrompt,
          userPrompt: result.userPrompt,
          outputPath,
          numTasks,
          append
        },
        fromCache: false
      };
    }

    // In the normal case, we would write the result to the output file
    // This would happen if Claude has already processed the content
    
    // Mock sample output for testing
    const sampleOutput = {
      tasks: Array.from({ length: numTasks }, (_, i) => ({
        id: i + 1,
        title: `Task ${i + 1}`,
        description: "Sample task description",
        status: "pending",
        dependencies: [],
        priority: "medium",
        details: "Sample task details",
        testStrategy: "Sample test strategy"
      })),
      metadata: {
        projectName: "PRD Implementation",
        totalTasks: numTasks,
        sourceFile: inputPath,
        generatedAt: new Date().toISOString().split('T')[0]
      }
    };

    // Write sample output to file
    fs.writeFileSync(outputPath, JSON.stringify(sampleOutput, null, 2), 'utf8');
    
    const actionVerb = append ? 'appended' : 'generated';
    const message = `Successfully ${actionVerb} ${numTasks} tasks from PRD`;
    
    log.info(message);
    
    return {
      success: true,
      data: {
        message,
        taskCount: numTasks,
        outputPath,
        appended: append
      },
      fromCache: false
    };
    
  } catch (error) {
    log.error(`Error parsing PRD: ${error.message}`);
    return {
      success: false,
      error: {
        code: 'PARSE_PRD_ERROR',
        message: error.message || 'Unknown error parsing PRD'
      },
      fromCache: false
    };
  }
}
