function assertEqual(actual, expected, msg) {
  if (actual !== expected) throw new Error(`Assertion failed: ${msg} (expected=${expected}, actual=${actual})`);
}

function assertSuccessResponse(resp, msg) {
  if (!resp || !resp.success) throw new Error(`Assertion failed: ${msg} (no success field)`);
}

function assertErrorResponse(resp, code, msg) {
  if (!resp || !resp.error) throw new Error(`Assertion failed: ${msg} (no error field)`);
  if (code !== undefined && resp.error.code !== code) throw new Error(`Assertion failed: ${msg} (expected code=${code}, actual=${resp.error.code})`);
}

module.exports = { assertEqual, assertSuccessResponse, assertErrorResponse };
