"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const maker_squirrel_1 = require("@electron-forge/maker-squirrel");
const maker_zip_1 = require("@electron-forge/maker-zip");
const maker_deb_1 = require("@electron-forge/maker-deb");
const maker_rpm_1 = require("@electron-forge/maker-rpm");
const plugin_auto_unpack_natives_1 = require("@electron-forge/plugin-auto-unpack-natives");
const plugin_webpack_1 = require("@electron-forge/plugin-webpack");
const webpack_main_config_1 = require("./webpack.main.config");
const webpack_renderer_config_1 = require("./webpack.renderer.config");
const config = {
    packagerConfig: {
        asar: true,
    },
    rebuildConfig: {},
    makers: [new maker_squirrel_1.MakerSquirrel({}), new maker_zip_1.MakerZIP({}, ['darwin']), new maker_rpm_1.MakerRpm({}), new maker_deb_1.MakerDeb({})],
    plugins: [
        new plugin_auto_unpack_natives_1.AutoUnpackNativesPlugin({}),
        new plugin_webpack_1.WebpackPlugin({
            mainConfig: webpack_main_config_1.mainConfig,
            renderer: {
                config: webpack_renderer_config_1.rendererConfig,
                entryPoints: [
                    {
                        html: './src/renderer/index.html',
                        js: './src/renderer/renderer.ts',
                        name: 'main_window',
                        preload: {
                            js: './src/main/preload.ts',
                        },
                    },
                ],
            },
        }),
    ],
};
exports.default = config;
//# sourceMappingURL=forge.config.js.map