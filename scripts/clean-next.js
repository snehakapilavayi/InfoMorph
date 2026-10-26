const fs = require('fs');
const path = require('path');

/**
 * Pre-development cleanup script for InfoMorph.
 * 
 * Purpose:
 * When Next.js production builds run on Windows systems with OneDrive syncing,
 * generated build artifacts (e.g., .next/diagnostics/framework.json, .next/types/routes.d.ts)
 * acquire NTFS reparse points / cloud file attributes.
 * When restarting `next dev`, Next's internal recursive-delete uses `readlink` on these
 * reparse points, throwing `EINVAL: invalid argument, readlink`.
 * 
 * This script safely purges ONLY the local project's `.next` directory before
 * development server startup, preventing the readlink collision.
 */
function cleanNextDirectory() {
  const projectRoot = path.resolve(__dirname, '..');
  const targetDir = path.resolve(projectRoot, '.next');

  // Strict safety validations:
  // 1. Directory name must be exactly '.next'
  // 2. Path must reside immediately under projectRoot
  // 3. Must never be root, src, public, node_modules, or parent paths
  if (
    path.basename(targetDir) !== '.next' ||
    targetDir !== path.join(projectRoot, '.next') ||
    targetDir.length <= 6
  ) {
    console.error('[clean-next] Safety check failed: invalid target directory:', targetDir);
    process.exit(1);
  }

  if (!fs.existsSync(targetDir)) {
    // Nothing to clean
    return;
  }

  try {
    fs.rmSync(targetDir, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 200,
    });
    console.log('[clean-next] Safely cleaned .next directory before development startup.');
  } catch (error) {
    console.warn('[clean-next] Warning: could not completely remove .next directory:', error && error.message);
  }
}

cleanNextDirectory();
