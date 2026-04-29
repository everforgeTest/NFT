const HotPocket = require('hotpocket-nodejs-contract');
const { Controller } = require('./controller');
const { DBInitializer } = require('./Data.Deploy/initDB');
const { SharedService } = require('./Utils/SharedService');

const contract = async (ctx) => {
  console.log('NFT Mint contract is running.');
  SharedService.context = ctx;
  const isReadOnly = ctx.readonly;

  if (!isReadOnly) {
    ctx.unl.onMessage((node, msg) => {
      const obj = JSON.parse(msg.toString());
      if (obj && obj.type) SharedService.nplEventEmitter.emit(obj.type, node, msg);
    });
  }

  try { await DBInitializer.init(); } catch (e) { console.error(e); }

  const controller = new Controller();

  for (const user of ctx.users.list()) {
    for (const input of user.inputs) {
      try {
        const buf = await ctx.users.read(input);
        let message = null;
        try { message = JSON.parse(buf); } catch (_) { message = null; }
        if (!message) {
          await user.send(JSON.stringify({ error: { code: 400, message: 'Invalid JSON payload' } }));
          continue;
        }
        await controller.handleRequest(user, message, isReadOnly);
      } catch (e) {
        try { await user.send(JSON.stringify({ error: { code: 500, message: 'Failed to process input' } })); } catch (_) {}
      }
    }
  }
};

const hpc = new HotPocket.Contract();
hpc.init(contract, HotPocket.clientProtocols.JSON, true);
