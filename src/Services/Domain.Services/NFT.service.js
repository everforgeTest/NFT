const Tables = require('../../Constants/Tables');
const { SqliteDatabase } = require('../Common.Services/dbHandler');
const { SharedService } = require('../../Utils/SharedService');

class NFTService {
  constructor(message) {
    this.message = message;
    const settings = require('../../settings.json').settings;
    this.dbPath = settings.dbPath;
    this.dbContext = new SqliteDatabase(this.dbPath);
  }

  async mintNFT(ownerPubKeyHex) {
    const resObj = {};
    try {
      this.dbContext.open();
      const data = this.message.data || {};
      const tokenId = SharedService.generateUUID();
      const nft = {
        TokenId: tokenId,
        Name: data.name || 'Untitled',
        Metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        OwnerPubKey: ownerPubKeyHex,
        ConcurrencyKey: SharedService.generateConcurrencyKey()
      };
      const result = await this.dbContext.insertValue(Tables.NFTS, nft);
      resObj.success = { id: result.lastId, tokenId: tokenId };
      return resObj;
    } catch (e) { throw e; } finally { this.dbContext.close(); }
  }

  async getNFTById() {
    const resObj = {};
    try {
      this.dbContext.open();
      const id = this.message.data && this.message.data.id;
      const row = await this.dbContext.findById(Tables.NFTS, id);
      if (!row) return { error: { code: 404, message: 'NFT not found' } };
      resObj.success = this.#mapRow(row);
      return resObj;
    } catch (e) { throw e; } finally { this.dbContext.close(); }
  }

  async listNFTs() {
    const resObj = {};
    try {
      this.dbContext.open();
      const rows = await this.dbContext.getValues(Tables.NFTS, {});
      resObj.success = rows.map(r => this.#mapRow(r));
      return resObj;
    } catch (e) { throw e; } finally { this.dbContext.close(); }
  }

  async myNFTs(ownerPubKeyHex) {
    const resObj = {};
    try {
      this.dbContext.open();
      const rows = await this.dbContext.getValues(Tables.NFTS, { OwnerPubKey: ownerPubKeyHex });
      resObj.success = rows.map(r => this.#mapRow(r));
      return resObj;
    } catch (e) { throw e; } finally { this.dbContext.close(); }
  }

  async transferNFT(ownerPubKeyHex) {
    const resObj = {};
    try {
      this.dbContext.open();
      const data = this.message.data || {};
      const id = data.id;
      const newOwner = data.newOwnerPubKey;
      if (!id || !newOwner) return { error: { code: 400, message: 'Missing id or newOwnerPubKey' } };
      const row = await this.dbContext.findById(Tables.NFTS, id);
      if (!row) return { error: { code: 404, message: 'NFT not found' } };
      if (row.Burned === 1) return { error: { code: 400, message: 'NFT already burned' } };
      if ((row.OwnerPubKey || '').toLowerCase() !== (ownerPubKeyHex || '').toLowerCase()) return { error: { code: 403, message: 'Only owner can transfer' } };
      const result = await this.dbContext.updateValue(Tables.NFTS, { OwnerPubKey: newOwner }, { Id: id });
      resObj.success = { changes: result.changes };
      return resObj;
    } catch (e) { throw e; } finally { this.dbContext.close(); }
  }

  async burnNFT(ownerPubKeyHex) {
    const resObj = {};
    try {
      this.dbContext.open();
      const id = this.message.data && this.message.data.id;
      if (!id) return { error: { code: 400, message: 'Missing id' } };
      const row = await this.dbContext.findById(Tables.NFTS, id);
      if (!row) return { error: { code: 404, message: 'NFT not found' } };
      if ((row.OwnerPubKey || '').toLowerCase() !== (ownerPubKeyHex || '').toLowerCase()) return { error: { code: 403, message: 'Only owner can burn' } };
      const result = await this.dbContext.updateValue(Tables.NFTS, { Burned: 1 }, { Id: id });
      resObj.success = { changes: result.changes };
      return resObj;
    } catch (e) { throw e; } finally { this.dbContext.close(); }
  }

  #mapRow(r) {
    return {
      id: r.Id,
      tokenId: r.TokenId,
      name: r.Name,
      metadata: r.Metadata ? JSON.parse(r.Metadata) : null,
      ownerPubKey: r.OwnerPubKey,
      mintedOn: r.MintedOn,
      burned: r.Burned === 1
    };
  }
}

module.exports = { NFTService };
