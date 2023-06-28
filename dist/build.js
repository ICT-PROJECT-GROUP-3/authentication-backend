const {
  execSync
} = require('child_process');
try {
  console.log('Running build script...');
  execSync('npx babel . -d dist');
  console.log('Build script completed successfully.');
} catch (error) {
  console.error('Build script failed:', error);
  process.exit(1);
}