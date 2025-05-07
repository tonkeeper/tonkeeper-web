#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
    execSync('git diff --cached --exit-code', { stdio: 'pipe' });
} catch (error) {
    console.error('Error: There are staged changes in the git index. Please commit or unstage them before running the prerelease script.');
    process.exit(1);
}

if (process.argv.length < 3) {
    console.error('Please provide a version number (e.g., 1.0.0)');
    process.exit(1);
}

const newVersion = process.argv[2];

if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
    console.error('Invalid version format. Please use semantic versioning (e.g., 1.0.0)');
    process.exit(1);
}

const modifiedFiles = [];

function updatePackageVersion(packagePath) {
    try {
        const packageJsonPath = path.join(packagePath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            packageJson.version = newVersion;
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4) + '\n');
            console.log(`Updated version in ${packagePath} to ${newVersion}`);
            modifiedFiles.push(packageJsonPath);
        }
    } catch (error) {
        console.error(`Error updating ${packagePath}:`, error.message);
    }
}

const appsDir = path.join(__dirname, '..', 'apps');
const apps = fs.readdirSync(appsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

apps.forEach(app => {
    if (
        app === 'desktop' ||
        app === 'extension' ||
        app === 'web'
    ) {
        updatePackageVersion(path.join(appsDir, app));
    } else {
        console.log('Skipping', app);
    }

});

try {
    if (modifiedFiles.length > 0) {
        execSync(`git add ${modifiedFiles.join(' ')}`, { stdio: 'inherit' });
        execSync(`git commit -m "chore: release ${newVersion}"`, { stdio: 'inherit' });
        execSync(`git tag -a v${newVersion} -m "Version ${newVersion}"`, { stdio: 'inherit' });
        console.log(`\nSuccessfully prepared release version ${newVersion} and created git tag v${newVersion}`);
    } else {
        console.error('No package.json files were modified. Nothing to commit.');
        process.exit(1);
    }
} catch (error) {
    console.error('Error during git operations:', error.message);
    process.exit(1);
}
