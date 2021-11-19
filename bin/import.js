// dinamically build the imports in dev mode, based on existing plugins
// in the ./plugins directory
const { readdirSync, writeFileSync, existsSync, mkdirSync } = require('fs');
const lcd = require('../lib/lcd/index');

// create plugins directory
if (!existsSync(`${__dirname}/../plugins`)) {
  mkdirSync(`${__dirname}/../plugins`);
}

const dirs = readdirSync(__dirname + '/../plugins', { withFileTypes: true })
  .filter(dirent => dirent.isDirectory());
const imports = dirs.reduce((acc, dir) => acc += `import './plugins/${dir.name}';\n`, '');
writeFileSync(`${__dirname}/../plugins.js`, imports);

console.log(lcd.orange('RedBot Mission Control') + ' - ' + lcd.white('development server'));
console.log(lcd.green('Plugins: ') + lcd.grey(dirs.map(dir => dir.name).join(', ')));
console.log('');