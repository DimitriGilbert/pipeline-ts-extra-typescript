import { Container, Pipeline } from "pipeline-ts";
import { tsInstall, tsInit, tsSetConfig, tsProject, tsProjectStages } from ".";

export const typescriptContainer = new Container()
typescriptContainer
  .set("install", tsInstall)
  .set("init", tsInit)
  // .set("setConfigPipeline", tsSetConfigPipeline)
  .set("setConfig", tsSetConfig)
  // .set("projectPipeline", tsProjectPipeline)
  .set("project", tsProject, {
    factory: () => {
      return new Pipeline(tsProjectStages(), undefined, "tsProject")
    }
  })