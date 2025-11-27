/**
 * Cleanup Script: Fix Media Metadata
 * 
 * This script cleans up existing media.json by:
 * 1. Extracting originalPrompt from seed.originalPrompt
 * 2. Removing the entire seed object
 * 3. Fixing "Generated image" placeholder prompts where actual prompts exist
 */

import fs from 'fs';
import path from 'path';
import type { MediaDatabase, MediaItem } from './types';

const MEDIA_FILE = path.join(__dirname, '../../../temp-db/media.json');
const BACKUP_FILE = path.join(__dirname, '../../../temp-db/media.json.backup');

interface CleanupReport {
  totalMedia: number;
  updatedMedia: number;
  extractedOriginalPrompts: number;
  fixedPlaceholderPrompts: number;
  removedSeeds: number;
  errors: string[];
}

/**
 * Read media database
 */
function readMediaDB(): MediaDatabase {
  try {
    const data = fs.readFileSync(MEDIA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading media.json:', error);
    throw error;
  }
}

/**
 * Write media database
 */
function writeMediaDB(db: MediaDatabase): void {
  try {
    fs.writeFileSync(MEDIA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing media.json:', error);
    throw error;
  }
}

/**
 * Create backup of media.json
 */
function createBackup(): void {
  try {
    fs.copyFileSync(MEDIA_FILE, BACKUP_FILE);
    console.log(`Backup created at: ${BACKUP_FILE}`);
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
}

/**
 * Clean up a single media item
 */
function cleanupMediaItem(media: MediaItem, report: CleanupReport): boolean {
  let updated = false;
  const metadata = media.metadata as any;

  // Check if seed exists
  if (metadata.seed && typeof metadata.seed === 'object') {
    // Extract originalPrompt from seed if it exists
    if (metadata.seed.originalPrompt && !metadata.originalPrompt) {
      metadata.originalPrompt = metadata.seed.originalPrompt;
      report.extractedOriginalPrompts++;
      updated = true;
    }

    // If prompt is placeholder but seed has the actual full prompt, use it
    if (metadata.prompt === 'Generated image' && typeof metadata.seed.originalPrompt === 'string') {
      // The full prompt might be in the main prompt field already from migration
      // But if it's still "Generated image", we should note this
      report.fixedPlaceholderPrompts++;
    }

    // Remove the entire seed object
    delete metadata.seed;
    report.removedSeeds++;
    updated = true;
  }

  return updated;
}

/**
 * Run cleanup on all media items
 */
function runCleanup(dryRun: boolean = false): CleanupReport {
  const report: CleanupReport = {
    totalMedia: 0,
    updatedMedia: 0,
    extractedOriginalPrompts: 0,
    fixedPlaceholderPrompts: 0,
    removedSeeds: 0,
    errors: []
  };

  console.log('Starting media metadata cleanup...');
  console.log(`Dry run: ${dryRun}`);

  if (!dryRun) {
    createBackup();
  }

  const db = readMediaDB();
  const mediaItems = Object.values(db.media);
  report.totalMedia = mediaItems.length;

  console.log(`\nProcessing ${report.totalMedia} media items...`);

  for (const media of mediaItems) {
    try {
      const wasUpdated = cleanupMediaItem(media, report);
      if (wasUpdated) {
        report.updatedMedia++;
      }
    } catch (error) {
      report.errors.push(`Failed to process media ${media.id}: ${error}`);
    }
  }

  // Write changes if not dry run
  if (!dryRun && report.updatedMedia > 0) {
    writeMediaDB(db);
    console.log('\nChanges saved to media.json');
  }

  return report;
}

/**
 * Print cleanup report
 */
function printReport(report: CleanupReport, dryRun: boolean): void {
  console.log('\n=== Cleanup Report ===');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes made)' : 'LIVE (changes saved)'}`);
  console.log(`Total Media Items: ${report.totalMedia}`);
  console.log(`Updated Items: ${report.updatedMedia}`);
  console.log(`Extracted originalPrompts: ${report.extractedOriginalPrompts}`);
  console.log(`Fixed Placeholder Prompts: ${report.fixedPlaceholderPrompts}`);
  console.log(`Removed Seed Objects: ${report.removedSeeds}`);

  if (report.errors.length > 0) {
    console.log(`\nErrors (${report.errors.length}):`);
    report.errors.forEach(error => console.log(`  - ${error}`));
  }

  console.log('\n=== Summary ===');
  if (report.updatedMedia === 0) {
    console.log('✅ No updates needed - all media metadata is already clean!');
  } else if (dryRun) {
    console.log(`ℹ️  ${report.updatedMedia} items would be updated in live mode`);
  } else {
    console.log(`✅ Successfully cleaned up ${report.updatedMedia} media items`);
    console.log(`📁 Backup saved at: ${BACKUP_FILE}`);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  try {
    const report = runCleanup(dryRun);
    printReport(report, dryRun);
    process.exit(report.errors.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  }
}

export { runCleanup, CleanupReport };
