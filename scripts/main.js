const MODULE_ID = "daggerheart-translations-pt-br";

Hooks.once("init", () => {
  // Register the translation toggle in Foundry settings
  game.settings.register(MODULE_ID, "enabled", {
    name: "Ativar Português Brasileiro",
    hint: "Ativar ou desativar a tradução para Português Brasileiro. Será necessário recarregar o jogo.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true,
  });

  console.log(`${MODULE_ID} | Settings registered`);
});

Hooks.once("setup", async () => {
  // Check whether the translation is enabled
  const enabled = game.settings.get(MODULE_ID, "enabled");

  if (!enabled) {
    console.log(`${MODULE_ID} | Translation disabled`);
    return;
  }

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
