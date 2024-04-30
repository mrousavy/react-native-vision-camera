const fs = require('fs');
const { exec } = require('child_process');

// Read the package.json file
const data = fs.readFileSync('package/package.json', 'utf-8');

// Parse the file content to a JavaScript object
let packageJson = JSON.parse(data);

// Update the repository and author keys
packageJson.name = '@equinoxventures/react-native-vision-science-camera';
packageJson.repository = 'https://github.com/equinoxventures/react-native-vision-science-camera.git';
packageJson.author = 'Ben Richardson';
packageJson.homepage = 'https://eqx.vc/';

// Remove the bugs, homepage, and publishConfig keys
delete packageJson.bugs;
delete packageJson.publishConfig;

// Convert the updated object back to a JSON string
const updatedData = JSON.stringify(packageJson, null, 2);

// Write the updated JSON string back to the package.json file
fs.writeFileSync('package/package.json', updatedData + '\n', 'utf8');

exec('cd package && npm pack', (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.error(`stderr: ${stderr}`);
})