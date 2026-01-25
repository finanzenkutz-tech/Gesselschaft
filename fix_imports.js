const fs = require('fs');
const path = require('path');

const rootDir = 'c:/Gesselschaft/boardgamehub';
const appDir = path.join(rootDir, 'app');
const componentsDir = path.join(rootDir, 'components');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
};

const replacements = [
    { from: /@\/app\/groups\//g, to: '@/app/(app)/groups/' },
    { from: /@\/app\/events\//g, to: '@/app/(app)/events/' },
    { from: /@\/app\/inventory\//g, to: '@/app/(app)/inventory/' },
    { from: /@\/app\/settings\//g, to: '@/app/(app)/settings/' },
    { from: /@\/app\/profile\//g, to: '@/app/(app)/profile/' },
    { from: /@\/app\/admin\//g, to: '@/app/(app)/admin/' },
    { from: /@\/app\/marketplace\//g, to: '@/app/(app)/marketplace/' },
    { from: /@\/app\/notifications\//g, to: '@/app/(app)/notifications/' },
    { from: /@\/app\/push\//g, to: '@/app/(app)/push/' },
    { from: /@\/app\/features\//g, to: '@/app/(app)/features/' },
    { from: /@\/app\/gamification\//g, to: '@/app/(app)/gamification/' },
    { from: /@\/app\/carpooling\//g, to: '@/app/(app)/carpooling/' },
    // Also handle imports without trailing slash if they exist (though less likely for these directories)
    { from: /@\/app\/groups'/g, to: "@/app/(app)/groups'" },
    { from: /@\/app\/groups"/g, to: '@/app/(app)/groups"' },
];

walk(appDir, (file) => {
    if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        let content = fs.readFileSync(file, 'utf8');
        let newContent = content;
        replacements.forEach(r => {
            newContent = newContent.replace(r.from, r.to);
        });
        if (newContent !== content) {
            fs.writeFileSync(file, newContent);
            console.log(`Updated: ${file}`);
        }
    }
});

walk(componentsDir, (file) => {
    if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        let content = fs.readFileSync(file, 'utf8');
        let newContent = content;
        replacements.forEach(r => {
            newContent = newContent.replace(r.from, r.to);
        });
        if (newContent !== content) {
            fs.writeFileSync(file, newContent);
            console.log(`Updated: ${file}`);
        }
    }
});
