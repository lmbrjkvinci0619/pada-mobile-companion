const storage = new Map();

const createMMKV = ({ id }) => ({
  getString: (key) => storage.get(key) ?? undefined,
  set: (key, value) => storage.set(key, value),
  remove: (key) => storage.delete(key),
  getAllKeys: () => Array.from(storage.keys()),
  contains: (key) => storage.has(key),
  clearAll: () => storage.clear(),
  getBoolean: (key) => storage.get(key),
  getNumber: (key) => storage.get(key),
  getBuffer: (key) => storage.get(key),
});

module.exports = { createMMKV };