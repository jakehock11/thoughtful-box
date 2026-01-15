const path = require('path');
const { rcedit } = require('rcedit');

exports.default = async function(context) {
  // Only run for Windows
  if (context.electronPlatformName !== 'win32') {
    return;
  }
  const exePath = path.join(context.appOutDir, 'Product OS.exe');
  const iconPath = path.join(__dirname, '..', 'build', 'icon.ico');

  console.log('afterPack: Embedding icon into exe...');
  console.log('  Exe:', exePath);
  console.log('  Icon:', iconPath);

  await rcedit(exePath, {
    icon: iconPath,
    'version-string': {
      ProductName: 'Product OS',
      FileDescription: 'Product OS Application',
      CompanyName: 'Product OS',
      InternalName: 'Product OS',
      OriginalFilename: 'Product OS.exe'
    }
  });

  console.log('afterPack: Icon embedded successfully!');
};
