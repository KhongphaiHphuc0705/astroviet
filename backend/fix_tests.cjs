const fs = require('fs');
const glob = require('glob');
const files = glob.sync('tests/unit/modules/chart/**/*.ts');
let count = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('timezoneId:')) {
    if (!content.includes('placeName:')) {
      content = content.replace(
        /timezoneId: [^,]+,/g,
        (match) => match + "\n      fullName: 'Test User',\n      placeName: 'Test Location',",
      );
      fs.writeFileSync(file, content);
      console.log('Updated', file);
      count++;
    }
  }
}
console.log('Total files updated:', count);
