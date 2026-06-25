import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color escape codes for console logs
const RESET = '\x1b[0m';
const BACKEND_COLOR = '\x1b[36m'; // Cyan
const FRONTEND_COLOR = '\x1b[35m'; // Magenta
const SYSTEM_COLOR = '\x1b[33m';   // Yellow

console.log(`${SYSTEM_COLOR}=== STARTING AURA FULL-STACK PROJECT RUNNER ===${RESET}\n`);

// Helper to log with prefix and color
function log(prefix, color, data) {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      console.log(`${color}[${prefix}]${RESET} ${line}`);
    }
  }
}

// 1. Start Backend Server
console.log(`${SYSTEM_COLOR}[System] Starting Backend Server on port 5003...${RESET}`);
const backendDir = path.resolve(__dirname, 'backend');
const backendProcess = spawn('npm', ['run', 'dev'], {
  cwd: backendDir,
  shell: true,
  env: { ...process.env, PORT: '5003' }
});

backendProcess.stdout.on('data', (data) => log('Backend', BACKEND_COLOR, data));
backendProcess.stderr.on('data', (data) => log('Backend Error', BACKEND_COLOR, data));

// 2. Start Frontend Server
console.log(`${SYSTEM_COLOR}[System] Starting Frontend Server on port 5002...${RESET}`);
const frontendProcess = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  shell: true,
  env: { ...process.env, PORT: '5002' }
});

frontendProcess.stdout.on('data', (data) => log('Frontend', FRONTEND_COLOR, data));
frontendProcess.stderr.on('data', (data) => log('Frontend Error', FRONTEND_COLOR, data));

// Graceful cleanup handler
let isCleaningUp = false;
function cleanup() {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log(`\n${SYSTEM_COLOR}[System] Shutting down both servers gracefully...${RESET}`);
  
  try {
    backendProcess.kill('SIGINT');
  } catch (e) {}
  
  try {
    frontendProcess.kill('SIGINT');
  } catch (e) {}
  
  console.log(`${SYSTEM_COLOR}[System] Cleanup complete. Goodbye!${RESET}`);
  process.exit(0);
}

// Handle process termination events
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

// Handle child process exits
backendProcess.on('exit', (code) => {
  if (!isCleaningUp) {
    console.log(`\n${BACKEND_COLOR}[Backend] Process exited with code ${code}.${RESET}`);
    cleanup();
  }
});

frontendProcess.on('exit', (code) => {
  if (!isCleaningUp) {
    console.log(`\n${FRONTEND_COLOR}[Frontend] Process exited with code ${code}.${RESET}`);
    cleanup();
  }
});
