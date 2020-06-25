import * as fs from "fs";
import { spawn } from "child-process-promise";
import { SpawnOptions } from "child_process";
import deepmerge from "deepmerge";
import { Payload, ParentPipelineInterface, Payloadable, Pipeline, Fs, PipelineOptions, MakeStage, Pipeable} from "pipeline-ts";
import IsDirectory from "is-directory";

export function npmCommand (payload: Payloadable, pipeline?: ParentPipelineInterface, index?: number): Promise<Payload> {
  return new Promise((resolve, reject) => {
    let options: SpawnOptions = {}
    if (payload.dir) {
      options.cwd = payload.dir
    }
    let cmd = spawn('npm', payload.command, options)
  
    cmd.childProcess.stdout?.on('data', (data) => {
      pipeline?.log(index?index:0, {
        message: data.toString(),
        level: "v"
      })
    })
    cmd.childProcess.stderr?.on('data', (data) => {
      let errStr = data.toString()
      if (errStr.match('error')) {
        pipeline?.error(index, 'npm cli error on command: '+payload.command.join(' '), data)
      }
      else {
        pipeline?.log(index?index:0, {
          message: errStr,
          level: "v"
        })
      }
    })
  
    cmd.then((res) => {
      resolve(payload)
    }).catch((err) => {
      reject(err)
    })
  })
}

export const npmSetConfigStages = () => {
  return [
    // @ts-ignore
    MakeStage(Fs.ReadFile, "readPackageJson", undefined, {
      in: (pl) => {
        let pDir = pl.dir?pl.dir:"."
        return {
          path:pDir+"/package.json"
        }
      },
      out: (nPl, oPl) => {
        return Object.assign(oPl, {
          data: nPl.data
        })
      }
    }),
    (pl: SetConfigPayload, ppl:ParentPipelineInterface, i:number) => {
      try {
        let oldConf = JSON.parse(pl.data.toString())
        // for (const confName in pl.config) {
        //   if (pl.config.hasOwnProperty(confName)) {
        //     conf[confName] = pl.config[confName]
        //   }
        // }
        return Object.assign(pl, {
          data: JSON.stringify(
            deepmerge(oldConf, pl.config),
            null,
            2
          )
        })
      } catch (err) {
        ppl.error(i, "TS set config error", err)
      }
    },
    // @ts-ignore
    MakeStage(Fs.WriteFile, "writePackageJson", undefined, {
      in: (pl) => {
        let pDir = pl.dir?pl.dir:""
        if (pl.name) {
          pDir += pl.name
        }
        return {
          to:pDir+"/package.json",
          data: pl.data
        }
      },
      out: (nPl, oPl) => {
        return Object.assign(oPl, {
          data: nPl.data
        })
      }
    })
  ]
}

export function npmSetConfig (payload: Payloadable, pipeline?: ParentPipelineInterface, index?: number): Promise<Payload> {
  // @ts-ignore
  let p = new Pipeline(npmSetConfigStages(), undefined, "npmSetConfig")
  return p.asExecutor(payload, pipeline, index)
}

export function npmInit (payload: Payloadable, pipeline?: ParentPipelineInterface, index?: number): Promise<Payload> {
  let cmd = [
    'init',
    '-y'
  ]
  let pDir = payload.dir?payload.dir:""
  if (payload.name) {
    pDir += payload.name
  }
  return npmCommand({
    dir:pDir,
    command: cmd
  })
}

export const npmInstallStages = () => {
  return [
    MakeStage(
      npmInit,
      'npmInit',
      (pl:Payloadable) => {
        let pDir = pl.dir?pl.dir:""
        if (pl.name) {
          pDir += pl.name
        }
        if (!fs.existsSync(pDir+"/package.json")) {
          return true
        }
        return false
      }, {
        out: (nPl, oPl) => {
          return oPl
        }
      }
    ),
    MakeStage(
      npmCommand,
      'npmInstall',
      undefined, {
        in: (pl) => {
          let pDir = pl.dir?pl.dir:""
          if (pl.name) {
            pDir += pl.name
          }
          let cmd = [
            "i"
          ]
          if (!pl.noSave) {
            cmd.push('--save')
            if (pl.dev) {
              cmd[1] = `${cmd[1]}-dev`
            }
          }
          return {
            dir: pDir,
            command: cmd.concat(pl.dependencies)
          }
        },
        out: (nPl, oPl) => {
          return oPl
        }
      }
    )
  ]
}

export function npmInstall (payload: Payloadable, pipeline?: ParentPipelineInterface, index?: number): Promise<Payload> {
  let p = new Pipeline(npmInstallStages(), undefined, "npmInstall")
  return p.asExecutor(payload, pipeline, index)
}

