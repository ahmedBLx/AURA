import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Scan configuration
const SCAN_DIR = 'src';
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

let backupCount = 0;
let modifiedCount = 0;

/**
 * Traverses directories recursively and yields file paths matching target extensions.
 */
function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getFiles(filePath, fileList);
    } else {
      const ext = path.extname(filePath).toLowerCase();
      if (EXTENSIONS.includes(ext)) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

/**
 * Dynamically computes relative path from current file to src/components/OptimizedImage
 */
function getRelativeImportPath(filePath) {
  // Target absolute component path (without extension)
  const targetComponentPath = path.resolve(process.cwd(), 'src/components/OptimizedImage');
  const fileDir = path.dirname(filePath);
  
  // Calculate relative path
  let relativePath = path.relative(fileDir, targetComponentPath);
  
  // Standardize backslashes for web paths
  relativePath = relativePath.replace(/\\/g, '/');
  
  // Enforce relative prefixing
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }
  
  return relativePath;
}

/**
 * Creates safety backup file
 */
function createBackup(filePath) {
  const backupPath = `${filePath}.bak`;
  // Only create a backup if it doesn't already exist or if we want to overwrite
  fs.copyFileSync(filePath, backupPath);
  backupCount++;
}

/**
 * Scans, audits, and fixes specific compilation and syntax issues in a file
 */
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let fileWasModified = false;

  // 1. RESTORE SPECIFIC CORRUPTED TEMPLATE LITERAL IN QuickViewModal.jsx
  // This cleans up the broken template literal tag if present in the file
  const corruptedImageRegex = /<OptimizedImage[^>]*src=\{img\}[^>]*1="true"[^>]*\/>/g;
  if (corruptedImageRegex.test(content)) {
    console.log(`[CORRUPT IMAGE TAG FOUND] Fixing template literal in: ${filePath}`);
    content = content.replace(corruptedImageRegex, '<OptimizedImage src={img} alt={`\${product.name} thumbnail \${idx + 1}`} className="object-contain" aspectRatio="4/3" style={{ width: \'100%\', height: \'100%\', objectFit: \'contain\' }} />');
    fileWasModified = true;
  }

  // 2. FIX THE STYLE SYNTAX ERROR (style={{ ... } /> to style={{ ... }} />)
  // Restricts replacement to style props inside <OptimizedImage tags that end with a single brace
  const styleSyntaxRegex = /(<OptimizedImage[^>]*\s+style=\{\{[^{}]+)\}(?!\})\s*\/?>/g;
  if (styleSyntaxRegex.test(content)) {
    content = content.replace(styleSyntaxRegex, '$1}} />');
    fileWasModified = true;
  }

  // 3. CONVERT PATH ALIASES TO RELATIVE IMPORTS (@/components/OptimizedImage to relative)
  const importRegex = /import\s+OptimizedImage\s+from\s+['"]@\/components\/OptimizedImage['"]/g;
  if (importRegex.test(content)) {
    const relativePath = getRelativeImportPath(filePath);
    content = content.replace(importRegex, `import OptimizedImage from '${relativePath}'`);
    fileWasModified = true;
  }

  // Save changes if edits were made
  if (fileWasModified && content !== originalContent) {
    createBackup(filePath);
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
    console.log(`[FIXED & BACKED UP] ${filePath}`);
  }
}

function run() {
  console.log('====================================================');
  console.log('AURA COMPILATION & BUILD FIXER SCRIPT');
  console.log('====================================================');
  
  const scanPath = path.resolve(process.cwd(), SCAN_DIR);
  if (!fs.existsSync(scanPath)) {
    console.error(`Error: Target directory '${SCAN_DIR}' does not exist.`);
    return;
  }

  const files = getFiles(scanPath);
  console.log(`Scanning ${files.length} files in '${SCAN_DIR}' for syntax and path errors...`);
  
  files.forEach(processFile);

  console.log('====================================================');
  console.log('FIX RUN COMPLETED SUCCESSFULLY!');
  console.log(`- Files Analyzed: ${files.length}`);
  console.log(`- Files Corrected: ${modifiedCount}`);
  console.log(`- Backups Generated: ${backupCount}`);
  console.log('====================================================');
}

run();
