#!/usr/bin/env node

/**
 * Direct test of the modified parsePRDDirect function
 */
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { parsePRDDirect } from './parse-prd.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple logger for testing
const testLogger = {
  info: (message) => console.log(`[INFO] ${message}`),
  warn: (message) => console.warn(`[WARN] ${message}`),
  error: (message) => console.error(`[ERROR] ${message}`),
  debug: (message) => console.debug(`[DEBUG] ${message}`)
};

// Create test directory and PRD
const testDir = '/home/shwan/test-task-master';
const testScriptsDir = path.join(testDir, 'scripts');
const testTasksDir = path.join(testDir, 'tasks');
const testPrdPath = path.join(testScriptsDir, 'prd.txt');
const testTasksPath = path.join(testTasksDir, 'tasks.json');

// Create directories if they don't exist
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}
if (!fs.existsSync(testScriptsDir)) {
  fs.mkdirSync(testScriptsDir, { recursive: true });
}
if (!fs.existsSync(testTasksDir)) {
  fs.mkdirSync(testTasksDir, { recursive: true });
}

// Create a test PRD file
const prdContent = `# Test Product Requirements Document

## Project Overview
This is a test PRD for Task Master Claude Desktop integration.

## Core Features
- Feature 1: Test feature one
- Feature 2: Test feature two
- Feature 3: Test feature three

## Technical Requirements
- Node.js environment
- Testing integration

## User Interface
- Simple command-line interface

## Constraints
- Testing purposes only
`;

fs.writeFileSync(testPrdPath, prdContent);
console.log(`Created test PRD at ${testPrdPath}`);

// Set up test environment
process.env.CLAUDE_DESKTOP = 'true';

// Call parsePRDDirect directly
async function runTest() {
  try {
    console.log('Testing parsePRDDirect function...');
    
    const result = await parsePRDDirect({
      projectRoot: testDir,
      input: testPrdPath,
      output: testTasksPath,
      numTasks: 5
    }, testLogger);
    
    console.log('Test completed with result:');
    console.log(JSON.stringify(result, null, 2));
    
    // Check if we got the expected result for Claude Desktop mode
    if (result.success && result.data.shouldBeHandledByClaudeDirectly) {
      console.log('\nSUCCESS: The modified code is working correctly!');
      console.log('The parsePRDDirect function correctly detected Claude Desktop mode');
      console.log('and returned the prompts instead of making an API call.');
      
      // Print some details about what would be passed to Claude
      console.log('\nSystem Prompt Preview (first 100 chars):');
      console.log(result.data.systemPrompt.substring(0, 100) + '...');
      
      console.log('\nUser Prompt Preview (first 100 chars):');
      console.log(result.data.userPrompt.substring(0, 100) + '...');
    } else {
      console.log('\nWARNING: The test did not return the expected result for Claude Desktop mode');
    }
  } catch (err) {
    console.error(`Test failed with error: ${err.message}`);
  }
}

// Run the test
runTest();
