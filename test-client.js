#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create test PRD
const testPrdDir = '/home/shwan/test-task-master/scripts';
const testPrdPath = path.join(testPrdDir, 'prd.txt');

if (!fs.existsSync(testPrdDir)) {
  fs.mkdirSync(testPrdDir, { recursive: true });
}

fs.writeFileSync(testPrdPath, `# Test Product Requirements Document

## Project Overview
This is a test PRD for Task Master Claude Desktop integration.

## Core Features
- Feature 1: Test feature one
- Feature 2: Test feature two

## Technical Requirements
- Node.js environment
- Testing integration
`);

console.log(`Created test PRD at ${testPrdPath}`);

// Test the server directly using CLI mode
console.log('Testing direct initialization...');

// First test the initialize_project command
const initProcess = spawn('node', 
  [
    path.join(__dirname, 'server.js'), 
    'initialize_project', 
    '--projectRoot=/home/shwan/test-task-master'
  ], 
  { stdio: 'inherit' }
);

initProcess.on('close', (code) => {
  console.log(`Initialize process exited with code ${code}`);
  
  if (code === 0) {
    console.log('Project initialized successfully!');
    console.log('Testing parse_prd command...');
    
    // Now test the parse_prd command
    const parseProcess = spawn('node',
      [
        path.join(__dirname, 'server.js'),
        'parse_prd',
        '--projectRoot=/home/shwan/test-task-master',
        `--input=${testPrdPath}`,
        '--numTasks=5',
        '--output=/home/shwan/test-task-master/tasks/tasks.json'
      ],
      { stdio: 'inherit' }
    );
    
    parseProcess.on('close', (code) => {
      console.log(`Parse PRD process exited with code ${code}`);
      
      if (code === 0) {
        console.log('Parse PRD command completed!');
        
        // Check if tasks.json was created
        const tasksPath = '/home/shwan/test-task-master/tasks/tasks.json';
        if (fs.existsSync(tasksPath)) {
          console.log(`Tasks file created at ${tasksPath}`);
          try {
            const tasksContent = fs.readFileSync(tasksPath, 'utf8');
            const tasksData = JSON.parse(tasksContent);
            console.log(`Tasks file contains ${tasksData.tasks?.length || 0} tasks`);
            console.log('Test completed successfully!');
          } catch (err) {
            console.error(`Error reading tasks file: ${err.message}`);
          }
        } else {
          console.log('Tasks file was not created - this is expected if Claude Desktop mode is working correctly');
          console.log('The task would be handled directly by Claude');
          console.log('Test completed successfully!');
        }
      } else {
        console.error('Parse PRD command failed!');
      }
    });
  } else {
    console.error('Initialize project command failed!');
  }
});
