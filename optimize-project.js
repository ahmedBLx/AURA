import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target directories to scan recursively
const TARGET_DIRS = ['src', 'app', 'pages', 'components'];
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

// Safe backups counter
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
 * Parses JSX attributes from an img element string.
 */
function parseAttributes(attrString) {
  const attrs = {};
  const attrRegex = /(\w+)(?:\s*=\s*(?:(?:"([^"]*)")|(?:'([^']*)')|(?:{([^}]*)})))?/g;
  let match;
  while ((match = attrRegex.exec(attrString)) !== null) {
    const name = match[1];
    let val = '';
    if (match[2] !== undefined) {
      val = match[2]; // Double quoted string
    } else if (match[3] !== undefined) {
      val = match[3]; // Single quoted string
    } else if (match[4] !== undefined) {
      val = `{${match[4]}}`; // JSX curly expression
    } else {
      val = 'true'; // Boolean attribute with no value
    }
    attrs[name] = val;
  }
  return attrs;
}

/**
 * Creates a .bak backup file for safety before writing edits.
 */
function createBackup(filePath) {
  const backupPath = `${filePath}.bak`;
  fs.copyFileSync(filePath, backupPath);
  backupCount++;
}

/**
 * Automatically processes and refactors a single file.
 */
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let fileWasModified = false;
  let needsImageImport = false;

  // 1. AUTOMATED IMAGE REPLACEMENT
  // Match standard JSX <img> tags including self-closing and paired tags
  const imgRegex = /<img\s+([^>]*?)\/?>/g;
  if (imgRegex.test(content)) {
    content = content.replace(imgRegex, (match, attrString) => {
      const attrs = parseAttributes(attrString);
      
      // We must have at least src to convert to OptimizedImage
      if (!attrs.src) return match;

      needsImageImport = true;
      fileWasModified = true;

      // Extract and normalize common properties
      const src = attrs.src.startsWith('{') ? attrs.src : `"${attrs.src}"`;
      const alt = attrs.alt ? (attrs.alt.startsWith('{') ? attrs.alt : `"${attrs.alt}"`) : '"AURA sneaker"';
      const className = attrs.className ? (attrs.className.startsWith('{') ? attrs.className : `"${attrs.className}"`) : '"object-contain"';

      // Assemble list of other parameters to pass through
      let otherProps = '';
      for (const [name, val] of Object.entries(attrs)) {
        if (['src', 'alt', 'className'].includes(name)) continue;
        const formattedVal = val.startsWith('{') ? val : `"${val}"`;
        otherProps += ` ${name}=${formattedVal}`;
      }

      return `<OptimizedImage src=${src} alt=${alt} className=${className} aspectRatio="4/3"${otherProps} />`;
    });
  }

  // Inject OptimizedImage import if tags were replaced and the import doesn't exist
  if (needsImageImport && !content.includes('import OptimizedImage')) {
    const importStatement = "import OptimizedImage from '@/components/OptimizedImage';\n";
    
    // Check if the component is a 'use client' file. If so, place import below it.
    if (content.includes("'use client'") || content.includes('"use client"')) {
      content = content.replace(/['"]use client['"];?/, (match) => `${match}\n${importStatement}`);
    } else {
      content = importStatement + content;
    }
  }

  // 2. AUTOMATED GLASSMORPHISM REPLACEMENT
  // Match className strings containing backdrop-blur classes and swap with safe-glass-card
  const glassRegex = /(["'`])([^"'`]*\bbackdrop-blur(?:-[a-z0-9]+)?\b[^"'`]*)\1/g;
  if (glassRegex.test(content)) {
    content = content.replace(glassRegex, (match, quote, classStr) => {
      const updatedClasses = classStr.replace(/\bbackdrop-blur(?:-[a-z0-9]+)?\b/g, 'safe-glass-card');
      if (updatedClasses !== classStr) {
        fileWasModified = true;
      }
      return `${quote}${updatedClasses}${quote}`;
    });
  }

  // 3. LAYOUT CONTEXT PROVIDER AUDIT (Check for bottlenecks)
  const isLayoutFile = path.basename(filePath).toLowerCase().startsWith('layout.');
  if (isLayoutFile) {
    const hasContexts = content.includes('Provider') || content.includes('Context');
    const hasMemo = content.includes('useMemo');
    if (hasContexts && !hasMemo) {
      console.warn(`[WARNING] Layout file ${filePath} uses context providers but may lack value memoization. Consider checking performance contexts.`);
    }
  }

  // Save changes if modifications occurred
  if (fileWasModified && content !== originalContent) {
    createBackup(filePath);
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
    console.log(`[REFACTORED & BACKED UP] ${filePath}`);
  }
}

/**
 * Main script runner
 */
function run() {
  console.log('====================================================');
  console.log('AURA AUTOMATED REFACTORING & OPTIMIZATION BINDINGS (ESM)');
  console.log('====================================================');
  console.log(`Scanning targets: ${TARGET_DIRS.join(', ')}`);

  let allFiles = [];
  TARGET_DIRS.forEach(dir => {
    const dirPath = path.resolve(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      allFiles = allFiles.concat(getFiles(dirPath));
    }
  });

  console.log(`Found ${allFiles.length} source code files. Executing checks...`);
  allFiles.forEach(processFile);

  console.log('====================================================');
  console.log('REFACTOR RUN COMPLETED SUCCESSFULLY!');
  console.log(`- Files Analyzed: ${allFiles.length}`);
  console.log(`- Files Safely Modified: ${modifiedCount}`);
  console.log(`- Backup Files Created (.bak): ${backupCount}`);
  console.log('====================================================');
}

run();
