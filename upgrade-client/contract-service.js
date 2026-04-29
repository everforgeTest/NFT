const HotPocket = require('hotpocket-js-client');
const bson = require('bson');

class ContractService {
  constructor(servers) {
    this.servers = servers;
    this.userKeyPair = null;
    this.client = null;
    this.isConnectionSucceeded = false;
    this.promiseMap = new Map();
  }

  async init() {
    if (!this.userKeyPair) this.userKeyPair = await HotPocket.generateKeys();
    if (!this.client) this.client = await HotPocket.createClient(this.servers, this.userKeyPair, { protocol: HotPocket.protocols.bson });

    this.client.on(HotPocket.events.disconnect, () => { this.isConnectionSucceeded = false; });
    this.client.on(HotPocket.events.connectionChange, (server, action) => { console.log(server + ' ' + action); });
    this.client.on(HotPocket.events.contractOutput, (r) => {
      r.outputs.forEach((o) => {
        try {
          const output = bson.deserialize(o);
          const pId = output.promiseId;
          if (output.error) this.promiseMap.get(pId)?.rejecter(output.error);
          else this.promiseMap.get(pId)?.resolver(output.success || output);
          this.promiseMap.delete(pId);
        } catch (e) {
          console.log('Output parse error', e);
        }
      });
    });

    if (!this.isConnectionSucceeded) {
      if (!(await this.client.connect())) {
        console.log('Connection failed.');
        return false;
      }
      console.log('HotPocket Connected.');
      this.isConnectionSucceeded = true;
    }
    return true;
  }

  async sign(buffer) {
    if (typeof this.client.sign === 'function') {
      const sig = await this.client.sign(buffer);
      return Buffer.from(sig).toString('hex');
    }
    throw new Error('Client does not support arbitrary signing.');
  }

  submitInputToContract(inp) {
    const promiseId = this.#getUniqueId();
    const payload = bson.serialize({ promiseId: promiseId, ...inp });
    this.client.submitContractInput(payload).then((input) => {
      input?.submissionStatus.then((s) => {
        if (s.status !== 'accepted') console.log(`Ledger_Rejection: ${s.reason}`);
      });
    });
    return new Promise((resolve, reject) => {
      this.promiseMap.set(promiseId, { resolver: resolve, rejecter: reject });
    });
  }

  #getUniqueId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

module.exports = ContractService;
