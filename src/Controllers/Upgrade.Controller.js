const { UpgradeService } = require('../Services/Common.Services/Upgrade.Service');
const { loadEnv } = require('../Utils/Env');
const nacl = require('tweetnacl');

function bufferFromHex(hex) { return Buffer.from(hex, 'hex'); }

function getUserPubKeyHex(user) {
  let pk = user && (user.publicKey || user.pubKey || user.publickey);
  if (!pk) return '';
  try {
    if (Buffer.isBuffer(pk)) return Buffer.from(pk).toString('hex');
    if (typeof pk === 'string') return pk;
    return '';
  } catch (_) { return ''; }
}

function isMaintainer(userPubKeyHex) {
  const expected = (process.env.MAINTAINER_PUBKEY || '').toLowerCase();
  return expected && userPubKeyHex && userPubKeyHex.toLowerCase() === expected;
}

class UpgradeController {
  constructor(message, user) {
    this.message = message;
    this.user = user;
    this.service = new UpgradeService(message);
  }

  async handleRequest() {
    try {
      loadEnv();
      const userPkHex = getUserPubKeyHex(this.user);
      if (!isMaintainer(userPkHex)) {
        return { error: { code: 401, message: 'Unauthorized' } };
      }

      // Dual authentication: Verify signature of zip content.
      const payload = this.message.data || {};
      const zipBase64 = payload.zipBase64;
      const sigHex = payload.zipSignatureHex;
      if (!zipBase64 || !sigHex) return { error: { code: 400, message: 'Missing zipBase64 or zipSignatureHex' } };
      const msgBuf = Buffer.from(zipBase64, 'base64');
      const sigBuf = bufferFromHex(sigHex);
      const pubBuf = bufferFromHex(userPkHex);

      const ok = nacl.sign.detached.verify(new Uint8Array(msgBuf), new Uint8Array(sigBuf), new Uint8Array(pubBuf));
      if (!ok) return { error: { code: 401, message: 'Signature verification failed' } };

      switch (this.message.Action) {
        case 'UpgradeContract':
          return await this.service.upgradeContract();
        default:
          return { error: { code: 400, message: 'Invalid action' } };
      }
    } catch (e) {
      return { error: { code: 500, message: e && e.message ? e.message : 'Internal error' } };
    }
  }
}

module.exports = { UpgradeController };
