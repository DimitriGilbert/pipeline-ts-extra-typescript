"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typescriptContainer = void 0;
var pipeline_ts_1 = require("pipeline-ts");
var _1 = require(".");
exports.typescriptContainer = new pipeline_ts_1.Container();
exports.typescriptContainer
    .set("install", _1.tsInstall)
    .set("init", _1.tsInit)
    // .set("setConfigPipeline", tsSetConfigPipeline)
    .set("setConfig", _1.tsSetConfig)
    // .set("projectPipeline", tsProjectPipeline)
    .set("project", _1.tsProject, {
    factory: function () {
        return new pipeline_ts_1.Pipeline(_1.tsProjectStages(), undefined, "tsProject");
    }
});
