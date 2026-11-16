index:
	node scripts/build-index.mjs

zip: index
	zip -r module.zip module.json src lang/ -x lang/en.json

.PHONY: index zip