export const tsInstallStages = [
  MakeStage(
    npmInit,
    'npmInit',
    (pl:Payloadable) => {
      let pDir = pl.dir?pl.dir:""
      if (pl.name) {
        pDir += pl.name
      }
      if (!fs.existsSync(pDir+"/package.json")) {
        return true
      }
      return false
    }, {
      out: (nPl, oPl) => {
        return oPl
      }
    }
  ),
  MakeStage(
    npmInstall,
    'tsInstall',
    (pl:Payloadable) => {
      let pDir = pl.dir?pl.dir:""
      if (pl.name) {
        pDir += pl.name
      }
      if (!fs.existsSync(pDir+"/node_modules/typescript")) {
        return true
      }
      return false
    }, {
      in: (pl) => {
        let pDir = pl.dir?pl.dir:""
        if (pl.name) {
          pDir += pl.name
        }
        return {
          dir: pDir,
          dependencies: [
            "typescript"
          ]
        }
      },
      out: (nPl, oPl) => {
        return oPl
      }
    }
  )
]

export function tsInstall (payload: Payloadable, pipeline?: ParentPipelineInterface, index?: number): Promise<Payload> {
  let p = new Pipeline(tsInstallStages, undefined, "tsInstall")
  return p.asExecutor(payload, pipeline, index)
}

export function tsc (payload: Payloadable, pipeline?: ParentPipelineInterface, index?: number): Promise<Payload> {
  return new Promise((resolve, reject) => {
    let options: SpawnOptions = {}
    if (payload.dir) {
      options.cwd = payload.dir
    }
    let cmd = spawn('node_modules/.bin/tsc', payload.command, options)
  
    cmd.childProcess.stdout?.on('data', (data) => {
      pipeline?.log(index?index:0, {
        message: data,
        level: "v"
      })
    })
    cmd.childProcess.stderr?.on('data', (data) => {
      pipeline?.error(index, 'tsc error', data)
    })
  
    cmd.then((res) => {
      resolve(payload)
    }).catch((err) => {
      reject(err)
    })
  })
}

export const tsInitStages = [
  MakeStage(
    tsc,
    'tscInit',
    (pl: Payloadable) => {
      let pDir = pl.dir?pl.dir:""
      if (pl.name) {
        pDir += pl.name
      }
      if (!fs.existsSync(pDir+"/tsconfig.json")) {
        return true
      }
      return false
    },
    {
      in: (pl) => {
        let pDir = pl.dir?pl.dir:""
        if (pl.name) {
          pDir += pl.name
        }
        return {
          dir: pDir,
          command: [
            "--init"
          ]
        }
      },
      out: (nPl, oPl) => {
        return oPl
      }
    }
  ),
  MakeStage(
    // @ts-ignore
    Fs.MkDir,
    'mkSrc',
    (pl: Payloadable) => {
      let pDir = pl.dir?pl.dir:""
      if (pl.name) {
        pDir += pl.name
      }
      if (!fs.existsSync(pDir+"/src")) {
        return true
      }
      return false
    },
    {
      in: (pl) => {
        let pDir = pl.dir?pl.dir:""
        if (pl.name) {
          pDir += pl.name
        }
        return {
          path: pDir+"/src"
        }
      },
      out: (nPl, oPl) => {
        return oPl
      }
    }
  ),
  MakeStage(
    // @ts-ignore
    Fs.Copy,
    'createIndex',
    (pl: Payloadable) => {
      let pDir = pl.dir?pl.dir:""
      if (pl.name) {
        pDir += pl.name
      }
      if (!fs.existsSync(pDir+"/src/index.ts")) {
        return true
      }
      return false
    },
    {
      in: (pl) => {
        let pDir = pl.dir?pl.dir:""
        if (pl.name) {
          pDir += pl.name
        }
        return {
          path: __dirname+"/../templates/index.ts",
          to: pDir+"/src/index.ts"
        }
      },
      out: (nPl, oPl) => {
        return oPl
      }
    }
  ),
  // @ts-ignore
  (new Pipeline(npmSetConfigStages())).asStage(undefined, {
    in: (pl) => {
      let pDir = pl.dir?pl.dir:"./"
      if (pl.name) {
        pDir += pl.name
      }
      return {
        dir:pDir,
        config: {
          scripts: {
            build: "tsc"
          }
        }
      }
    },
    out: (nPl, oPl) => {
      return oPl
    }
  })
]

export function tsInit (payload: Payloadable, pipeline?: ParentPipelineInterface, index?: number): Promise<Payload> {
  let p = new Pipeline(tsInitStages, undefined, "tsInit")
  return p.asExecutor(payload, pipeline, index)
}

export type SetConfigPayload = {
  config: {
    [key: string]: string | boolean | number | Array<string> | Array<number>
  }
} & Fs.writePayload

