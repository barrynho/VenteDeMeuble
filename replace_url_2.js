const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'frontend/src');
const searchString = 'https://ventedemeuble1.onrender.com';
const replaceString = 'https://mon-vrai-backend.onrender.com';

function replaceInFiles(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInFiles(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(searchString)) {
        content = content.split(searchString).join(replaceString);
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  });
}

replaceInFiles(directoryPath);
console.log('Done!');
