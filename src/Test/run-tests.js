const runNFTTests = require('./TestCases/NFTTest');

(async () => {
  try {
    await runNFTTests();
    console.log('All tests passed.');
  } catch (e) {
    console.error('Tests failed:', e);
    process.exit(1);
  }
})();
