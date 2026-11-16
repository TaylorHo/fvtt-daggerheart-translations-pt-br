const MODULE_ID = "daggerheart-translations-pt-br";

Hooks.once("setup", async () => {
  try {
    // Load the translation JSON
    const path = foundry.utils.getRoute(`modules/${MODULE_ID}/lang/pt-BR.json`);

    const response = await fetch(path);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const translations = await response.json();

    // Merge translations into Foundry's dictionary
    foundry.utils.mergeObject(game.i18n.translations, translations, {
      inplace: true,
      overwrite: true,
    });

    console.log(`${MODULE_ID} | Brazilian Portuguese loaded successfully`);
  } catch (error) {
    console.error(`${MODULE_ID} | Failed to load translation`, error);
  }
});

const PACKS = `modules/${MODULE_ID}/lang/packs/`;

// String keys that are translated (everywhere in a document, including random-ID keys).
const TEXT_KEYS = new Set([
  "name",
  "description",
  "content",
  "label",
  "source",
  "motivesAndTactics",
  "impulses",
  "notes",
  "examples",
  "questions",
  "backgroundQuestions",
  "connections",
]);

const fetchJSON = (path) =>
  fetch(foundry.utils.getRoute(PACKS + path))
    .then((r) =>
      r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)),
    )
    .catch((e) => (console.error(`${MODULE_ID} | ${path}`, e), null));

let indexPromise;
const loadIndex = () =>
  (indexPromise ??= fetchJSON("index.json").then((i) => i ?? {}));

const docCache = new Map();
const loadDoc = (entry) => {
  if (!docCache.has(entry.f)) docCache.set(entry.f, fetchJSON(entry.f));
  return docCache.get(entry.f);
};

/** Pack "daggerheart.armors" -> entries of lang/packs/**\/armors/ by _id. */
const packEntries = async (collection) =>
  collection?.startsWith(`${game.system.id}.`)
    ? ((await loadIndex())[collection.split(".").pop()] ?? {})
    : {};

/** Copy translatable strings from tr into src, matching arrays by _id (or position). */
function merge(src, tr, key) {
  if (typeof tr === "string") return TEXT_KEYS.has(key) ? tr : src;
  if (Array.isArray(tr)) {
    if (!Array.isArray(src)) return src;
    tr.forEach((t, i) => {
      const j = t?._id ? src.findIndex((s) => s?._id === t._id) : i;
      if (j >= 0 && j < src.length) src[j] = merge(src[j], t, key);
    });
    return src;
  }
  if (tr && typeof tr === "object" && src && typeof src === "object") {
    for (const k in tr) if (k in src) src[k] = merge(src[k], tr[k], k);
  }
  return src;
}

async function translateResult(result, documentClass, request) {
  const entries = await packEntries(request?.pack);
  if (!Array.isArray(result) || !Object.keys(entries).length) return result;

  if (request.index ?? request.options?.index) {
    for (const e of result) if (entries[e._id]) e.name = entries[e._id].n;
    return result;
  }

  return Promise.all(
    result.map(async (doc) => {
      const entry = entries[doc.id];
      const tr = entry && (await loadDoc(entry));
      if (!tr) return doc;
      const src = merge(doc.toObject(), tr);
      return documentClass.fromSource(src, { pack: request.pack });
    }),
  );
}

Hooks.once("init", () => {
  const getDocuments = CONFIG.DatabaseBackend._getDocuments;
  CONFIG.DatabaseBackend._getDocuments = async function (
    documentClass,
    request,
    ...rest
  ) {
    const result = await getDocuments.call(
      this,
      documentClass,
      request,
      ...rest,
    );
    return translateResult(result, documentClass, request);
  };

  // Foundry re-indexes a document after loading it; keep the translated name.
  const proto = foundry.documents.collections.CompendiumCollection.prototype;
  const indexDocument = proto.indexDocument;
  proto.indexDocument = function (doc) {
    const out = indexDocument.call(this, doc);
    const name = this._ptEntries?.[doc.id]?.n;
    if (name) this.index.get(doc.id).name = name;
    return out;
  };
});

Hooks.once("ready", async () => {
  for (const pack of game.packs) {
    pack._ptEntries = await packEntries(pack.collection);
    for (const [id, { n }] of Object.entries(pack._ptEntries)) {
      const target = pack.index.get(id) ?? pack.folders.get(id);
      if (target && n) target.name = n;
    }
  }
});
