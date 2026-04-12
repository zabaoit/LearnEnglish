const fs = require('fs');
const path = require('path');

const storePath = process.env.DEMO_STORE_PATH || path.join(__dirname, '../../storage/demo-data.json');

function readDemoStore() {
  if (!fs.existsSync(storePath)) return {};

  try {
    return JSON.parse(fs.readFileSync(storePath, 'utf8'));
  } catch (error) {
    console.warn(`Cannot read demo store at ${storePath}: ${error.message}`);
    return {};
  }
}

function writeDemoStore(collections) {
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  const payload = {
    savedAt: new Date().toISOString(),
    collections,
  };

  fs.writeFileSync(storePath, JSON.stringify(payload, null, 2));
}

function storedCollection(store, key) {
  const collection = store.collections?.[key] || store[key];
  return Array.isArray(collection) ? collection : null;
}

function hydrateDemoCollections(collections) {
  const store = readDemoStore();

  Object.entries(collections).forEach(([key, collection]) => {
    const stored = storedCollection(store, key);
    if (!stored || !Array.isArray(collection)) return;
    collection.splice(0, collection.length, ...stored);
  });
}

function saveDemoCollections(collections) {
  const current = readDemoStore();
  const snapshot = Object.fromEntries(
    Object.entries(collections).map(([key, collection]) => [key, collection]),
  );
  writeDemoStore({
    ...(current.collections || {}),
    ...snapshot,
  });
}

module.exports = {
  hydrateDemoCollections,
  readDemoStore,
  saveDemoCollections,
  storePath,
};
