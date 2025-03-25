#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import * as zlib from 'zlib';
import { pipeline } from 'stream';
import { createReadStream, createWriteStream } from 'fs';

// Directories to exclude from the export
const excludeDirs = [
  'node_modules',
  'dist',
  'dist-test',
  '.bolt',
  '.git'
];

// Files to exclude from the export
const excludeFiles = [
  'package-lock.json',
  '.DS_Store'
];

// Target zip file name
const zipFileName = 'treasury-doc-extractor.zip';

// Check if directory should be excluded
const shouldExcludeDir = (dirPath) => {
  const dirName = path.basename(dirPath);
  return excludeDirs.includes(dirName);
};

// Check if file should be excluded
const shouldExcludeFile = (filePath) => {
  const fileName = path.basename(filePath);
  return excludeFiles.includes(fileName);
};

// Ensure output directory exists
const ensureDirectoryExistence = (filePath) => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
};

// Get all files recursively
const getAllFiles = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!shouldExcludeDir(filePath)) {
        fileList = getAllFiles(filePath, fileList);
      }
    } else {
      if (!shouldExcludeFile(filePath)) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
};

// Create a temporary directory for the zip contents
const tempDir = path.join(process.cwd(), 'temp_export');
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir);

// Copy all files to the temporary directory
const allFiles = getAllFiles(process.cwd());
console.log(`Found ${allFiles.length} files to export`);

allFiles.forEach(file => {
  const relativePath = path.relative(process.cwd(), file);
  const targetPath = path.join(tempDir, relativePath);
  
  ensureDirectoryExistence(targetPath);
  fs.copyFileSync(file, targetPath);
});

console.log('Files copied to temporary directory');

// Create a zip file containing the entire project
const zipFilePath = path.join(process.cwd(), zipFileName);

// Create the zip using native Node.js modules
const archive = createWriteStream(zipFilePath);
const gzip = zlib.createGzip();

console.log(`Creating zip file: ${zipFilePath}`);
console.log('Please wait, this may take a few minutes...');

// Simple zip creation using Node.js built-ins
const createZip = () => {
  try {
    // Since we can't use the full zip functionality without libraries,
    // let's just create a tarball with gzip
    const output = createWriteStream(zipFilePath);
    const compress = zlib.createGzip();
    
    pipeline(
      createReadStream(tempDir),
      compress,
      output,
      (err) => {
        if (err) {
          console.error('An error occurred:', err);
          process.exitCode = 1;
        } else {
          console.log(`Successfully created ${zipFileName}`);
          console.log('Please download this file and upload it to your GitHub repository');
        }
      }
    );
  } catch (error) {
    console.error('Failed to create zip file:', error);
  }
};

// First, create a manifest of files that are included
const manifest = allFiles.map(file => path.relative(process.cwd(), file));
fs.writeFileSync(path.join(tempDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

// Then try to create the zip
try {
  createZip();
} catch (error) {
  console.error('Error creating zip:', error);
  console.log('Please manually download the files from the temp_export directory');
}

console.log('\nInstructions for GitHub:');
console.log('1. Download the generated zip file or the content of temp_export directory');
console.log('2. Go to https://github.com/Wedkamikazi/salamrfnd');
console.log('3. Click "Add file" > "Upload files"');
console.log('4. Drag and drop the files or upload the zip and extract');
console.log('5. Commit the changes');