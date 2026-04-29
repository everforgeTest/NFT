const ServiceTypes = require('./Constants/ServiceTypes');
const { NFTController } = require('./Controllers/NFT.Controller');
const { UpgradeController } = require('./Controllers/Upgrade.Controller');

class Controller {
  async handleRequest(user, message, isReadOnly) {
    let result = {};
    if (message && message.service) message.Service = message.service;
    if (message && message.action) message.Action = message.action;

    try {
      if (message.Service === ServiceTypes.UPGRADE) {
        const ctrl = new UpgradeController(message, user);
        result = await ctrl.handleRequest();
      } else if (message.Service === ServiceTypes.NFT) {
        const ctrl = new NFTController(message, user);
        result = await ctrl.handleRequest();
      } else {
        result = { error: { code: 400, message: 'Invalid service' } };
      }
    } catch (e) {
      result = { error: { code: 500, message: e && e.message ? e.message : 'Internal error' } };
    }

    await this.sendOutput(user, result, message);
  }

  async sendOutput(user, response, message) {
    const payload = message && message.promiseId ? { promiseId: message.promiseId, ...response } : response;
    await user.send(JSON.stringify(payload));
  }
}

module.exports = { Controller };
