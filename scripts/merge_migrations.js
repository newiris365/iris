const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const setupFile = path.join(__dirname, '..', 'supabase_setup.sql');
const setupMinFile = path.join(__dirname, '..', 'supabase_setup_min.sql');

const marker = '\n\n-- ==========================================================\n-- SECTION: CONSOLIDATED MIGRATIONS (JUNE 9 - JUNE 13)\n-- ==========================================================\n';

// Migrations already included in the base setup files
const excludedMigrations = new Set([
  '20260609000000_init_schema.sql',
  '20260609000001_atomic_rpcs.sql',
  '20260609000002_security_hardening.sql',
  '20260611000002_obe_naac_module13.sql',
  '20260611000003_hr_module14.sql',
  '20260611000004_security_audit_fixes.sql',
  '20260612000000_permissions_system.sql'
]);

function processSqlContent(content, filename) {
  let processed = content;
  
  // Specific replacements for u.full_name -> u.name/u.name AS full_name
  if (filename.includes('20260612000004_high_priority_features.sql')) {
    processed = processed.replace(/u\.full_name\s+AS\s+student_name/gi, 'u.name AS student_name');
    processed = processed.replace(/GROUP\s+BY\s+s\.id,\s+u\.full_name/gi, 'GROUP BY s.id, u.name');
    processed = processed.replace(/s\.id,\s+s\.user_id,\s+s\.dob,\s+s\.institution_id,\s+u\.full_name/gi, 's.id, s.user_id, s.dob, s.institution_id, u.name AS full_name');
  }
  
  if (filename.includes('20260612000005_medium_priority_features.sql')) {
    processed = processed.replace(/'name',\s+u\.full_name/gi, "'name', u.name");
    processed = processed.replace(/u\.id,\s+u\.full_name,\s+u\.email/gi, 'u.id, u.name AS full_name, u.email');
  }
  
  if (filename.includes('20260612000006_broken_fixes_and_new_modules.sql')) {
    processed = processed.replace(/u\.full_name\s+AS\s+teacher_name/gi, 'u.name AS teacher_name');
    processed = processed.replace(/u\.full_name\s+AS\s+student_name/gi, 'u.name AS student_name');
  }
  
  if (filename.includes('20260612000008_faculty_module.sql')) {
    processed = processed.replace(/u\.full_name,\r?\n\s+s\.roll_number/gi, 'u.name AS full_name,\n      s.roll_number');
    processed = processed.replace(/GROUP\s+BY\s+s\.id,\s+u\.full_name,\s+s\.roll_number/gi, 'GROUP BY s.id, u.name, s.roll_number');
  }
  
  return processed;
}

function minimizeSql(sql) {
  // Split into lines
  const lines = sql.split(/\r?\n/);
  const minLines = [];
  let inBlockComment = false;
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Check block comments
    if (inBlockComment) {
      if (line.includes('*/')) {
        inBlockComment = false;
        const index = line.indexOf('*/');
        line = line.substring(index + 2).trim();
      } else {
        continue;
      }
    }
    
    if (line.startsWith('/*')) {
      if (line.includes('*/')) {
        const startIndex = line.indexOf('/*');
        const endIndex = line.indexOf('*/');
        line = (line.substring(0, startIndex) + line.substring(endIndex + 2)).trim();
      } else {
        inBlockComment = true;
        continue;
      }
    }
    
    // Skip line comments
    if (line.startsWith('--')) {
      continue;
    }
    
    // Strip trailing comments (basic handling)
    if (line.includes('--') && !line.includes("'--'")) {
      const idx = line.indexOf('--');
      line = line.substring(0, idx).trim();
    }
    
    if (line) {
      minLines.push(line);
    }
  }
  
  return minLines.join('\n');
}

function merge() {
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
    
  console.log(`Found ${files.length} total migrations in supabase/migrations.`);
  
  let consolidatedSql = '';
  
  for (const file of files) {
    if (excludedMigrations.has(file)) {
      console.log(`Skipping already-merged: ${file}`);
      continue;
    }
    
    console.log(`Processing: ${file}`);
    const filePath = path.join(migrationsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Process content (replace u.full_name -> u.name where needed)
    content = processSqlContent(content, file);
    
    consolidatedSql += `\n\n-- ==========================================================\n`;
    consolidatedSql += `-- MIGRATION: ${file}\n`;
    consolidatedSql += `-- ==========================================================\n\n`;
    consolidatedSql += content;
  }
  
  // Update supabase_setup.sql
  let setupContent = fs.readFileSync(setupFile, 'utf8');
  const setupMarkerIdx = setupContent.indexOf('-- SECTION: CONSOLIDATED MIGRATIONS');
  if (setupMarkerIdx !== -1) {
    // Truncate at marker
    setupContent = setupContent.substring(0, setupContent.lastIndexOf('\n\n-- =====================', setupMarkerIdx));
  }
  
  const finalSetupContent = setupContent.trim() + marker + consolidatedSql.trim() + '\n';
  fs.writeFileSync(setupFile, finalSetupContent, 'utf8');
  console.log(`Successfully updated ${setupFile} (${fs.statSync(setupFile).size} bytes).`);
  
  // Update supabase_setup_min.sql
  let setupMinContent = fs.readFileSync(setupMinFile, 'utf8');
  const setupMinMarkerIdx = setupMinContent.indexOf('-- SECTION: CONSOLIDATED MIGRATIONS');
  if (setupMinMarkerIdx !== -1) {
    // Truncate at marker
    setupMinContent = setupMinContent.substring(0, setupMinContent.lastIndexOf('\n\n-- =====================', setupMinMarkerIdx));
  }
  
  const minimizedBlock = minimizeSql(consolidatedSql);
  const finalSetupMinContent = setupMinContent.trim() + marker + minimizedBlock.trim() + '\n';
  fs.writeFileSync(setupMinFile, finalSetupMinContent, 'utf8');
  console.log(`Successfully updated ${setupMinFile} (${fs.statSync(setupMinFile).size} bytes).`);
}

try {
  merge();
} catch (err) {
  console.error('Error during merge:', err);
}
