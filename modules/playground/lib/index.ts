import { TemplateFile, TemplateFolder } from './path-to-json';

export function findFilePath(file: TemplateFile, folder: TemplateFolder, pathSoFar: string[] = []): string | null {
  for (const item of folder.items) {
    if ('folderName' in item) {
      const res = findFilePath(file, item, [...pathSoFar, item.folderName]);
      if (res) return res;
    } else {
      if (item.filename === file.filename && item.fileExtension === file.fileExtension) {
        return [...pathSoFar, item.filename + (item.fileExtension ? '.' + item.fileExtension : '')].join('/');
      }
    }
  }
  return null;
}

/**
 * Generates a unique file ID based on file location in folder structure
 * @param file The template file
 * @param rootFolder The root template folder containing all files
 * @returns A unique file identifier including full path
 */
export const generateFileId = (file: TemplateFile, rootFolder: TemplateFolder): string => {
  // Find the file's path in the folder structure
  const path = findFilePath(file, rootFolder)?.replace(/^\/+/, '') || '';

  // Handle empty/undefined file extension
  const extension = file.fileExtension?.trim();
  const extensionSuffix = extension ? `.${extension}` : '';

  // Combine path and filename
  return path ? `${path}/${file.filename}${extensionSuffix}` : `${file.filename}${extensionSuffix}`;
};

/**
 * Finds the first file in the template folder structure
 * Prioritizes common entry files like index.js, App.js, main.js, etc.
 * @param folder The template folder to search
 * @returns The first file found, or null if no files exist
 */
export const findFirstFile = (folder: TemplateFolder): TemplateFile | null => {
  // Priority order for common entry files
  const priorityFiles = [
    'index.js',
    'index.ts',
    'index.tsx',
    'index.jsx',
    'App.js',
    'App.ts',
    'App.tsx',
    'App.jsx',
    'main.js',
    'main.ts',
    'main.tsx',
    'main.jsx',
    'src/index.js',
    'src/index.ts',
    'src/index.tsx',
    'src/index.jsx',
    'src/App.js',
    'src/App.ts',
    'src/App.tsx',
    'src/App.jsx',
  ];

  // First, try to find priority files
  for (const priorityFile of priorityFiles) {
    const found = findFileByPath(folder, priorityFile);
    if (found) return found;
  }

  // If no priority file found, return the first file encountered
  return findFirstFileRecursive(folder);
};

/**
 * Finds a file by its full path in the template structure
 * @param folder The template folder to search
 * @param filePath The path to the file (e.g., 'src/App.js')
 * @returns The file if found, or null
 */
const findFileByPath = (folder: TemplateFolder, filePath: string): TemplateFile | null => {
  const pathParts = filePath.split('/');
  let currentFolder = folder;

  // Navigate through the folder structure
  for (let i = 0; i < pathParts.length - 1; i++) {
    const folderName = pathParts[i];
    const subFolder = currentFolder.items.find(item => 'folderName' in item && item.folderName === folderName) as TemplateFolder | undefined;

    if (!subFolder) return null;
    currentFolder = subFolder;
  }

  // Find the file in the final folder
  const fileName = pathParts[pathParts.length - 1];
  const file = currentFolder.items.find(
    item => 'filename' in item && `${item.filename}${item.fileExtension ? '.' + item.fileExtension : ''}` === fileName
  ) as TemplateFile | undefined;

  return file || null;
};

/**
 * Recursively finds the first file in the template structure
 * @param folder The template folder to search
 * @returns The first file found, or null
 */
const findFirstFileRecursive = (folder: TemplateFolder): TemplateFile | null => {
  for (const item of folder.items) {
    if ('folderName' in item) {
      // It's a folder, search recursively
      const found = findFirstFileRecursive(item);
      if (found) return found;
    } else {
      // It's a file, return it
      return item;
    }
  }
  return null;
};
