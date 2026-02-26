/**
 * hermesc-wrapper.js
 * Workaround for hermes-compiler missing Windows binary in RN 0.84.
 * Copies the JS bundle as-is; Hermes parses plain JS at runtime (no AOT bytecode).
 * Startup is slightly slower but functionally identical.
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let outFile = null;
let inFile = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-out') {
    outFile = args[++i];
    continue;
  }
  // Skip flags
  if (args[i].startsWith('-')) continue;
  // Non-flag argument is the input file
  inFile = args[i];
}

if (!outFile || !inFile) {
  console.error('hermesc-wrapper: missing -out or input file');
  console.error('Args:', args);
  process.exit(1);
}

try {
  // Ensure output directory exists
  const outDir = path.dirname(outFile);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.copyFileSync(inFile, outFile);
  // Also create empty source map file if -output-source-map flag is present
  if (args.includes('-output-source-map')) {
    const mapFile = outFile + '.map';
    // Create a minimal valid source map
    const sourceMap = JSON.stringify({
      version: 3,
      sources: [],
      mappings: '',
    });
    fs.writeFileSync(mapFile, sourceMap);
  }
  console.log('hermesc-wrapper: copied bundle (bytecode compilation skipped on Windows)');
} catch (err) {
  console.error('hermesc-wrapper: failed -', err.message);
  process.exit(1);
}
