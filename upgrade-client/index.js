const fs = require('fs');
const path = require('path');
const ContractService = require('./contract-service');

// Usage:
// node index.js <contractUrl> <zipFilePath> <privateKeyIgnored> <version> <description>

const contractUrl = process.argv[2];
const filepath = process.argv[3];
const version = process.argv[5] || process.argv[4];
const description = process.argv[6] || '';

async function clientApp() {
  if (!contractUrl || !filepath || !version) {
    console.log('Usage: node index.js <contractUrl> <zipFilePath> <privateKeyIgnored> <version> <description>');
    process.exit(1);
  }
  const fileName = path.basename(filepath);
  const fileContent = fs.readFileSync(filepath);
  const sizeKB = Math.round(fileContent.length / 1024);

  const service = new ContractService([contractUrl]);
  const ok = await service.init();
  if (!ok) { console.log('Failed to init.'); process.exit(1); }

  let signatureHex;
  try {
    signatureHex = await service.sign(fileContent);
  } catch (e) {
    console.log('Signing failed:', e.message);
    process.exit(1);
  }

  const submitData = {
    Service: 'Upgrade',
    Action: 'UpgradeContract',
    data: {
      version: parseFloat(version),
      description: description,
      zipBase64: fileContent.toString('base64'),
      zipSignatureHex: signatureHex
    }
  };

  console.log(`Uploading ${fileName} (${sizeKB}KB)`);
  service.submitInputToContract(submitData)
    .then((re) => { console.log('Upgrade submission successful:', re); })
    .catch((reason) => { console.log('Upgrade submission failed:', reason); })
    .finally(() => { process.exit(); });
}

clientApp();
