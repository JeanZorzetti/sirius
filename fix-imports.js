const fs = require('fs');
const path = require('path');

const dirsToScan = ['components', 'app', 'lib'];
const groupsToFix = ['(marketing)', '(admin)', '(ia)', 'dashboard', 'checkout', 'admin', 'debug'];

function scanAndFix(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            scanAndFix(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;
            
            for (const group of groupsToFix) {
                // Replacing single quotes
                const searchStr1 = `'@/app/${group}/`;
                const replaceStr1 = `'@/app/[locale]/${group}/`;
                if (content.includes(searchStr1)) {
                    content = content.split(searchStr1).join(replaceStr1);
                    changed = true;
                }
                
                // Replacing double quotes
                const searchStr2 = `\"@/app/${group}/`;
                const replaceStr2 = `\"@/app/[locale]/${group}/`;
                if (content.includes(searchStr2)) {
                    content = content.split(searchStr2).join(replaceStr2);
                    changed = true;
                }
            }
            
            if (changed) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Fixed:', fullPath);
            }
        }
    }
}

dirsToScan.forEach(dir => {
    const targetDir = path.join(process.cwd(), dir);
    if (fs.existsSync(targetDir)) scanAndFix(targetDir);
});
console.log('Done fixing imports!');
