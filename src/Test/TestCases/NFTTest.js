const HotPocket = require('hotpocket-js-client');
const bson = require('bson');
const { assertSuccessResponse, assertEqual } = require('../test-utils');

async function mintReadUpdateBurnFlow() {
  const kp = await HotPocket.generateKeys();
  const client = await HotPocket.createClient(['ws://localhost:8081'], kp);
  if (!await client.connect()) throw new Error('HP connect failed');

  // Mint
  const mintReq = { Service: 'NFT', Action: 'Mint', data: { name: 'TestNFT', metadata: { a: 1 } } };
  const out1 = await client.submitContractReadRequest(JSON.stringify(mintReq));
  const res1 = JSON.parse(out1.toString());
  assertSuccessResponse(res1, 'Mint should succeed');
  const nftId = res1.success.id;

  // GetById
  const getReq = { Service: 'NFT', Action: 'GetById', data: { id: nftId } };
  const out2 = await client.submitContractReadRequest(JSON.stringify(getReq));
  const res2 = JSON.parse(out2.toString());
  assertSuccessResponse(res2, 'GetById should succeed');
  assertEqual(res2.success.name, 'TestNFT', 'Name should match');

  // Burn
  const burnReq = { Service: 'NFT', Action: 'Burn', data: { id: nftId } };
  const out3 = await client.submitContractReadRequest(JSON.stringify(burnReq));
  const res3 = JSON.parse(out3.toString());
  assertSuccessResponse(res3, 'Burn should succeed');

  client.disconnect();
}

module.exports = async function runNFTTests() {
  await mintReadUpdateBurnFlow();
};
