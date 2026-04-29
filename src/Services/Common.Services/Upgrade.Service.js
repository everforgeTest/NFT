const fs = require('fs');
const Tables = require('../../Constants/Tables');
const { SqliteDatabase } = require('./dbHandler');
const { SharedService } = require('../../Utils/SharedService');
const settings = require('../../settings.json').settings;

class UpgradeService {
  constructor(message) {
    this.message = message;
    this.dbPath = settings.dbPath;
    this.dbContext = new SqliteDatabase(this.dbPath);
  }

  async upgradeContract() {
    const resObj = {};
    try {
      const zipBase64 = this.message.data && this.message.data.zipBase64;
      const version = this.message.data && this.message.data.version;
      const description = (this.message.data && this.message.data.description) || '';
      if (!zipBase64 || !version) return { error: { code: 400, message: 'Missing zipBase64 or version' } };

      this.dbContext.open();
      let row = await this.dbContext.getLastRecord(Tables.CONTRACTVERSION);
      const currentVersion = row && row.Version ? row.Version : 1.0;
      if (parseFloat(version) <= parseFloat(currentVersion)) {
        return { error: { code: 403, message: 'Incoming version must be greater than current version.' } };
      }

      const zipBuffer = Buffer.from(zipBase64, 'base64');
      fs.writeFileSync(settings.newContractZipFileName, zipBuffer);

      const script = `#!/bin/bash\
\
! command -v unzip &>/dev/null && apt-get update && apt-get install --no-install-recommends -y unzip\
\
zip_file=\"${settings.newContractZipFileName}\"\
\
unzip -o -d ./ \"$zip_file\" >>/dev/null\
\
echo \"Zip file has been unzipped.\"\
\
rm \"$zip_file\" >>/dev/null\
`;
      fs.writeFileSync(settings.postExecutionScriptName, script);
      try { fs.chmodSync(settings.postExecutionScriptName, 0o777); } catch (_) {}

      const data = {
        Description: description,
        LastUpdatedOn: SharedService.context.timestamp,
        Version: parseFloat(version),
        CreatedOn: SharedService.context.timestamp
      };
      await this.dbContext.insertValue(Tables.CONTRACTVERSION, data);

      resObj.success = { message: 'Contract upgrade accepted', version: parseFloat(version) };
    } catch (e) {
      resObj.error = { code: 500, message: e && e.message ? e.message : 'Failed to upgrade contract.' };
    } finally { this.dbContext.close(); }
    return resObj;
  }
}

module.exports = { UpgradeService };
