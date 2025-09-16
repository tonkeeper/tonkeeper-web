import * as fs from 'fs';
import * as path from 'path';

// Configuration
const ROOT_DIR = path.join(__dirname, '../../..');
const LOCALE_FILE = path.join(
    ROOT_DIR,
    'packages',
    'locales',
    'dist',
    'locales',
    'en',
    'translation.json'
);
const OUTPUT_FILE = path.join(__dirname, '../missing-translations.json');
const SEARCH_DIRS = [
    path.join(ROOT_DIR, 'packages', 'core'),
    path.join(ROOT_DIR, 'packages', 'uikit'),
    path.join(ROOT_DIR, 'apps')
];

// Get all translation keys
function getAllTranslationKeys(obj, prefix = '') {
    const keys = {};
    Object.entries(obj).forEach(([key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null) {
            Object.assign(keys, getAllTranslationKeys(value, fullKey));
        } else {
            keys[fullKey] = true;
        }
    });
    return keys;
}

// Find all t() function calls in files
function findTCalls(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    // More precise regex to match t() function calls
    const tCallRegex = /(?:[^a-zA-Z0-9_]t|^t)\(\s*['"`]([^'"`]+)['"`]/g;
    const matches = [];
    let match;

    while ((match = tCallRegex.exec(content)) !== null) {
        // Filter out common false positives
        const key = match[1];
        if (
            !key.startsWith('.') &&
            !key.startsWith('@') &&
            !key.includes('node_modules') &&
            !key.includes('http') &&
            key.trim().length > 2
        ) {
            // Filter out very short keys
            matches.push(key);
        }
    }

    return matches;
}

// Get all files recursively
function getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    files.forEach(file => {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
            getAllFiles(filePath, fileList);
        } else if (
            file.isFile() &&
            !filePath.includes('node_modules') &&
            !filePath.includes('.git') &&
            !filePath.endsWith('.d.ts') && // Skip type definition files
            (filePath.endsWith('.ts') || filePath.endsWith('.tsx'))
        ) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

// Main function
function findMissingTranslations() {
    try {
        // Load all translation keys
        const translations = JSON.parse(fs.readFileSync(LOCALE_FILE, 'utf8'));
        const translationKeys = getAllTranslationKeys(translations);
        const allFiles = [];
        const missingTranslations = {};

        console.log('Scanning files for t() calls...');

        // Get all files
        SEARCH_DIRS.forEach(dir => {
            if (fs.existsSync(dir)) {
                getAllFiles(dir, allFiles);
            }
        });

        console.log(`Found ${allFiles.length} files to scan`);

        // Find all t() calls
        allFiles.forEach(file => {
            try {
                const tCalls = findTCalls(file);
                tCalls.forEach(key => {
                    if (!translationKeys[key]) {
                        if (!missingTranslations[file]) {
                            missingTranslations[file] = [];
                        }
                        missingTranslations[file].push(key);
                    }
                });
            } catch (e) {
                console.error(`Error processing file ${file}:`, e.message);
            }
        });

        // Save results
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(missingTranslations, null, 2));
        console.log(`\nResults saved to ${OUTPUT_FILE}`);

        // Print summary
        const totalMissing = Object.values(missingTranslations).reduce(
            // @ts-ignore
            (sum, keys) => sum + keys.length,
            0
        );
        console.log(
            `Total missing translations: ${totalMissing} in ${
                Object.keys(missingTranslations).length
            } files`
        );
    } catch (error) {
        console.error('Error:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
    }
}

findMissingTranslations();
