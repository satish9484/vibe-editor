import * as fs from 'fs';
import * as path from 'path';

/**
 * Resolves the absolute path to a template directory by checking multiple locations.
 * This handles different deployment environments (local dev, Docker, Vercel).
 *
 * @param relativeTemplatePath - Relative path from vibecode-starters root (e.g., 'angular', 'react-ts')
 * @returns Absolute path to the template directory, or null if not found
 */
export function resolveTemplatePath(relativeTemplatePath: string): string | null {
  // Normalize the path (remove leading slashes)
  const normalizedPath = relativeTemplatePath.replace(/^[\\\/]+/, '');
  
  // List of possible base locations to check
  const possibleBases = [
    // 1. Project root (local development)
    process.cwd(),
    // 2. .next directory (Vercel build output)
    path.join(process.cwd(), '.next'),
    // 3. .next/server (Vercel serverless function location)
    path.join(process.cwd(), '.next', 'server'),
    // 4. .next/standalone (Docker standalone build)
    path.join(process.cwd(), '.next', 'standalone'),
  ];

  // Check each possible location
  for (const base of possibleBases) {
    const fullPath = path.join(base, 'vibecode-starters', normalizedPath);
    
    try {
      // Check if directory exists and is accessible
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        return fullPath;
      }
    } catch (error) {
      // Directory doesn't exist at this location, continue checking
      continue;
    }
  }

  // Not found in any location
  return null;
}

/**
 * Resolves the absolute path to a template directory, throwing an error if not found.
 * Use this when the template path is required and missing is an error condition.
 *
 * @param relativeTemplatePath - Relative path from vibecode-starters root (e.g., 'angular', 'react-ts')
 * @returns Absolute path to the template directory
 * @throws Error if template directory is not found
 */
export function resolveTemplatePathOrThrow(relativeTemplatePath: string): string {
  const resolved = resolveTemplatePath(relativeTemplatePath);
  if (!resolved) {
    throw new Error(
      `Template directory '${relativeTemplatePath}' not found. ` +
      `Searched in: ${path.join(process.cwd(), 'vibecode-starters')}, ` +
      `${path.join(process.cwd(), '.next', 'vibecode-starters')}, ` +
      `${path.join(process.cwd(), '.next', 'server', 'vibecode-starters')}, ` +
      `${path.join(process.cwd(), '.next', 'standalone', 'vibecode-starters')}`
    );
  }
  return resolved;
}

