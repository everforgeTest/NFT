const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

class SharedService {
  static context = null;
  static nplEventEmitter = new EventEmitter();

  static generateUUID() { return uuidv4(); }

  static getUtcISOStringFromUnixTimestamp(milliseconds) {
    const date = new Date(milliseconds);
    return date.toISOString();
  }

  static getCurrentTimestamp() {
    return SharedService.getUtcISOStringFromUnixTimestamp(SharedService.context.timestamp);
  }

  static generateConcurrencyKey() {
    const timestamp = SharedService.getCurrentTimestamp();
    const extractedTimestamp = timestamp.replace(/\D/g, "");
    const timestampHex = Number(extractedTimestamp).toString(16).toUpperCase().padStart(14, '0');
    const checksum = 16 - timestampHex.length;
    return `0x${'0'.repeat(checksum)}${timestampHex}`;
  }
}

module.exports = { SharedService };
