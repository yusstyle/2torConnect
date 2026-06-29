const fs = require('fs');
const path = require('path');
const root = process.cwd();
['package-lock.json', 'yarn.lock'].forEach((filename) => {
  const file = path.join(root, filename);
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
});
const userAgent = process.env.npm_config_user_agent || '';
if (!/^pnpm\//.test(userAgent)) {
  console.error('Use pnpm instead');
  process.exit(1);
}
