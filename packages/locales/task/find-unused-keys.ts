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
const OUTPUT_FILE = path.join(__dirname, '../unused-translations.json');
const SEARCH_DIRS = [
    path.join(ROOT_DIR, 'packages', 'core'),
    path.join(ROOT_DIR, 'packages', 'uikit'),
    path.join(ROOT_DIR, 'apps')
];

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
            (filePath.endsWith('.ts') || filePath.endsWith('.tsx'))
        ) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

// Check if a key is used in the codebase
function isKeyUsed(key, allFiles) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const quote = '["\']'; // Also correct
    const pattern = new RegExp(`${quote}(${escapedKey})${quote}`, 'g');

    for (const file of allFiles) {
        try {
            const content = fs.readFileSync(file, 'utf8');
            if (pattern.test(content)) {
                return true;
            }
        } catch (e) {
            console.error(`Error reading file ${file}:`, e.message);
        }
    }
    return false;
}

// Get all translation keys
function getTranslationKeys(obj, prefix = '') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null) {
            return [...acc, ...getTranslationKeys(value, fullKey)];
        }
        return [...acc, fullKey];
    }, []);
}

// Main function
async function findUnusedTranslations() {
    try {
        // Check if the locale file exists
        if (!fs.existsSync(LOCALE_FILE)) {
            throw new Error(`Locale file not found at: ${LOCALE_FILE}`);
        }

        console.log('Scanning files...');
        const allFiles = [];
        SEARCH_DIRS.forEach(dir => {
            if (fs.existsSync(dir)) {
                getAllFiles(dir, allFiles);
            }
        });

        console.log(`Found ${allFiles.length} files to scan`);

        const translations = JSON.parse(fs.readFileSync(LOCALE_FILE, 'utf8'));
        const allKeys = getTranslationKeys(translations);
        const unusedKeys = [];

        console.log(`Checking ${allKeys.length} translation keys...\n`);

        for (const key of allKeys) {
            process.stdout.write(`\rChecking: ${key.padEnd(50)}`);
            if (!isKeyUsed(key, allFiles)) {
                unusedKeys.push(key);
            }
        }

        // Save to file
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(unusedKeys, null, 2));
        console.log(`\n\nResults saved to ${OUTPUT_FILE}`);
        console.log(`Total unused keys: ${unusedKeys.length}`);
    } catch (error) {
        console.error('Error:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
    }
}

findUnusedTranslations();
