import {test} from '../../util/test.js';
import * as mapbox from '../../../src/util/mapbox.js';
import config from '../../../src/util/config.js';
import window from '../../../src/util/window.js';
import webpSupported from '../../../src/util/webp_supported.js';
import {uuid} from '../../../src/util/util.js';
import {SKU_ID} from '../../../src/util/sku_token.js';
import {version} from '../../../package.json';
import {equalWithPrecision} from '../../util/index.js';
import assert from 'assert';

const mapboxTileURLs = [
    'https://a.tiles.mapbox.com/v4/mapbox.mapbox-terrain-v2,mapbox.mapbox-streets-v7/{z}/{x}/{y}.vector.pbf',
    'https://b.tiles.mapbox.com/v4/mapbox.mapbox-terrain-v2,mapbox.mapbox-streets-v7/{z}/{x}/{y}.vector.pbf'
];

const nonMapboxTileURLs = [
    'https://a.example.com/tiles/{z}/{x}/{y}.mvt',
    'https://b.example.com/tiles/{z}/{x}/{y}.mvt'
];

function withFixedDate(t, now, fn) {
    const dateNow = t.stub(Date, 'now').callsFake(() => now);
    fn();
    dateNow.restore();
}

test("mapbox", (t) => {
    t.beforeEach(() => {
        config.ACCESS_TOKEN = 'key';
        config.REQUIRE_ACCESS_TOKEN = true;
        config.API_URL = 'https://api.mapbox.com';
    });

    t.test('.isMapboxHTTPURL', (t) => {
        t.ok(mapbox.isMapboxHTTPURL('http://mapbox.com'));
        t.ok(mapbox.isMapboxHTTPURL('https://mapbox.com'));
        t.ok(mapbox.isMapboxHTTPURL('https://mapbox.com/'));
        t.ok(mapbox.isMapboxHTTPURL('https://mapbox.com?'));
        t.ok(mapbox.isMapboxHTTPURL('https://api.mapbox.com/tiles'));
        t.ok(mapbox.isMapboxHTTPURL('https://api.mapbox.cn/tiles'));
        t.ok(mapbox.isMapboxHTTPURL('http://a.tiles.mapbox.cn/tiles'));
        t.notOk(mapbox.isMapboxHTTPURL('http://example.com/mapbox.com'));
        t.end();
    });

    t.test('.isMapboxHTTPStyleURL', (t) => {
        t.ok(mapbox.isMapboxHTTPStyleURL('https://api.mapbox.com/styles/v1/mapbox/streets-v11'));
        t.ok(mapbox.isMapboxHTTPStyleURL('https://api.mapbox.com/styles/v52/mapbox/streets-v11'));
        t.ok(mapbox.isMapboxHTTPStyleURL('https://api.mapbox.com/styles/v1/mapbox/streets-v11?'));
        t.ok(mapbox.isMapboxHTTPStyleURL('https://api.mapbox.cn/styles/v1/mapbox/streets-v11'));
        t.notOk(mapbox.isMapboxHTTPStyleURL('https://api.mapbox.com/styles/v1/mapbox/streets-v11/sprite@2x.json'));
        t.notOk(mapbox.isMapboxHTTPStyleURL('http://example.com/mapbox.com'));
        t.end();
    });

    t.test('.isMapboxHTTPTileJSONURL', (t) => {
        t.ok(mapbox.isMapboxHTTPTileJSONURL('https://api.mapbox.com/v4/mapbox.mapbox-streets-v8,mapbox.mapbox-terrain-v2.json'));
        t.ok(mapbox.isMapboxHTTPTileJSONURL('https://api.mapbox.com/v52/mapbox.mapbox-streets-v8,mapbox.mapbox-terrain-v2.json'));
        t.ok(mapbox.isMapboxHTTPTileJSONURL('https://api.mapbox.com/v4/mapbox.mapbox-streets-v8,mapbox.mapbox-terrain-v2.json?access_token=pk.eyJ1Ijoi'));
        t.ok(mapbox.isMapboxHTTPTileJSONURL('https://api.mapbox.com/v4/mapbox.mapbox-streets-v8.json'));
        t.ok(mapbox.isMapboxHTTPTileJSONURL('https://api.mapbox.cn/v4/mapbox.mapbox-streets-v8.json'));
        t.ok(mapbox.isMapboxHTTPTileJSONURL('http://a.tiles.mapbox.cn/v4/mapbox.mapbox-streets-v8,mapbox.mapbox-terrain-v2.json'));
        t.notOk(mapbox.isMapboxHTTPTileJSONURL('http://example.com/v4/mapbox.mapbox-streets-v8,mapbox.mapbox-terrain-v2.json'));
        t.end();
    });

    t.test('.isMapboxHTTPSpriteURL', (t) => {
        t.ok(mapbox.isMapboxHTTPSpriteURL('https://api.mapbox.com/styles/v1/mapbox/streets-v11/sprite@2x.json'));
        t.ok(mapbox.isMapboxHTTPSpriteURL('https://api.mapbox.com/styles/v52/mapbox/streets-v11/sprite@2x.json'));
        t.ok(mapbox.isMapboxHTTPSpriteURL('https://api.mapbox.com/styles/v1/mapbox/streets-v11/sprite@2.5x.json'));
        t.ok(mapbox.isMapboxHTTPSpriteURL('https://api.mapbox.com/styles/v1/mapbox/streets-v11/sprite@2x.json?access_token=pk.eyJ1Ijoi'));
        t.ok(mapbox.isMapboxHTTPSpriteURL('https://api.mapbox.com/styles/v1/user/style/sprite.json'));
        t.ok(mapbox.isMapboxHTTPSpriteURL('https://api.mapbox.com/styles/v1/user/style/sprite@2x.json'));
        t.ok(mapbox.isMapboxHTTPSpriteURL('https://api.mapbox.cn/styles/v1/mapbox/streets-v11/sprite@2x.json'));
        t.notOk(mapbox.isMapboxHTTPSpriteURL('http://example.com/mapbox.com/styles/v1/user/style/sprite@2x.json'));
        t.notOk(mapbox.isMapboxHTTPSpriteURL('http://example.com/mapbox.com/sprite@2x.json'));
        t.notOk(mapbox.isMapboxHTTPSpriteURL('http://example.com/mapbox.com/images@2x.json'));
        t.notOk(mapbox.isMapboxHTTPSpriteURL('https://api.mapbox.com/styles/v1/mapbox/streets-v11'));
        t.end();
    });

    t.test('.isMapboxHTTPFontsURL', (t) => {
        t.ok(mapbox.isMapboxHTTPFontsURL('https://api.mapbox.com/fonts/v1/mapbox/DIN%20Offc%20Pro%20Medium,Arial%20Unicode%20MS%20Regular/8192-8447.pbf'));
        t.ok(mapbox.isMapboxHTTPFontsURL('https://api.mapbox.com/fonts/v52/mapbox/DIN%20Offc%20Pro%20Medium,Arial%20Unicode%20MS%20Regular/8192-8447.pbf'));
        t.ok(mapbox.isMapboxHTTPFontsURL('https://api.mapbox.com/fonts/v1/mapbox/DIN%20Offc%20Pro%20Medium,Arial%20Unicode%20MS%20Regular/0-255.pbf'));
        t.ok(mapbox.isMapboxHTTPFontsURL('https://api.mapbox.com/fonts/v1/mapbox/DIN%20Offc%20Pro%20Medium,Arial%20Unicode%20MS%20Regular/0-255.pbf?access_token=pk.eyJ1Ijoi'));
        t.ok(mapbox.isMapboxHTTPFontsURL('https://api.mapbox.com/fonts/v1/mapbox/font1,font2/0-255.pbf'));
        t.ok(mapbox.isMapboxHTTPFontsURL('https://api.mapbox.cn/fonts/v1/mapbox/font1,font2/0-255.pbf'));
        t.notOk(mapbox.isMapboxHTTPFontsURL('https://example.com/file.pbf'));
        t.notOk(mapbox.isMapboxHTTPFontsURL('https://api.mapbox.com/styles/v1/mapbox/streets-v11'));
        t.end();
    });

    t.test('RequestManager', (t) => {
        const manager = new mapbox.RequestManager();

        t.test('creates token and expiration timestamp on construction', (t) => {
            t.ok(manager._skuToken);
            t.ok(manager._skuTokenExpiresAt);
            t.end();
        });

        t.test('identifies expired tokens correctly', (t) => {
            const now = +Date.now();
            const ms13Hours = (13 * 60 * 60 * 1000);
            t.notOk(manager._isSkuTokenExpired());
            const token = manager._skuToken;
            withFixedDate(t, now + ms13Hours, () => manager.normalizeTileURL("mapbox://tiles/a.b/0/0/0.pbf"));
            t.notEqual(token, manager._skuToken);
            t.end();
        });

        t.test('takes map-specific tokens correctly', (t) => {
            const m = new mapbox.RequestManager(undefined, 'customAccessToken');
            t.equal(m.normalizeStyleURL('mapbox://styles/user/style'), 'https://api.mapbox.com/styles/v1/user/style?access_token=customAccessToken');
            t.end();
        });

        webpSupported.supported = false;

        t.test('.normalizeStyleURL', (t) => {
            t.test('returns an API URL with access_token parameter when no query string', (t) => {
                t.equal(manager.normalizeStyleURL('mapbox://styles/user/style'), 'https://api.mapbox.com/styles/v1/user/style?access_token=key');
                t.equal(manager.normalizeStyleURL('mapbox://styles/user/style/draft'), 'https://api.mapbox.com/styles/v1/user/style/draft?access_token=key');
                t.end();
            });

            t.test('returns an API URL with access_token parameter when query string exists', (t) => {
                t.equal(manager.normalizeStyleURL('mapbox://styles/user/style?fresh=true'), 'https://api.mapbox.com/styles/v1/user/style?fresh=true&access_token=key');
                t.equal(manager.normalizeStyleURL('mapbox://styles/user/style/draft?fresh=true'), 'https://api.mapbox.com/styles/v1/user/style/draft?fresh=true&access_token=key');
                t.equal(manager.normalizeStyleURL('mapbox://styles/foo/bar'), 'https://api.mapbox.com/styles/v1/foo/bar?access_token=key');
                t.end();
            });

            t.test('ignores non-mapbox:// scheme', (t) => {
                t.equal(manager.normalizeStyleURL('http://path'), 'http://path');
                t.end();
            });

            t.test('handles custom API_URLs with paths', (t) => {
                config.API_URL = 'https://test.example.com/api.mapbox.com';
                t.equal(
                    manager.normalizeStyleURL('mapbox://styles/foo/bar'),
                    'https://test.example.com/api.mapbox.com/styles/v1/foo/bar?access_token=key'
                );
                t.end();
            });

            t.end();
        });

        t.test('.normalizeSourceURL', (t) => {
            t.test('returns a v4 URL with access_token parameter', (t) => {
                t.equal(manager.normalizeSourceURL('mapbox://user.map'), 'https://api.mapbox.com/v4/user.map.json?secure&access_token=key');
                t.end();
            });

            t.test('uses provided access token', (t) => {
                t.equal(manager.normalizeSourceURL('mapbox://user.map', 'token'), 'https://api.mapbox.com/v4/user.map.json?secure&access_token=token');
                t.end();
            });

            t.test('uses provided query parameters', (t) => {
                t.equal(manager.normalizeSourceURL('mapbox://user.map?foo=bar', 'token'), 'https://api.mapbox.com/v4/user.map.json?foo=bar&secure&access_token=token');
                t.end();
            });

            t.test('works with composite sources', (t) => {
                t.equal(manager.normalizeSourceURL('mapbox://one.a,two.b,three.c'), 'https://api.mapbox.com/v4/one.a,two.b,three.c.json?secure&access_token=key');
                t.end();
            });

            t.test('adds language query parameter', (t) => {
                t.equal(manager.normalizeSourceURL('mapbox://user.map?foo=bar', 'token', 'es'), 'https://api.mapbox.com/v4/user.map.json?foo=bar&secure&language=es&access_token=token');
                t.end();
            });

            t.test('adds worldview query parameter', (t) => {
                t.equal(manager.normalizeSourceURL('mapbox://user.map?foo=bar', 'token', null, 'JP'), 'https://api.mapbox.com/v4/user.map.json?foo=bar&secure&worldview=JP&access_token=token');
                t.end();
            });

            t.test('adds language and worldview query parameters', (t) => {
                t.equal(manager.normalizeSourceURL('mapbox://user.map?foo=bar', 'token', 'es', 'JP'), 'https://api.mapbox.com/v4/user.map.json?foo=bar&secure&language=es&worldview=JP&access_token=token');
                t.end();
            });

            t.test('throws an error if no access token is provided', (t) => {
                config.ACCESS_TOKEN = null;
                t.throws(() => { manager.normalizeSourceURL('mapbox://user.map'); }, 'An API access token is required to use Mapbox GL.');
                config.ACCESS_TOKEN = 'key';
                t.end();
            });

            t.test('throws an error if a secret access token is provided', (t) => {
                config.ACCESS_TOKEN = 'sk.abc.123';
                t.throws(() => { manager.normalizeSourceURL('mapbox://user.map'); }, 'Use a public access token (pk.*) with Mapbox GL JS.');
                config.ACCESS_TOKEN = 'key';
                t.end();
            });

            t.test('ignores non-mapbox:// scheme', (t) => {
                t.equal(manager.normalizeSourceURL('http://path'), 'http://path');
                t.end();
            });

            t.test('handles custom API_URLs with paths', (t) => {
                config.API_URL = 'https://test.example.com/api.mapbox.com';
                t.equal(
                    manager.normalizeSourceURL('mapbox://one.a'),
                    'https://test.example.com/api.mapbox.com/v4/one.a.json?secure&access_token=key'
                );
                t.end();
            });

            t.test('removes secure params if custom API_URL is http', (t) => {
                config.API_URL = 'http://test.example.com/api.mapbox.com';
                t.equal(
                    manager.normalizeSourceURL('mapbox://one.a'),
                    'http://test.example.com/api.mapbox.com/v4/one.a.json?access_token=key'
                );
                t.end();
            });

            t.end();
        });

        t.test('.normalizeGlyphsURL', (t) => {
            t.test('normalizes mapbox:// URLs when no query string', (t) => {
                t.equal(manager.normalizeGlyphsURL('mapbox://fonts/boxmap/{fontstack}/{range}.pbf'), 'https://api.mapbox.com/fonts/v1/boxmap/{fontstack}/{range}.pbf?access_token=key');
                t.end();
            });

            t.test('normalizes mapbox:// URLs when query string exists', (t) => {
                t.equal(manager.normalizeGlyphsURL('mapbox://fonts/boxmap/{fontstack}/{range}.pbf?fresh=true'), 'https://api.mapbox.com/fonts/v1/boxmap/{fontstack}/{range}.pbf?fresh=true&access_token=key');
                t.end();
            });

            t.test('ignores non-mapbox:// scheme', (t) => {
                t.equal(manager.normalizeGlyphsURL('http://path'), 'http://path');
                t.end();
            });

            t.test('handles custom API_URLs with paths', (t) => {
                config.API_URL = 'https://test.example.com/api.mapbox.com';
                t.equal(
                    manager.normalizeGlyphsURL('mapbox://fonts/boxmap/{fontstack}/{range}.pbf'),
                    'https://test.example.com/api.mapbox.com/fonts/v1/boxmap/{fontstack}/{range}.pbf?access_token=key'
                );
                t.end();
            });

            t.end();
        });

        t.test('.normalizeSpriteURL', (t) => {
            t.test('normalizes mapbox:// URLs when no query string', (t) => {
                t.equal(
                    manager.normalizeSpriteURL('mapbox://sprites/mapbox/streets-v8', '', '.json'),
                    'https://api.mapbox.com/styles/v1/mapbox/streets-v8/sprite.json?access_token=key'
                );

                t.equal(
                    manager.normalizeSpriteURL('mapbox://sprites/mapbox/streets-v8', '@2x', '.png'),
                    'https://api.mapbox.com/styles/v1/mapbox/streets-v8/sprite@2x.png?access_token=key'
                );

                t.equal(
                    manager.normalizeSpriteURL('mapbox://sprites/mapbox/streets-v8/draft', '@2x', '.png'),
                    'https://api.mapbox.com/styles/v1/mapbox/streets-v8/draft/sprite@2x.png?access_token=key'
                );

                t.end();
            });

            t.test('normalizes mapbox:// URLs when query string exists', (t) => {
                t.equal(
                    manager.normalizeSpriteURL('mapbox://sprites/mapbox/streets-v8?fresh=true', '', '.json'),
                    'https://api.mapbox.com/styles/v1/mapbox/streets-v8/sprite.json?fresh=true&access_token=key'
                );

                t.equal(
                    manager.normalizeSpriteURL('mapbox://sprites/mapbox/streets-v8?fresh=false', '@2x', '.png'),
                    'https://api.mapbox.com/styles/v1/mapbox/streets-v8/sprite@2x.png?fresh=false&access_token=key'
                );

                t.equal(
                    manager.normalizeSpriteURL('mapbox://sprites/mapbox/streets-v8/draft?fresh=true', '@2x', '.png'),
                    'https://api.mapbox.com/styles/v1/mapbox/streets-v8/draft/sprite@2x.png?fresh=true&access_token=key'
                );

                t.end();
            });

            t.test('concantenates path, ratio, and extension for non-mapbox:// scheme', (t) => {
                t.equal(manager.normalizeSpriteURL('http://www.foo.com/bar', '@2x', '.png'), 'http://www.foo.com/bar@2x.png');
                t.end();
            });

            t.test('concantenates path, ratio, and extension for file:/// scheme', (t) => {
                t.equal(manager.normalizeSpriteURL('file:///path/to/bar', '@2x', '.png'), 'file:///path/to/bar@2x.png');
                t.end();
            });

            t.test('normalizes non-mapbox:// scheme when query string exists', (t) => {
                t.equal(manager.normalizeSpriteURL('http://www.foo.com/bar?fresh=true', '@2x', '.png'), 'http://www.foo.com/bar@2x.png?fresh=true');
                t.end();
            });

            t.test('handles custom API_URLs with paths', (t) => {
                config.API_URL = 'https://test.example.com/api.mapbox.com';
                t.equal(
                    manager.normalizeSpriteURL('mapbox://sprites/mapbox/streets-v8', '', '.json'),
                    'https://test.example.com/api.mapbox.com/styles/v1/mapbox/streets-v8/sprite.json?access_token=key'
                );
                t.end();
            });

            t.end();
        });

        t.test('canonicalize raster tileset', (t) => {
            const tileset = {tiles: ["http://a.tiles.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=key"]};
            manager.canonicalizeTileset(tileset, "mapbox://mapbox.satellite");
            t.deepEquals(manager.canonicalizeTileset(tileset, "mapbox://mapbox.satellite"), ["mapbox://tiles/mapbox.satellite/{z}/{x}/{y}.png"]);
            t.end();
        });

        t.test('canonicalize vector tileset', (t) => {
            const tileset = {tiles: ["http://a.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.vector.pbf?access_token=key"]};
            t.deepEquals(manager.canonicalizeTileset(tileset, "mapbox://mapbox.streets"), ["mapbox://tiles/mapbox.streets/{z}/{x}/{y}.vector.pbf"]);
            t.end();
        });

        t.test('.canonicalizeTileURL', (t) => {
            const tileJSONURL = "mapbox://mapbox.streets";

            t.equals(manager.canonicalizeTileURL("http://a.tiles.mapbox.com/v4/a.b/{z}/{x}/{y}.vector.pbf", tileJSONURL),
                "mapbox://tiles/a.b/{z}/{x}/{y}.vector.pbf");
            t.equals(manager.canonicalizeTileURL("http://b.tiles.mapbox.com/v4/a.b/{z}/{x}/{y}.vector.pbf", tileJSONURL),
                "mapbox://tiles/a.b/{z}/{x}/{y}.vector.pbf");
            t.equals(manager.canonicalizeTileURL("http://api.mapbox.com/v4/a.b/{z}/{x}/{y}.vector.pbf", tileJSONURL),
                "mapbox://tiles/a.b/{z}/{x}/{y}.vector.pbf");
            t.equals(manager.canonicalizeTileURL("http://api.mapbox.com/v4/a.b/{z}/{x}/{y}.vector.pbf?access_token=key", tileJSONURL),
                "mapbox://tiles/a.b/{z}/{x}/{y}.vector.pbf");
            t.equals(manager.canonicalizeTileURL("https://api.mapbox.cn/v4/a.b/{z}/{x}/{y}.vector.pbf?access_token=key", tileJSONURL),
                "mapbox://tiles/a.b/{z}/{x}/{y}.vector.pbf");
            t.equals(manager.canonicalizeTileURL("http://api.mapbox.com/v4/a.b,c.d/{z}/{x}/{y}.vector.pbf?access_token=key", tileJSONURL),
                "mapbox://tiles/a.b,c.d/{z}/{x}/{y}.vector.pbf");
            t.equals(manager.canonicalizeTileURL("http://a.tiles.mapbox.com/v4/a.b/{z}/{x}/{y}.vector.pbf?access_token=key&custom=parameter", tileJSONURL),
                "mapbox://tiles/a.b/{z}/{x}/{y}.vector.pbf?custom=parameter");
            t.equals(manager.canonicalizeTileURL("http://a.tiles.mapbox.com/v4/a.b/{z}/{x}/{y}.vector.pbf?custom=parameter&access_token=key", tileJSONURL),
                "mapbox://tiles/a.b/{z}/{x}/{y}.vector.pbf?custom=parameter");
            t.equals(manager.canonicalizeTileURL("http://a.tiles.mapbox.com/v4/a.b/{z}/{x}/{y}.vector.pbf?custom=parameter&access_token=key&second=param", tileJSONURL),
                "mapbox://tiles/a.b/{z}/{x}/{y}.vector.pbf?custom=parameter&second=param");
            t.equals(manager.canonicalizeTileURL("http://api.mapbox.com/v4/a.b/{z}/{x}/{y}.jpg?access_token=key", tileJSONURL),
                "mapbox://tiles/a.b/{z}/{x}/{y}.jpg");
            t.equals(manager.canonicalizeTileURL("http://api.mapbox.com/v4/a.b/{z}/{x}/{y}.jpg70?access_token=key", tileJSONURL),
                "mapbox://tiles/a.b/{z}/{x}/{y}.jpg70");
            t.equals(manager.canonicalizeTileURL("http://api.mapbox.com/v4/a.b/{z}/{x}/{y}.jpg?access_token=key", tileJSONURL),
                "mapbox://tiles/a.b/{z}/{x}/{y}.jpg");
            t.equals(manager.canonicalizeTileURL("http://api.mapbox.com/v4/a.b/{z}/{x}/{y}.jpg70?access_token=key", tileJSONURL),
                "mapbox://tiles/a.b/{z}/{x}/{y}.jpg70");
            t.equals(manager.canonicalizeTileURL("http://api.mapbox.com/v4/a.b/{z}/{x}/{y}.png", tileJSONURL),
                "mapbox://tiles/a.b/{z}/{x}/{y}.png");
            t.equals(manager.canonicalizeTileURL("http://api.mapbox.com/v4/a.b/{z}/{x}/{y}.png?access_token=key", tileJSONURL),
                "mapbox://tiles/a.b/{z}/{x}/{y}.png");
            t.equals(manager.canonicalizeTileURL("http://api.mapbox.com/v4/a.b/{z}/{x}/{y}.png", tileJSONURL),
                "mapbox://tiles/a.b/{z}/{x}/{y}.png");
            t.equals(manager.canonicalizeTileURL("http://api.mapbox.com/v4/a.b/{z}/{x}/{y}.png?access_token=key", tileJSONURL),
                "mapbox://tiles/a.b/{z}/{x}/{y}.png");
            t.equals(manager.canonicalizeTileURL("http://api.mapbox.com/raster/v1/a.b/{z}/{x}/{y}.png?access_token=key", tileJSONURL),
                "mapbox://raster/a.b/{z}/{x}/{y}.png");

            // We don't ever expect to see these inputs, but be safe anyway.
            t.equals(manager.canonicalizeTileURL("http://path"), "http://path");
            t.equals(manager.canonicalizeTileURL("http://api.mapbox.com/v4/"), "http://api.mapbox.com/v4/");
            t.equals(manager.canonicalizeTileURL("http://api.mapbox.com/v4/a.b/{z}/{x}/{y}."), "http://api.mapbox.com/v4/a.b/{z}/{x}/{y}.");
            t.equals(manager.canonicalizeTileURL("http://api.mapbox.com/v4/a.b/{z}/{x}/{y}/."), "http://api.mapbox.com/v4/a.b/{z}/{x}/{y}/.");
            t.end();
        });

        t.test('.normalizeTileURL', (t) => {
            t.test('.normalizeTileURL does nothing on 1x devices', (t) => {
                config.API_URL = 'http://path.png';
                config.REQUIRE_ACCESS_TOKEN = false;
                t.equal(manager.normalizeTileURL('mapbox://path.png/tile.png'),   `http://path.png/v4/tile.png`);
                t.equal(manager.normalizeTileURL('mapbox://path.png/tile.png32'), `http://path.png/v4/tile.png32`);
                t.equal(manager.normalizeTileURL('mapbox://path.png/tile.jpg70'), `http://path.png/v4/tile.jpg70`);
                t.end();
            });

            t.test('.normalizeTileURL inserts @2x if source requests it', (t) => {
                config.API_URL = 'http://path.png';
                config.REQUIRE_ACCESS_TOKEN = false;
                t.equal(manager.normalizeTileURL('mapbox://path.png/tile.png', true), `http://path.png/v4/tile@2x.png`);
                t.equal(manager.normalizeTileURL('mapbox://path.png/tile.png32', true), `http://path.png/v4/tile@2x.png32`);
                t.equal(manager.normalizeTileURL('mapbox://path.png/tile.jpg70', true), `http://path.png/v4/tile@2x.jpg70`);
                t.equal(manager.normalizeTileURL('mapbox://path.png/tile.png?access_token=foo', true), `http://path.png/v4/tile@2x.png?access_token=foo`);
                t.end();
            });

            t.test('.normalizeTileURL inserts @2x for 512 raster tiles on v4 of the api', (t) => {
                config.API_URL = 'http://path.png';
                config.REQUIRE_ACCESS_TOKEN = false;
                t.equal(manager.normalizeTileURL('mapbox://path.png/tile.png', false, 256), `http://path.png/v4/tile.png`);
                t.equal(manager.normalizeTileURL('mapbox://path.png/tile.png', false, 512), `http://path.png/v4/tile@2x.png`);
                t.equal(manager.normalizeTileURL("mapbox://raster/a.b/0/0/0.png", false, 256), `http://path.png/raster/v1/a.b/0/0/0.png`);
                t.equal(manager.normalizeTileURL("mapbox://raster/a.b/0/0/0.png", false, 512), `http://path.png/raster/v1/a.b/0/0/0.png`);
                t.end();
            });

            t.test('.normalizeTileURL replaces img extension with webp on supporting devices', (t) => {
                webpSupported.supported = true;
                config.API_URL = 'http://path.png';
                config.REQUIRE_ACCESS_TOKEN = false;
                t.equal(manager.normalizeTileURL('mapbox://path.png/tile.png'), `http://path.png/v4/tile.webp`);
                t.equal(manager.normalizeTileURL('mapbox://path.png/tile.png32'), `http://path.png/v4/tile.webp`);
                t.equal(manager.normalizeTileURL('mapbox://path.png/tile.jpg70'), `http://path.png/v4/tile.webp`);
                t.equal(manager.normalizeTileURL('mapbox://path.png/tile.png?access_token=foo'), `http://path.png/v4/tile.webp?access_token=foo`);
                webpSupported.supported = false;
                t.end();
            });

            t.test('.normalizeTileURL ignores non-mapbox:// sources', (t) => {
                t.equal(manager.normalizeTileURL('http://path.png'), 'http://path.png');
                t.end();
            });

            t.test('.normalizeTileURL accounts for tileURLs w/ paths', (t) => {
                // Add a path to the config:
                config.API_URL = 'http://localhost:8080/mbx';
                const input    = `mapbox://tiles/mapbox.mapbox-terrain-v2,mapbox.mapbox-streets-v7/10/184/401.vector.pbf?access_token=${config.ACCESS_TOKEN}`;
                const expected = `http://localhost:8080/mbx/v4/mapbox.mapbox-terrain-v2,mapbox.mapbox-streets-v7/10/184/401.vector.pbf?sku=${manager._skuToken}&access_token=${config.ACCESS_TOKEN}`;
                t.equal(manager.normalizeTileURL(input), expected);
                t.end();
            });

            t.test('.normalizeTileURL ignores undefined sources', (t) => {
                t.equal(manager.normalizeTileURL('http://path.png'), 'http://path.png');
                t.end();
            });

            t.test('.normalizeTileURL does not modify the access token for non-mapbox sources', (t) => {
                config.API_URL = 'http://example.com';
                t.equal(manager.normalizeTileURL('http://example.com/tile.png?access_token=tk.abc.123'), 'http://example.com/tile.png?access_token=tk.abc.123');
                t.end();
            });

            t.test('.normalizeTileURL throw error on falsy url input', (t) => {
                t.throws(() => {
                    manager.normalizeTileURL('');
                }, new Error('Unable to parse URL object'));
                t.end();
            });

            t.test('.normalizeTileURL matches gl-native normalization', (t) => {
                config.API_URL = 'https://api.mapbox.com/';
                // ensure the token exists
                t.ok(manager._skuToken);
                t.equal(manager.normalizeTileURL("mapbox://tiles/a.b/0/0/0.pbf"), `https://api.mapbox.com/v4/a.b/0/0/0.pbf?sku=${manager._skuToken}&access_token=key`);
                t.equal(manager.normalizeTileURL("mapbox://tiles/a.b/0/0/0.pbf?style=mapbox://styles/mapbox/streets-v9@0"), `https://api.mapbox.com/v4/a.b/0/0/0.pbf?style=mapbox://styles/mapbox/streets-v9@0&sku=${manager._skuToken}&access_token=key`);
                t.equal(manager.normalizeTileURL("mapbox://tiles/a.b/0/0/0.pbf?"), `https://api.mapbox.com/v4/a.b/0/0/0.pbf?sku=${manager._skuToken}&access_token=key`);
                t.equal(manager.normalizeTileURL("mapbox://tiles/a.b/0/0/0.png"), `https://api.mapbox.com/v4/a.b/0/0/0.png?sku=${manager._skuToken}&access_token=key`);
                t.equal(manager.normalizeTileURL("mapbox://tiles/a.b/0/0/0@2x.png"), `https://api.mapbox.com/v4/a.b/0/0/0@2x.png?sku=${manager._skuToken}&access_token=key`);
                t.equal(manager.normalizeTileURL("mapbox://tiles/a.b,c.d/0/0/0.pbf"), `https://api.mapbox.com/v4/a.b,c.d/0/0/0.pbf?sku=${manager._skuToken}&access_token=key`);
                t.equal(manager.normalizeTileURL("mapbox://raster/a.b/0/0/0.png"), `https://api.mapbox.com/raster/v1/a.b/0/0/0.png?sku=${manager._skuToken}&access_token=key`);

                config.API_URL = 'https://api.example.com/';
                t.equal(manager.normalizeTileURL("mapbox://tiles/a.b/0/0/0.png"), `https://api.example.com/v4/a.b/0/0/0.png?sku=${manager._skuToken}&access_token=key`);
                t.equal(manager.normalizeTileURL("http://path"), "http://path");

                t.end();
            });
            t.end();
        });

        webpSupported.supported = true;
        t.end();
    });

    t.test('PerformanceEvent', (t) => {
        let event;

        t.beforeEach(() => {
            window.useFakeXMLHttpRequest();
            event = new mapbox.PerformanceEvent();
        });

        t.afterEach(() => {
            window.restore();
        });

        t.test('mapbox.postPerformanceEvent', (t) => {
            t.ok(mapbox.postPerformanceEvent);
            t.end();
        });

        t.test('does not contains sku, skuId and userId', (t) => {
            event.postPerformanceEvent('token', {
                width: 100,
                height: 100,
                interactionRange: [0, 0],
                projection: 'mercator'
            });

            const reqBody = window.server.requests[0].requestBody;
            const performanceEvent = JSON.parse(reqBody.slice(1, reqBody.length - 1));

            t.equals(performanceEvent.event, 'gljs.performance');
            t.notOk(performanceEvent.skuId);
            t.notOk(performanceEvent.skuToken);
            t.notOk(performanceEvent.userId);
            t.end();
        });

        t.test('contains default payload', (t) => {
            event.postPerformanceEvent('token', {
                width: 100,
                height: 100,
                interactionRange: [0, 0],
                projection: 'mercator'
            });

            const reqBody = window.server.requests[0].requestBody;
            const performanceEvent = JSON.parse(reqBody.slice(1, reqBody.length - 1));

            t.equals(performanceEvent.event, 'gljs.performance');
            t.true(!!performanceEvent.created);
            t.end();
        });

        t.test('metrics', (t) => {
            event.postPerformanceEvent('token', {
                width: 100,
                height: 50,
                interactionRange: [0, 0],
                projection: 'mercator',
                vendor: 'webgl vendor',
                renderer: 'webgl renderer'
            });

            const reqBody = window.server.requests[0].requestBody;
            const performanceEvent = JSON.parse(reqBody.slice(1, reqBody.length - 1));
            const checkMetric = (data, metricName, metricValue) => {
                for (const metric of data) {
                    if (metric.name === metricName) {
                        t.equals(metric.value, metricValue);
                        return;
                    }
                }
                assert(false);
            };

            t.equals(performanceEvent.event, 'gljs.performance');

            checkMetric(performanceEvent.metadata, 'sdkVersion', version);
            checkMetric(performanceEvent.metadata, 'sdkIdentifier', 'mapbox-gl-js');
            checkMetric(performanceEvent.metadata, 'devicePixelRatio', '1');
            checkMetric(performanceEvent.metadata, 'windowWidth', '1024');
            checkMetric(performanceEvent.metadata, 'windowHeight', '768');
            checkMetric(performanceEvent.metadata, 'mapWidth', '100');
            checkMetric(performanceEvent.metadata, 'mapHeight', '50');
            checkMetric(performanceEvent.metadata, 'webglVendor', 'webgl vendor');
            checkMetric(performanceEvent.metadata, 'webglRenderer', 'webgl renderer');
            checkMetric(performanceEvent.attributes, 'terrainEnabled', 'false');
            checkMetric(performanceEvent.attributes, 'projection', 'mercator');
            checkMetric(performanceEvent.attributes, 'fogEnabled', 'false');

            t.end();
        });

        t.end();
    });

    t.test('TurnstileEvent', (t) => {
        const ms25Hours = (25 * 60 * 60 * 1000);
        let event;
        t.beforeEach(() => {
            window.useFakeXMLHttpRequest();
            event = new mapbox.TurnstileEvent();
        });

        t.afterEach(() => {
            window.restore();
        });

        t.test('mapbox.postTurnstileEvent', (t) => {
            t.ok(mapbox.postTurnstileEvent);
            t.end();
        });

        t.test('contains all payload including skuId', (t) => {
            event.postTurnstileEvent(mapboxTileURLs);
            const reqBody = window.server.requests[0].requestBody;
            // reqBody is a string of an array containing the event object so pick out the stringified event object and convert to an object
            const mapLoadEvent = JSON.parse(reqBody.slice(1, reqBody.length - 1));
            t.equals(mapLoadEvent.event, 'appUserTurnstile');
            t.equals(mapLoadEvent.skuId, SKU_ID);
            t.equals(mapLoadEvent.sdkIdentifier, 'mapbox-gl-js');
            t.equals(mapLoadEvent.sdkVersion, version);
            t.equals(mapLoadEvent["enabled.telemetry"], false);
            t.true(!!mapLoadEvent.userId);
            t.true(!!mapLoadEvent.created);
            t.end();
        });

        t.test('does not POST when mapboxgl.ACCESS_TOKEN is not set', (t) => {
            config.ACCESS_TOKEN = null;

            event.postTurnstileEvent(mapboxTileURLs);

            t.equal(window.server.requests.length, 0);
            t.end();
        });

        t.test('does not POST when url does not point to mapbox.com', (t) => {
            event.postTurnstileEvent(nonMapboxTileURLs);

            t.equal(window.server.requests.length, 0);
            t.end();
        });

        t.test('POSTs cn event when API_URL change to cn endpoint', (t) => {
            config.API_URL = 'https://api.mapbox.cn';

            event.postTurnstileEvent(mapboxTileURLs);

            const req = window.server.requests[0];
            req.respond(200);

            t.true(req.url.indexOf('https://events.mapbox.cn') > -1);
            t.end();
        });

        t.test('POSTs no event when API_URL unavailable', (t) => {
            config.API_URL = null;
            event.postTurnstileEvent(mapboxTileURLs);
            t.equal(window.server.requests.length, 0, 'no events posted');
            t.end();
        });

        t.test('POSTs no event when API_URL non-standard', (t) => {
            config.API_URL = 'https://api.example.com';
            event.postTurnstileEvent(mapboxTileURLs);
            t.equal(window.server.requests.length, 0, 'no events posted');
            t.end();
        });

        t.test('with LocalStorage available', (t) => {
            let prevLocalStorage;
            t.beforeEach(() => {
                prevLocalStorage = window.localStorage;
                window.localStorage = {
                    data: {},
                    setItem (id, val) {
                        this.data[id] = String(val);
                    },
                    getItem (id) {
                        return this.data.hasOwnProperty(id) ? this.data[id] : undefined;
                    },
                    removeItem (id) {
                        if (this.hasOwnProperty(id)) delete this[id];
                    }
                };
            });

            t.afterEach(() => {
                window.localStorage = prevLocalStorage;
            });

            t.test('does not POST event when previously stored data is on the same day', (t) => {
                const now = +Date.now();
                window.localStorage.setItem(`mapbox.eventData.uuid:${config.ACCESS_TOKEN}`, uuid());
                window.localStorage.setItem(`mapbox.eventData:${config.ACCESS_TOKEN}`, JSON.stringify({
                    lastSuccess: now,
                    tokenU: 'key'
                }));

                // Post 5 seconds later
                withFixedDate(t, now + 5, () => event.postTurnstileEvent(mapboxTileURLs));
                t.false(window.server.requests.length);
                t.end();
            });

            t.test('POSTs event when previously stored anonId is not a valid uuid', (t) => {
                const now = +Date.now();
                window.localStorage.setItem(`mapbox.eventData.uuid:${config.ACCESS_TOKEN}`, 'anonymous');
                window.localStorage.setItem(`mapbox.eventData:${config.ACCESS_TOKEN}`, JSON.stringify({
                    lastSuccess: now
                }));

                withFixedDate(t, now + ms25Hours, () => event.postTurnstileEvent(mapboxTileURLs));

                const req = window.server.requests[0];
                req.respond(200);

                const reqBody = JSON.parse(req.requestBody)[0];
                t.notEqual(reqBody.userId, 'anonymous');
                t.equal(reqBody.skuId, SKU_ID);
                t.end();
            });

            t.test('POSTs event when previously stored timestamp is more than 24 hours in the future', (t) => {
                const now = +Date.now();

                window.localStorage.setItem(`mapbox.eventData.uuid:${config.ACCESS_TOKEN}`, uuid());
                window.localStorage.setItem(`mapbox.eventData:${config.ACCESS_TOKEN}`, JSON.stringify({
                    lastSuccess: now + ms25Hours // 24-hours later
                }));

                withFixedDate(t, now, () => event.postTurnstileEvent(mapboxTileURLs));

                const req = window.server.requests[0];
                req.respond(200);
                const reqBody = JSON.parse(req.requestBody)[0];
                equalWithPrecision(t, new Date(reqBody.created).valueOf(), now, 100);
                t.equal(reqBody.skuId, SKU_ID);

                t.end();
            });

            t.test('does not POST appuserTurnstile event second time within same calendar day', (t) => {
                let now = +Date.now();
                withFixedDate(t, now, () => event.postTurnstileEvent(mapboxTileURLs));

                //Post second event
                const firstEvent = now;
                now += (60 * 1000); // A bit later
                withFixedDate(t, now, () => event.postTurnstileEvent(mapboxTileURLs));

                const req = window.server.requests[0];
                req.respond(200);

                t.equal(window.server.requests.length, 1);

                const reqBody = JSON.parse(req.requestBody)[0];
                equalWithPrecision(t, new Date(reqBody.created).valueOf(), firstEvent, 100);

                t.end();
            });

            t.test('does not POST appuserTurnstile event second time when clock goes backwards less than a day', (t) => {
                let now = +Date.now();
                withFixedDate(t, now, () => event.postTurnstileEvent(mapboxTileURLs));

                //Post second event
                const firstEvent = now;
                now -= (60 * 1000); // A bit earlier
                withFixedDate(t, now, () => event.postTurnstileEvent(mapboxTileURLs));

                const req = window.server.requests[0];
                req.respond(200);

                t.equal(window.server.requests.length, 1);

                const reqBody = JSON.parse(req.requestBody)[0];
                equalWithPrecision(t, new Date(reqBody.created).valueOf(), firstEvent, 100);

                t.end();
            });

            t.test('POSTs appuserTurnstile event when access token changes', (t) => {
                config.ACCESS_TOKEN = 'pk.new.*';

                event.postTurnstileEvent(mapboxTileURLs);

                const req = window.server.requests[0];
                req.respond(200);

                t.equal(req.url, `${config.EVENTS_URL}?access_token=pk.new.*`);

                t.end();
            });

            t.end();
        });

        t.test('when LocalStorage is not available', (t) => {
            t.test('POSTs appuserTurnstile event', (t) => {
                event.postTurnstileEvent(mapboxTileURLs);

                const req = window.server.requests[0];
                req.respond(200);

                const reqBody = JSON.parse(req.requestBody)[0];
                t.equal(req.url, `${config.EVENTS_URL}?access_token=key`);
                t.equal(req.method, 'POST');
                t.equal(reqBody.event, 'appUserTurnstile');
                t.equal(reqBody.sdkVersion, version);
                t.equal(reqBody.skuId, SKU_ID);
                t.ok(reqBody.userId);

                t.end();
            });

            t.test('does not POST appuserTurnstile event second time within same calendar day', (t) => {
                let now = +Date.now();
                const firstEvent = now;
                withFixedDate(t, now, () => event.postTurnstileEvent(mapboxTileURLs));

                //Post second event
                now += (60 * 1000); // A bit later
                withFixedDate(t, now, () => event.postTurnstileEvent(mapboxTileURLs));

                const req = window.server.requests[0];
                req.respond(200);

                t.equal(window.server.requests.length, 1);

                const reqBody = JSON.parse(req.requestBody)[0];
                equalWithPrecision(t, new Date(reqBody.created).valueOf(), firstEvent, 100);

                t.end();
            });

            t.test('does not POST appuserTurnstile event second time when clock goes backwards less than a day', (t) => {
                let now = +Date.now();
                const firstEvent = now;
                event.postTurnstileEvent(mapboxTileURLs);

                //Post second event
                now -= (60 * 1000); // A bit earlier
                withFixedDate(t, now, () => event.postTurnstileEvent(mapboxTileURLs));

                const req = window.server.requests[0];
                req.respond(200);

                t.equal(window.server.requests.length, 1);

                const reqBody = JSON.parse(req.requestBody)[0];
                equalWithPrecision(t, new Date(reqBody.created).valueOf(), firstEvent, 100);

                t.end();
            });

            t.test('POSTs appuserTurnstile event when access token changes', (t) => {
                config.ACCESS_TOKEN = 'pk.new.*';

                event.postTurnstileEvent(mapboxTileURLs);

                const req = window.server.requests[0];
                req.respond(200);

                const reqBody = JSON.parse(req.requestBody)[0];
                t.equal(req.url, `${config.EVENTS_URL}?access_token=pk.new.*`);
                t.equal(req.method, 'POST');
                t.equal(reqBody.event, 'appUserTurnstile');
                t.equal(reqBody.sdkVersion, version);
                t.equal(reqBody.skuId, SKU_ID);
                t.ok(reqBody.userId);

                t.end();
            });

            t.test('POSTs appUserTurnstile event on next calendar day', (t) => {
                const now = +Date.now();
                event.postTurnstileEvent(mapboxTileURLs);
                // Add a day
                const tomorrow = now + ms25Hours;
                withFixedDate(t, tomorrow, () => event.postTurnstileEvent(mapboxTileURLs));

                let req = window.server.requests[0];
                req.respond(200);

                req = window.server.requests[1];
                req.respond(200);
                const reqBody = JSON.parse(req.requestBody)[0];
                t.equal(req.url, `${config.EVENTS_URL}?access_token=key`);
                t.equal(req.method, 'POST');
                t.equal(reqBody.event, 'appUserTurnstile');
                t.equal(reqBody.sdkVersion, version);
                t.equal(reqBody.skuId, SKU_ID);
                t.ok(reqBody.userId);
                equalWithPrecision(t, new Date(reqBody.created).valueOf(), tomorrow, 100);

                t.end();
            });

            t.test('Queues and POSTs appuserTurnstile events when triggered in quick succession', (t) => {
                let now = Date.now();

                const today = now;
                event.postTurnstileEvent(mapboxTileURLs);

                const laterToday = now + 1;
                withFixedDate(t, laterToday, () => event.postTurnstileEvent(mapboxTileURLs));

                const tomorrow = laterToday + ms25Hours; // Add a day
                now = tomorrow;
                withFixedDate(t, tomorrow, () => event.postTurnstileEvent(mapboxTileURLs));

                const reqToday = window.server.requests[0];
                reqToday.respond(200);
                let reqBody = JSON.parse(reqToday.requestBody)[0];
                equalWithPrecision(t, new Date(reqBody.created).valueOf(), today, 100);

                const reqTomorrow = window.server.requests[1];
                reqTomorrow.respond(200);
                reqBody = JSON.parse(reqTomorrow.requestBody)[0];
                equalWithPrecision(t, new Date(reqBody.created).valueOf(), tomorrow, 100);

                t.end();
            });

            t.end();
        });

        t.end();
    });
    t.test('MapLoadEvent', (t) => {
        let event;
        let turnstileEvent;
        const skuToken = '1234567890123';
        t.beforeEach(() => {
            window.useFakeXMLHttpRequest();
            event = new mapbox.MapLoadEvent();
            turnstileEvent = new mapbox.TurnstileEvent();
        });

        t.afterEach(() => {
            window.restore();
        });

        t.test('mapbox.postMapLoadEvent', (t) => {
            t.ok(mapbox.postMapLoadEvent);
            t.end();
        });

        t.test('contains all payload including skuId and skuToken', (t) => {
            event.postMapLoadEvent(1, skuToken);
            const reqBody = window.server.requests[0].requestBody;
            // reqBody is a string of an array containing the event object so pick out the stringified event object and convert to an object
            const mapLoadEvent = JSON.parse(reqBody.slice(1, reqBody.length - 1));
            t.equals(mapLoadEvent.event, 'map.load');
            t.equals(mapLoadEvent.skuId, SKU_ID);
            t.equals(mapLoadEvent.skuToken, skuToken);
            t.equals(mapLoadEvent.sdkIdentifier, 'mapbox-gl-js');
            t.equals(mapLoadEvent.sdkVersion, version);
            t.true(!!mapLoadEvent.userId);
            t.true(!!mapLoadEvent.created);
            t.end();
        });

        t.test('does not POST when mapboxgl.ACCESS_TOKEN is not set', (t) => {
            config.ACCESS_TOKEN = null;

            event.postMapLoadEvent(1, skuToken, null, () => {});
            t.equal(window.server.requests.length, 0);
            t.end();
        });

        t.test('POSTs cn event when API_URL changes to cn endpoint', (t) => {
            config.API_URL = 'https://api.mapbox.cn';

            event.postMapLoadEvent(1, skuToken);

            const req = window.server.requests[0];
            req.respond(200);

            t.true(req.url.indexOf('https://events.mapbox.cn') > -1);
            t.end();
        });

        t.test('POSTs no event when API_URL unavailable', (t) => {
            config.API_URL = null;
            event.postMapLoadEvent(1, skuToken);
            t.equal(window.server.requests.length, 0, 'no events posted');
            t.end();
        });

        t.test('POSTs no event when API_URL is non-standard', (t) => {
            config.API_URL = "https://api.example.com";
            event.postMapLoadEvent(1, skuToken);
            t.equal(window.server.requests.length, 0, 'no events posted');
            t.end();
        });

        t.test('with LocalStorage available', (t) => {
            let prevLocalStorage;
            t.beforeEach(() => {
                prevLocalStorage = window.localStorage;
                window.localStorage = {
                    data: {},
                    setItem (id, val) {
                        this.data[id] = String(val);
                    },
                    getItem (id) {
                        return this.data.hasOwnProperty(id) ? this.data[id] : undefined;
                    },
                    removeItem (id) {
                        if (this.hasOwnProperty(id)) delete this[id];
                    }
                };
            });

            t.afterEach(() => {
                window.localStorage = prevLocalStorage;
            });

            t.test('generates new uuid when previously stored anonId is not a valid uuid', (t) => {
                window.localStorage.setItem(`mapbox.eventData.uuid:${config.ACCESS_TOKEN}`, JSON.stringify({
                    anonId: 'anonymous'
                }));

                event.postMapLoadEvent(1, skuToken);
                const req = window.server.requests[0];
                req.respond(200);

                const reqBody = JSON.parse(req.requestBody)[0];
                t.notEqual(reqBody.userId, 'anonymous');
                t.end();
            });

            t.test('does not POST map.load event second time within same calendar day', (t) => {
                let now = +Date.now();
                withFixedDate(t, now, () => event.postMapLoadEvent(1, skuToken));

                //Post second event
                const firstEvent = now;
                now += (60 * 1000); // A bit later
                withFixedDate(t, now, () => event.postMapLoadEvent(1, skuToken));

                const req = window.server.requests[0];
                req.respond(200);

                t.equal(window.server.requests.length, 1);

                const reqBody = JSON.parse(req.requestBody)[0];
                equalWithPrecision(t, new Date(reqBody.created).valueOf(), firstEvent, 100);

                t.end();
            });

            t.test('does not POST map.load event second time when clock goes backwards less than a day', (t) => {
                let now = +Date.now();
                withFixedDate(t, now, () => event.postMapLoadEvent(1, skuToken));

                //Post second event
                const firstEvent = now;
                now -= (60 * 1000); // A bit earlier
                withFixedDate(t, now, () => event.postMapLoadEvent(1, skuToken));

                const req = window.server.requests[0];
                req.respond(200);

                t.equal(window.server.requests.length, 1);

                const reqBody = JSON.parse(req.requestBody)[0];
                equalWithPrecision(t, new Date(reqBody.created).valueOf(), firstEvent, 100);

                t.end();
            });

            t.test('POSTs map.load event when access token changes', (t) => {
                config.ACCESS_TOKEN = 'pk.new.*';

                event.postMapLoadEvent(1, skuToken);

                const req = window.server.requests[0];
                req.respond(200);

                t.equal(req.url, `${config.EVENTS_URL}?access_token=pk.new.*`);

                t.end();
            });

            t.test('uses the same uuid as TurnstileEvent', (t) => {
                const anonId = uuid();
                window.localStorage.setItem(`mapbox.eventData.uuid:${config.ACCESS_TOKEN}`, anonId);
                turnstileEvent.postTurnstileEvent(mapboxTileURLs);
                event.postMapLoadEvent(1, skuToken);

                const turnstileReq = window.server.requests[0];
                turnstileReq.respond(200);
                const mapLoadReq = window.server.requests[1];
                mapLoadReq.respond(200);
                const turnstileBody = JSON.parse(turnstileReq.requestBody)[0];
                const loadBody = JSON.parse(mapLoadReq.requestBody)[0];

                t.equal(turnstileBody.userId, loadBody.userId);
                t.equal(turnstileBody.userId, anonId);
                const turnstileEventData = JSON.parse(window.localStorage.getItem(`mapbox.eventData:${config.ACCESS_TOKEN}`));
                t.ok(turnstileEventData.lastSuccess);
                t.end();
            });

            t.end();
        });

        t.test('when LocalStorage is not available', (t) => {
            t.test('POSTs map.load event', (t) => {
                event.postMapLoadEvent(1, skuToken);

                const req = window.server.requests[0];
                req.respond(200);

                const reqBody = JSON.parse(req.requestBody)[0];
                t.equal(req.url, `${config.EVENTS_URL}?access_token=key`);
                t.equal(req.method, 'POST');
                t.equal(reqBody.event, 'map.load');
                t.equal(reqBody.sdkVersion, version);
                t.ok(reqBody.userId);

                t.end();
            });

            t.test('does not POST map.load multiple times for the same map instance', (t) => {
                const now = Date.now();
                withFixedDate(t, now, () => event.postMapLoadEvent(1, skuToken));
                withFixedDate(t, now + 5, () => event.postMapLoadEvent(1, skuToken));

                const req = window.server.requests[0];
                req.respond(200);

                t.equal(window.server.requests.length, 1);

                const reqBody = JSON.parse(req.requestBody)[0];
                equalWithPrecision(t, new Date(reqBody.created).valueOf(), now, 100);

                t.end();
            });

            t.test('POSTs map.load event when access token changes', (t) => {
                config.ACCESS_TOKEN = 'pk.new.*';

                event.postMapLoadEvent(1, skuToken);

                const req = window.server.requests[0];
                req.respond(200);

                const reqBody = JSON.parse(req.requestBody)[0];
                t.equal(req.url, `${config.EVENTS_URL}?access_token=pk.new.*`);
                t.equal(req.method, 'POST');
                t.equal(reqBody.event, 'map.load');
                t.equal(reqBody.sdkVersion, version);
                t.ok(reqBody.userId);

                t.end();
            });

            t.test('POSTs distinct map.load for multiple maps', (t) => {
                event.postMapLoadEvent(1, skuToken);
                const now = +Date.now();
                withFixedDate(t, now, () => event.postMapLoadEvent(2, skuToken));

                let req = window.server.requests[0];
                req.respond(200);

                req = window.server.requests[1];
                req.respond(200);
                const reqBody = JSON.parse(req.requestBody)[0];
                t.equal(req.url, `${config.EVENTS_URL}?access_token=key`);
                t.equal(req.method, 'POST');
                t.equal(reqBody.event, 'map.load');
                t.equal(reqBody.sdkVersion, version);
                t.ok(reqBody.userId);
                equalWithPrecision(t, new Date(reqBody.created).valueOf(), now, 100);

                t.end();
            });

            t.test('Queues and POSTs map.load events when triggerred in quick succession by different maps', (t) => {
                const now = Date.now();
                withFixedDate(t, now, () => event.postMapLoadEvent(1, skuToken));
                withFixedDate(t, now, () => event.postMapLoadEvent(2, skuToken));
                withFixedDate(t, now, () => event.postMapLoadEvent(3, skuToken));

                const reqOne = window.server.requests[0];
                reqOne.respond(200);
                let reqBody = JSON.parse(reqOne.requestBody)[0];
                equalWithPrecision(t, new Date(reqBody.created).valueOf(), now, 100);

                const reqTwo = window.server.requests[1];
                reqTwo.respond(200);
                reqBody = JSON.parse(reqTwo.requestBody)[0];
                equalWithPrecision(t, new Date(reqBody.created).valueOf(), now, 100);

                const reqThree = window.server.requests[2];
                reqThree.respond(200);
                reqBody = JSON.parse(reqThree.requestBody)[0];
                equalWithPrecision(t, new Date(reqBody.created).valueOf(), now, 100);

                t.end();
            });

            t.end();
        });

        t.end();
    });

    t.test('MapSessionAPI', (t) => {
        let sessionAPI;
        const skuToken = '1234567890123';
        t.beforeEach(() => {
            window.useFakeXMLHttpRequest();
            sessionAPI = new mapbox.MapSessionAPI();
        });

        t.afterEach(() => {
            window.restore();
        });

        t.test('mapbox.getMapSessionAPI', (t) => {
            t.ok(mapbox.getMapSessionAPI);
            t.end();
        });

        t.test('contains access token and skuToken', (t) => {
            sessionAPI.getSession(1, skuToken);
            const requestURL = new URL(window.server.requests[0].url);
            const urlParam = new URLSearchParams(requestURL.search);
            t.equals(urlParam.get('sku'), skuToken);
            t.equals(urlParam.get('access_token'), config.ACCESS_TOKEN);
            t.end();
        });

        t.test('no API is sent when API_URL unavailable', (t) => {
            config.API_URL = null;
            sessionAPI.getSession(1, skuToken);
            t.equal(window.server.requests.length, 0, 'no request');

            t.end();
        });

        t.test('send a new request when access token changes', (t) => {
            config.ACCESS_TOKEN = 'pk.new.*';
            sessionAPI.getSession(1, skuToken);

            const req = window.server.requests[0];
            t.equal(req.url, `${config.API_URL + config.SESSION_PATH}?sku=${skuToken}&access_token=pk.new.*`);
            t.equal(req.method, 'GET');

            t.end();
        });

        t.end();
    });

    t.end();
});
