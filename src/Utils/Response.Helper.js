function success(data) {
  return { success: data };
}

function error(message, code) {
  return { error: { code: code || 500, message: message } };
}

module.exports = { success, error };
