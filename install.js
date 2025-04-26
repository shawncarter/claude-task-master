#!/usr/bin/env node

/**
 * Installation script for Task Master Claude Desktop
 * This script sets up the modified version of Task Master for use with Claude Desktop
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color output for terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

// Log with color
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Run a command and return a promise
function runCommand(command, args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    log(`Running: ${command} ${args.join(' ')}`, colors.dim);
    
    const proc = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    proc.on('error', (err) => {
      reject(err);
    });
  });
}

// Main installation function
async function install() {
  try {
    log('Starting Task Master Claude Desktop installation...', colors.bright + colors.blue);
    
    // Install dependencies
    log('\n📦 Installing dependencies...', colors.bright + colors.yellow);
    await runCommand('npm', ['install'], __dirname);
    
    // Make server executable
    log('\n🔧 Making server executable...', colors.bright + colors.yellow);
    fs.chmodSync(path.join(__dirname, 'server.js'), '755');
    
    // Create symbolic link in user's bin directory (optional)
    const createSymlink = true; // Change to false to skip this step
    
    if (createSymlink) {
      try {
        const userBinDir = path.join(process.env.HOME, '.local', 'bin');
        
        // Create user bin directory if it doesn't exist
        if (!fs.existsSync(userBinDir)) {
          log(`\n📁 Creating user bin directory: ${userBinDir}`, colors.bright + colors.yellow);
          fs.mkdirSync(userBinDir, { recursive: true });
        }
        
        const symlinkPath = path.join(userBinDir, 'task-master-claude');
        const targetPath = path.join(__dirname, 'server.js');
        
        // Remove existing symlink if it exists
        if (fs.existsSync(symlinkPath)) {
          log(`\n🔄 Removing existing symlink: ${symlinkPath}`, colors.bright + colors.yellow);
          fs.unlinkSync(symlinkPath);
        }
        
        // Create symlink
        log(`\n🔗 Creating symlink: ${symlinkPath} -> ${targetPath}`, colors.bright + colors.yellow);
        fs.symlinkSync(targetPath, symlinkPath);
        
        log(`\n✅ Symlink created: ${symlinkPath}`, colors.bright + colors.green);
        log(`Add ${userBinDir} to your PATH if it's not already there.`, colors.dim);
      } catch (err) {
        log(`\n⚠️ Could not create symlink: ${err.message}`, colors.bright + colors.red);
        log('You can still run the server directly with: node server.js', colors.dim);
      }
    }
    
    log('\n✅ Installation completed successfully!', colors.bright + colors.green);
    log('\nTo use Task Master Claude Desktop:', colors.bright);
    log('1. Add this directory to your Cursor MCP settings:', colors.reset);
    log(`   ${__dirname}`, colors.bright + colors.blue);
    log('2. Use with Claude Desktop to manage tasks without API keys', colors.reset);
    
  } catch (err) {
    log(`\n❌ Installation failed: ${err.message}`, colors.bright + colors.red);
    process.exit(1);
  }
}

// Run the installation
install();
