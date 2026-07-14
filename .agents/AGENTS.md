# Workspace Rules

## Upload Command Behavior
- Whenever the user says **"upload"**, the agent must automatically perform a full sync:
  1. **Database Sync**: Check for any new migration files in `supabase/migrations/` and run the DDL/SQL statements directly on the remote Supabase database (using the `execute_sql` tool on the Supabase MCP server) to ensure the live database schema is up-to-date.
  2. **Consolidation**: Run the migration consolidation script (`.\push_to_github.bat` or `node scripts/merge_migrations.js`) to update `supabase_setup.sql` and `supabase_setup_min.sql`.
  3. **GitHub Push**: Stage all changes, commit them with a descriptive message, and push directly to GitHub (`git push origin main`) using the cached token configuration.
