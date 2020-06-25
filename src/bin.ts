import { typescriptContainer } from "./Container";
import { Command } from "pipeline-ts";
import { CoreContainer } from "pipeline-ts/build/CoreContainer";

CoreContainer.set('typescript', typescriptContainer)
let cli = new Command(CoreContainer)
cli.parseArgs(process.argv)
// console.log(CoreContainer.get("typescript").container?.get('project'))
cli.process().then((res) => {
}).catch(err => {
  console.log(err)
})