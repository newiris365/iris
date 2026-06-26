const fs = require('fs');

const content = fs.readFileSync('supabase_setup.sql', 'utf8');
const lines = content.split('\n');

console.log("Searching for functions...");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].toLowerCase().includes('create or replace function') || lines[i].toLowerCase().includes('create function')) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
  }
}