export const tsSetConfigStages = [
  // @ts-ignore
  MakeStage(Fs.ReadFile, "readTsConfig", undefined, {
    in: (pl) => {
      let pDir = pl.dir?pl.dir:""
      if (pl.name) {
        pDir += pl.name
      }
      return {
        path:pDir+"/tsconfig.json"
      }
    },
    out: (nPl, oPl) => {
      return Object.assign(oPl, {
        data: nPl.data
      })
    }
  }),
  (pl: SetConfigPayload, ppl:ParentPipelineInterface, i:number) => {
    try {
      let conf = JSON.parse(pl.data.toString())
      for (const confName in pl.config) {
        if (pl.config.hasOwnProperty(confName)) {
          // conf[confName] = pl.config[confName]
          conf[confName] = Object.assign(conf[confName], pl.config[confName])
        }
      }
      return Object.assign(pl, {data: JSON.stringify(conf)})
    } catch (err) {
      ppl.error(i, "TS set config error", err)
    }
  },
  Fs.WriteFile
]

export function tsSetConfig (payload: Payloadable, pipeline?: ParentPipelineInterface, index?: number): Promise<Payload> {
  // @ts-ignore
  let p = new Pipeline(tsSetConfigStages, undefined, "tsSetConfig")
  return p.asExecutor(payload, pipeline, index)
}

export const tsJestStages = [
  // create test directory
  MakeStage(
    // @ts-ignore
    Fs.MkDir,
    "mkTestDir",
    // only if directory does not exists
    (pl: Payloadable) => {
      let pDir = pl.dir?pl.dir:""
      if (pl.name) {
        pDir += pl.name
      }
      if(!IsDirectory.sync(pDir+"/tests")) {
        return true
      }
      return false
    },
    {
      in: (pl) => {
        let pDir = pl.dir?pl.dir:"./"
        if (pl.name) {
          pDir += pl.name
        }
        let load = {
          path:pDir+"/tests"
        }
        return load
      },
      out: (nPl, oPl) => {
        return oPl
      }
    }
  ),
  // install jest
  MakeStage(
    npmInstall,
    "installJest",
    // only if directory does not exists
    (pl: Payloadable) => {
      let pDir = pl.dir?pl.dir:""
      if (pl.name) {
        pDir += pl.name
      }
      if(!IsDirectory.sync(pDir+"/node_modules/.bin/jest")) {
        return true
      }
      return false
    },
    {
      in: (pl) => {
        let pDir = pl.dir?pl.dir:"./"
        if (pl.name) {
          pDir += pl.name
        }
        return {
          dir:pDir,
          dependencies: [
            "jest",
            "ts-jest",
            "@types/jest"
          ],
          dev: true
        }
      },
      out: (nPl, oPl) => {
        return oPl
      }
    }
  ),
  // update package.json
  // @ts-ignore
  (new Pipeline(npmSetConfigStages(), undefined, 'jestUpdatePackageJson')).asStage(undefined, {
    in: (pl) => {
      let pDir = pl.dir?pl.dir:"./"
      if (pl.name) {
        pDir += pl.name
      }
      return {
        dir:pDir,
        config: {
          scripts: {
            test: "jest",
            coverage: "jest --coverage"
          }
        }
      }
    },
    out: (nPl, oPl) => {
      return oPl
    }
  })
]

export function tsInstallJest (payload: Payloadable, pipeline?: ParentPipelineInterface, index?: number): Promise<Payload> {
  let p = new Pipeline(tsJestStages, undefined, "tsInstallJest")
  return p.asExecutor(payload, pipeline, index)
}

export const tsProjectStages = () => {
  return [
    // create directory
    MakeStage(
      // @ts-ignore
      Fs.MkDir,
      "mkDir",
      // only if directory does not exists
      (pl: Payloadable) => {
        let pDir = pl.dir?pl.dir:""
        if (pl.name) {
          pDir += pl.name
        }
        if(!IsDirectory.sync(pDir)) {
          return true
        }
        return false
      },
      // filter payload for Fs.MkDir
      {
        in: (pl) => {
          let pDir = pl.dir?pl.dir:"./"
          if (pl.name) {
            pDir += pl.name
          }
          let load = {
            path:pDir
          }
          return load
        },
        out: (nPl, oPl) => {
          return oPl
        }
      }
    ),
    tsInstall,
    tsInit,
    (new Pipeline(tsJestStages, undefined, "tsInstallJest")).asStage(
      (pl: Payloadable) => {
        if (pl.jest) {
          return true
        }
        return false
      }
    ),
    // @ts-ignore
    (new Pipeline(tsSetConfigStages, undefined, "tsSetConfig")).asStage(
      // if payload contains config instructions
      (pl: Payloadable) => {
        if (pl.config) {
          return true
        }
        return false
      }
    ),
  ]
}

export function tsProject (payload: Payloadable, pipeline?: ParentPipelineInterface, index?: number): Promise<Payload> {
  let p = new Pipeline(tsProjectStages(), undefined, "tsProject")
  return p.asExecutor(payload, pipeline, index)
}