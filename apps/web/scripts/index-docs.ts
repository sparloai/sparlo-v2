/**
 * Documentation Indexing Script
 *
 * Run with: npx tsx apps/web/scripts/index-docs.ts
 *
 * Indexes documentation from /docs into Supabase help_docs table
 * Uses PostgreSQL full-text search (no external embedding service needed)
 */
import { config } from 'dotenv';
import * as fs from 'fs';
import matter from 'gray-matter';
import * as path from 'path';

import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = ['.md', '.mdx'];
const MAX_DEPTH = 10;

// Validate environment
function validateEnv() {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }
}

// Validate file path to prevent directory traversal
function validateFilePath(filePath: string, docsRoot: string): boolean {
  const normalized = path.normalize(filePath);
  const relative = path.relative(docsRoot, normalized);
  return !relative.startsWith('..') && !path.isAbsolute(relative);
}

// Extract section from the file path
function extractSection(filePath: string, docsPath: string): string | null {
  const relative = path.relative(docsPath, filePath);
  const parts = relative.split(path.sep);
  return parts.length > 1 ? parts[0] : null;
}

// Clean markdown content for better search
function cleanMarkdownForSearch(content: string): string {
  return (
    content
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code
      .replace(/`[^`]+`/g, '')
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove images
      .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
      // Remove HTML tags
      .replace(/<[^>]+>/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

async function loadDocs(docsPath: string) {
  const docs: Array<{
    title: string;
    content: string;
    slug: string;
    section: string | null;
  }> = [];
  const docsRoot = path.resolve(docsPath);

  function walkDir(dir: string, depth = 0) {
    if (depth > MAX_DEPTH) {
      console.warn(`Skipping deep directory: ${dir}`);
      return;
    }

    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);

      // Validate path
      if (!validateFilePath(filePath, docsRoot)) {
        console.warn(`Skipping invalid path: ${filePath}`);
        continue;
      }

      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walkDir(filePath, depth + 1);
      } else if (ALLOWED_EXTENSIONS.some((ext) => file.endsWith(ext))) {
        // Check file size
        if (stat.size > MAX_FILE_SIZE) {
          console.warn(`Skipping large file: ${filePath} (${stat.size} bytes)`);
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');

        try {
          const { data, content: body } = matter(content, {
            // Disable code execution in frontmatter
            engines: {},
          });

          const slug = path
            .relative(docsPath, filePath)
            .replace(/\.(mdx?|md)$/, '')
            .replace(/\\/g, '/');

          // Validate and sanitize title
          const title =
            typeof data.title === 'string'
              ? data.title.replace(/[<>{}]/g, '').slice(0, 200)
              : slug.split('/').pop()?.replace(/-/g, ' ') || 'Untitled';

          const section = extractSection(filePath, docsPath);
          const cleanedContent = cleanMarkdownForSearch(body);

          docs.push({
            title,
            content: cleanedContent.slice(0, 50000), // Max 50KB per doc
            slug,
            section,
          });
        } catch (e) {
          console.error(`Failed to parse ${filePath}:`, e);
        }
      }
    }
  }

  walkDir(docsRoot);
  return docs;
}

async function main() {
  console.log('Starting documentation indexing...\n');

  validateEnv();

  // Create Supabase admin client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Index from the /docs folder (where all documentation lives)
  const docsPath = path.join(process.cwd(), '..', '..', 'docs');

  if (!fs.existsSync(docsPath)) {
    throw new Error(`Documentation directory not found: ${docsPath}`);
  }

  console.log(`Loading docs from: ${docsPath}\n`);

  const docs = await loadDocs(docsPath);

  console.log(`Found ${docs.length} documents to index\n`);

  if (docs.length === 0) {
    console.log('No documents found. Exiting.');
    return;
  }

  // Clear existing docs (full reindex)
  console.log('Clearing existing help docs...');
  const { error: deleteError } = await supabase
    .from('help_docs')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (deleteError) {
    console.warn(
      'Warning: Could not clear existing docs:',
      deleteError.message,
    );
  }

  // Process in batches
  const BATCH_SIZE = 10;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);

    const records = batch.map((doc) => ({
      slug: doc.slug,
      title: doc.title,
      content: doc.content,
      section: doc.section,
    }));

    const { error } = await supabase
      .from('help_docs')
      .upsert(records, { onConflict: 'slug' });

    if (error) {
      console.error(`Failed to upsert batch ${i}:`, error.message);
      errorCount += batch.length;
    } else {
      successCount += batch.length;
      console.log(
        `  Indexed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(docs.length / BATCH_SIZE)}`,
      );
    }
  }

  console.log('\n--- Indexing Complete ---');
  console.log(`Documents processed: ${docs.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
}

main().catch((error) => {
  console.error('Indexing failed:', error);
  process.exit(1);
});
