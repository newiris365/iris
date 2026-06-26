const fs = require('fs');
const path = require('path');

// Helper to recursively find files in a directory
function getFiles(dir, ext) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        results = results.concat(getFiles(fullPath, ext));
      }
    } else {
      if (ext.includes(path.extname(file))) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

// 1. Extract referenced tables in src/
const srcFiles = getFiles(path.join(__dirname, '../src'), ['.ts', '.js']);
const referencedTables = new Map(); // table_name -> array of { file, line, lineNum, context }

srcFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    // Regex to match .from('table_name') or .from("table_name")
    const match = line.match(/\.from\(['"]([a-zA-Z0-9_-]+)['"]\)/);
    if (match) {
      const tableName = match[1];
      if (!referencedTables.has(tableName)) {
        referencedTables.set(tableName, []);
      }
      // Get context (a few lines before and after)
      const start = Math.max(0, index - 2);
      const end = Math.min(lines.length - 1, index + 8);
      const context = lines.slice(start, end).join('\n');
      
      referencedTables.get(tableName).push({
        file: path.relative(path.join(__dirname, '..'), filePath),
        lineNum: index + 1,
        lineText: line.trim(),
        context: context
      });
    }
  });
});

// 2. Extract defined tables from supabase_setup_min.sql
const sqlContent = fs.readFileSync(path.join(__dirname, '../supabase_setup_min.sql'), 'utf8');
const sqlLines = sqlContent.split('\n');
const definedTables = new Set();

sqlLines.forEach(line => {
  const match = line.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?([a-zA-Z0-9_-]+)/i);
  if (match) {
    definedTables.add(match[1].toLowerCase());
  }
});

let outputText = '';
outputText += `Total unique tables referenced in JS/TS: ${referencedTables.size}\n`;
outputText += `Total tables defined in SQL: ${definedTables.size}\n`;

// Find missing tables
const missingTables = [];
for (const table of referencedTables.keys()) {
  if (!definedTables.has(table.toLowerCase())) {
    missingTables.push(table);
  }
}

outputText += `\n=== MISSING TABLES (${missingTables.length}) ===\n`;
missingTables.sort().forEach(table => {
  const refs = referencedTables.get(table);
  outputText += `\nTable: ${table} (found ${refs.length} reference(s))\n`;
  refs.forEach(ref => {
    outputText += `  File: ${ref.file}:${ref.lineNum} -> ${ref.lineText}\n`;
    outputText += `  Context:\n${ref.context}\n  ---------------------\n`;
  });
});

fs.writeFileSync(path.join(__dirname, 'missing-tables-details.txt'), outputText, 'utf8');
console.log('Successfully wrote missing tables details in UTF-8 format.');
