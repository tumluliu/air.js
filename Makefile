BROWSERIFY = node_modules/.bin/browserify

all: dist/air.js

node_modules/.install: package.json
	npm install && touch node_modules/.install

dist:
	mkdir -p dist

dist/air.js: node_modules/.install dist $(shell $(BROWSERIFY) --list index.js)
	npm run build && cp css/*.css dist/ && cp res/*.png dist/

clean:
	rm -rf dist/*

install:
	make && cp dist/air.js ../air-web/scripts/ && cp dist/*.css ../air-web/styles/ && cp dist/*.png ../air-web/styles/

D3_FILES = \
	node_modules/d3/src/start.js \
	node_modules/d3/src/selection/index.js \
	node_modules/d3/src/end.js

lib/d3.js: $(D3_FILES)
	node_modules/.bin/smash $(D3_FILES) > $@
