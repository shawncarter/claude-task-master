#!/usr/bin/env node

import { FastMCP } from 'fastmcp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { parsePRDDirect } from './parse-prd.js';

// Constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple logger
const logger = {
  info: (message) => console.log(`[INFO] ${message}`),
  error: (message) => console.error(`[ERROR] ${message}`),
  warn: (message) => console.warn(`[WARN] ${message}`),
  debug: (message) => console.debug(`[DEBUG] ${message}`)
};

/**
 * Modified MCP server class for Task Master that works with Claude Desktop
 */
class ClaudeDesktopTaskMasterServer {
  constructor() {
    // Get version information
    const version = '1.0.0-claude-desktop';

    this.options = {
      name: 'Task Master MCP Server (Claude Desktop)',
      version
    };

    this.server = new FastMCP(this.options);
    this.initialized = false;

    // Bind methods
    this.init = this.init.bind(this);
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);

    // Setup logging
    this.logger = logger;
    
    // Set Claude Desktop mode
    process.env.CLAUDE_DESKTOP = 'true';
  }

  /**
   * Initialize the MCP server with necessary tools
   */
  async init() {
    if (this.initialized) return;

    // Register the parse_prd tool
    this.server.addTool({
      name: 'parse_prd',
      description: "Parse a Product Requirements Document (PRD) text file to automatically generate initial tasks. Reinitializing the project is not necessary to run this tool. It is recommended to run parse-prd after initializing the project and creating/importing a prd.txt file in the project root's scripts/ directory.",
      parameters: {
        type: 'object',
        properties: {
          input: {
            type: 'string',
            description: 'Absolute path to the PRD document file (.txt, .md, etc.)',
            default: 'scripts/prd.txt'
          },
          numTasks: {
            type: 'string',
            description: 'Approximate number of top-level tasks to generate (default: 10). As the agent, if you have enough information, ensure to enter a number of tasks that would logically scale with project complexity. Avoid entering numbers above 50 due to context window limitations.'
          },
          output: {
            type: 'string',
            description: 'Output path for tasks.json file (default: tasks/tasks.json)'
          },
          force: {
            type: 'boolean',
            description: 'Allow overwriting an existing tasks.json file.'
          },
          append: {
            type: 'boolean',
            description: 'Append new tasks to existing tasks.json instead of overwriting'
          },
          projectRoot: {
            type: 'string',
            description: 'The directory of the project. Must be absolute path.'
          }
        },
        required: ['projectRoot']
      },
      execute: async (args, { log, session }) => {
        try {
          log.info(`Parsing PRD with args: ${JSON.stringify(args)}`);
          
          // Call the direct function with the parsed arguments
          const result = await parsePRDDirect(args, log, { session });
          
          // Check if we should handle this directly with Claude
          if (result.success && result.data.shouldBeHandledByClaudeDirectly) {
            log.info("Request should be handled directly by Claude's capabilities");
            
            // Return the prompts for Claude to process
            return {
              success: true,
              data: {
                message: "This task should be handled directly by Claude's capabilities",
                systemPrompt: result.data.systemPrompt,
                userPrompt: result.data.userPrompt,
                outputPath: result.data.outputPath,
                numTasks: result.data.numTasks,
                append: result.data.append
              }
            };
          }
          
          return result;
        } catch (error) {
          log.error(`Error in parse-prd tool: ${error.message}`);
          return {
            success: false,
            error: {
              message: error.message
            }
          };
        }
      }
    });

    // Register the initialize_project tool
    this.server.addTool({
      name: 'initialize_project',
      description: "Initializes a new Task Master project structure by calling the core initialization logic. Creates necessary folders and configuration files for Task Master in the current directory.",
      parameters: {
        type: 'object',
        properties: {
          projectRoot: {
            type: 'string',
            description: 'The root directory for the project. ALWAYS SET THIS TO THE PROJECT ROOT DIRECTORY. IF NOT SET, THE TOOL WILL NOT WORK.'
          },
          skipInstall: {
            type: 'boolean',
            default: false,
            description: 'Skip installing dependencies automatically. Never do this unless you are sure the project is already installed.'
          },
          addAliases: {
            type: 'boolean',
            default: false,
            description: 'Add shell aliases (tm, taskmaster) to shell config file.'
          },
          yes: {
            type: 'boolean',
            default: true,
            description: 'Skip prompts and use default values. Always set to true for MCP tools.'
          }
        },
        required: ['projectRoot']
      },
      execute: async (args, { log, session }) => {
        try {
          log.info(`Initializing project at ${args.projectRoot}`);
          
          // Create directory structure
          const dirs = [
            path.join(args.projectRoot, 'scripts'),
            path.join(args.projectRoot, 'tasks')
          ];
          
          for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
              log.info(`Created directory: ${dir}`);
            }
          }
          
          // Create example PRD file if it doesn't exist
          const examplePrdPath = path.join(args.projectRoot, 'scripts', 'example_prd.txt');
          if (!fs.existsSync(examplePrdPath)) {
            fs.writeFileSync(examplePrdPath, `# Example Product Requirements Document

## Project Overview
Describe your project here. What problem does it solve? Who is it for?

## Core Features
- Feature 1: Description of feature 1
- Feature 2: Description of feature 2
- Feature 3: Description of feature 3

## Technical Requirements
- Platform/environment
- Dependencies/libraries
- Performance requirements
- Security requirements

## User Interface
- Design guidelines
- User interaction flows
- Accessibility requirements

## Milestones
- Alpha release: Key features and target date
- Beta release: Features and target date
- v1.0 release: Final feature set and launch date

## Constraints
- Time constraints
- Budget constraints
- Technical constraints`, 'utf8');
            log.info(`Created example PRD at ${examplePrdPath}`);
          }
          
          // Create empty tasks.json file
          const tasksJsonPath = path.join(args.projectRoot, 'tasks', 'tasks.json');
          if (!fs.existsSync(tasksJsonPath)) {
            fs.writeFileSync(tasksJsonPath, JSON.stringify({
              tasks: [],
              metadata: {
                projectName: path.basename(args.projectRoot),
                totalTasks: 0,
                generatedAt: new Date().toISOString().split('T')[0]
              }
            }, null, 2), 'utf8');
            log.info(`Created empty tasks.json at ${tasksJsonPath}`);
          }
          
          return {
            success: true,
            data: {
              message: "Project initialized successfully.",
              next_step: "Now that the project is initialized, the next step is to create the tasks by parsing a PRD. This will create the tasks folder and the initial task files (tasks folder will be created when parse-prd is run). The parse-prd tool will require a prd.txt file as input (typically found in the project root directory, scripts/ directory). You can create a prd.txt file by asking the user about their idea, and then using the scripts/example_prd.txt file as a template to genrate a prd.txt file in scripts/. You may skip all of this if the user already has a prd.txt file. You can THEN use the parse-prd tool to create the tasks. So: step 1 after initialization is to create a prd.txt file in scripts/prd.txt or confirm the user already has one. Step 2 is to use the parse-prd tool to create the tasks. Do not bother looking for tasks after initialization, just use the parse-prd tool to create the tasks after creating a prd.txt from which to parse the tasks. You do NOT need to reinitialize the project to parse-prd."
            }
          };
        } catch (error) {
          log.error(`Error initializing project: ${error.message}`);
          return {
            success: false,
            error: {
              message: error.message
            }
          };
        }
      }
    });

    // Register more tools here as needed
    
    this.initialized = true;
    return this;
  }

  /**
   * Start the MCP server
   */
  async start() {
    if (!this.initialized) {
      await this.init();
    }

    // Start the FastMCP server with increased timeout
    await this.server.start({
      transportType: 'stdio',
      timeout: 120000 // 2 minutes timeout (in milliseconds)
    });

    return this;
  }

  /**
   * Stop the MCP server
   */
  async stop() {
    if (this.server) {
      await this.server.stop();
    }
  }
}

/**
 * Start the MCP server
 */
async function startServer() {
  const server = new ClaudeDesktopTaskMasterServer();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.stop();
    process.exit(0);
  });

  try {
    await server.start();
  } catch (error) {
    logger.error(`Failed to start MCP server: ${error.message}`);
    process.exit(1);
  }
}

// Start the server
startServer();
