const { NFTService } = require('../Services/Domain.Services/NFT.service');

function getUserPubKeyHex(user) {
  let pk = user && (user.publicKey || user.pubKey || user.publickey);
  if (!pk) return '';
  try {
    if (Buffer.isBuffer(pk)) return Buffer.from(pk).toString('hex');
    if (typeof pk === 'string') return pk;
    return '';
  } catch (_) { return ''; }
}

class NFTController {
  constructor(message, user) {
    this.message = message;
    this.user = user;
    this.service = new NFTService(message);
  }

  async handleRequest() {
    try {
      const ownerPk = getUserPubKeyHex(this.user);
      switch (this.message.Action) {
        case 'Mint':
          return await this.service.mintNFT(ownerPk);
        case 'GetById':
          return await this.service.getNFTById();
        case 'List':
          return await this.service.listNFTs();
        case 'MyNFTs':
          return await this.service.myNFTs(ownerPk);
        case 'Transfer':
          return await this.service.transferNFT(ownerPk);
        case 'Burn':
          return await this.service.burnNFT(ownerPk);
        default:
          return { error: { code: 400, message: 'Invalid action' } };
      }
    } catch (e) {
      return { error: { code: 500, message: e && e.message ? e.message : 'Internal error' } };
    }
  }
}

module.exports = { NFTController };
