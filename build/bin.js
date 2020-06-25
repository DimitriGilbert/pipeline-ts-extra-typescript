"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Container_1 = require("./Container");
var pipeline_ts_1 = require("pipeline-ts");
var CoreContainer_1 = require("pipeline-ts/build/CoreContainer");
CoreContainer_1.CoreContainer.set('typescript', Container_1.typescriptContainer);
var cli = new pipeline_ts_1.Command(CoreContainer_1.CoreContainer);
cli.parseArgs(process.argv);
// console.log(CoreContainer.get("typescript").container?.get('project'))
cli.process().then(function (res) {
}).catch(function (err) {
    console.log(err);
});
