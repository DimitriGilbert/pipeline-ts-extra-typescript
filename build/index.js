"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tsProject = exports.tsProjectStages = exports.tsInstallJest = exports.tsJestStages = exports.tsSetConfig = exports.tsSetConfigStages = exports.tsInit = exports.tsInitStages = exports.tsc = exports.tsInstall = exports.tsInstallStages = exports.npmInstall = exports.npmInstallStages = exports.npmInit = exports.npmSetConfig = exports.npmSetConfigStages = exports.npmCommand = void 0;
var fs = __importStar(require("fs"));
var child_process_promise_1 = require("child-process-promise");
var deepmerge_1 = __importDefault(require("deepmerge"));
var pipeline_ts_1 = require("pipeline-ts");
var is_directory_1 = __importDefault(require("is-directory"));
function npmCommand(payload, pipeline, index) {
    return new Promise(function (resolve, reject) {
        var _a, _b;
        var options = {};
        if (payload.dir) {
            options.cwd = payload.dir;
        }
        var cmd = child_process_promise_1.spawn('npm', payload.command, options);
        (_a = cmd.childProcess.stdout) === null || _a === void 0 ? void 0 : _a.on('data', function (data) {
            pipeline === null || pipeline === void 0 ? void 0 : pipeline.log(index ? index : 0, {
                message: data.toString(),
                level: "v"
            });
        });
        (_b = cmd.childProcess.stderr) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
            var errStr = data.toString();
            if (errStr.match('error')) {
                pipeline === null || pipeline === void 0 ? void 0 : pipeline.error(index, 'npm cli error on command: ' + payload.command.join(' '), data);
            }
            else {
                pipeline === null || pipeline === void 0 ? void 0 : pipeline.log(index ? index : 0, {
                    message: errStr,
                    level: "v"
                });
            }
        });
        cmd.then(function (res) {
            resolve(payload);
        }).catch(function (err) {
            reject(err);
        });
    });
}
exports.npmCommand = npmCommand;
exports.npmSetConfigStages = function () {
    return [
        // @ts-ignore
        pipeline_ts_1.MakeStage(pipeline_ts_1.Fs.ReadFile, "readPackageJson", undefined, {
            in: function (pl) {
                var pDir = pl.dir ? pl.dir : ".";
                return {
                    path: pDir + "/package.json"
                };
            },
            out: function (nPl, oPl) {
                return Object.assign(oPl, {
                    data: nPl.data
                });
            }
        }),
        function (pl, ppl, i) {
            try {
                var oldConf = JSON.parse(pl.data.toString());
                // for (const confName in pl.config) {
                //   if (pl.config.hasOwnProperty(confName)) {
                //     conf[confName] = pl.config[confName]
                //   }
                // }
                return Object.assign(pl, {
                    data: JSON.stringify(deepmerge_1.default(oldConf, pl.config), null, 2)
                });
            }
            catch (err) {
                ppl.error(i, "TS set config error", err);
            }
        },
        // @ts-ignore
        pipeline_ts_1.MakeStage(pipeline_ts_1.Fs.WriteFile, "writePackageJson", undefined, {
            in: function (pl) {
                var pDir = pl.dir ? pl.dir : "";
                if (pl.name) {
                    pDir += pl.name;
                }
                return {
                    to: pDir + "/package.json",
                    data: pl.data
                };
            },
            out: function (nPl, oPl) {
                return Object.assign(oPl, {
                    data: nPl.data
                });
            }
        })
    ];
};
function npmSetConfig(payload, pipeline, index) {
    // @ts-ignore
    var p = new pipeline_ts_1.Pipeline(exports.npmSetConfigStages(), undefined, "npmSetConfig");
    return p.asExecutor(payload, pipeline, index);
}
exports.npmSetConfig = npmSetConfig;
function npmInit(payload, pipeline, index) {
    var cmd = [
        'init',
        '-y'
    ];
    var pDir = payload.dir ? payload.dir : "";
    if (payload.name) {
        pDir += payload.name;
    }
    return npmCommand({
        dir: pDir,
        command: cmd
    });
}
exports.npmInit = npmInit;
exports.npmInstallStages = function () {
    return [
        pipeline_ts_1.MakeStage(npmInit, 'npmInit', function (pl) {
            var pDir = pl.dir ? pl.dir : "";
            if (pl.name) {
                pDir += pl.name;
            }
            if (!fs.existsSync(pDir + "/package.json")) {
                return true;
            }
            return false;
        }, {
            out: function (nPl, oPl) {
                return oPl;
            }
        }),
        pipeline_ts_1.MakeStage(npmCommand, 'npmInstall', undefined, {
            in: function (pl) {
                var pDir = pl.dir ? pl.dir : "";
                if (pl.name) {
                    pDir += pl.name;
                }
                var cmd = [
                    "i"
                ];
                if (!pl.noSave) {
                    cmd.push('--save');
                    if (pl.dev) {
                        cmd[1] = cmd[1] + "-dev";
                    }
                }
                return {
                    dir: pDir,
                    command: cmd.concat(pl.dependencies)
                };
            },
            out: function (nPl, oPl) {
                return oPl;
            }
        })
    ];
};
function npmInstall(payload, pipeline, index) {
    var p = new pipeline_ts_1.Pipeline(exports.npmInstallStages(), undefined, "npmInstall");
    return p.asExecutor(payload, pipeline, index);
}
exports.npmInstall = npmInstall;
exports.tsInstallStages = [
    pipeline_ts_1.MakeStage(npmInit, 'npmInit', function (pl) {
        var pDir = pl.dir ? pl.dir : "";
        if (pl.name) {
            pDir += pl.name;
        }
        if (!fs.existsSync(pDir + "/package.json")) {
            return true;
        }
        return false;
    }, {
        out: function (nPl, oPl) {
            return oPl;
        }
    }),
    pipeline_ts_1.MakeStage(npmInstall, 'tsInstall', function (pl) {
        var pDir = pl.dir ? pl.dir : "";
        if (pl.name) {
            pDir += pl.name;
        }
        if (!fs.existsSync(pDir + "/node_modules/typescript")) {
            return true;
        }
        return false;
    }, {
        in: function (pl) {
            var pDir = pl.dir ? pl.dir : "";
            if (pl.name) {
                pDir += pl.name;
            }
            return {
                dir: pDir,
                dependencies: [
                    "typescript"
                ]
            };
        },
        out: function (nPl, oPl) {
            return oPl;
        }
    })
];
function tsInstall(payload, pipeline, index) {
    var p = new pipeline_ts_1.Pipeline(exports.tsInstallStages, undefined, "tsInstall");
    return p.asExecutor(payload, pipeline, index);
}
exports.tsInstall = tsInstall;
function tsc(payload, pipeline, index) {
    return new Promise(function (resolve, reject) {
        var _a, _b;
        var options = {};
        if (payload.dir) {
            options.cwd = payload.dir;
        }
        var cmd = child_process_promise_1.spawn('node_modules/.bin/tsc', payload.command, options);
        (_a = cmd.childProcess.stdout) === null || _a === void 0 ? void 0 : _a.on('data', function (data) {
            pipeline === null || pipeline === void 0 ? void 0 : pipeline.log(index ? index : 0, {
                message: data,
                level: "v"
            });
        });
        (_b = cmd.childProcess.stderr) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
            pipeline === null || pipeline === void 0 ? void 0 : pipeline.error(index, 'tsc error', data);
        });
        cmd.then(function (res) {
            resolve(payload);
        }).catch(function (err) {
            reject(err);
        });
    });
}
exports.tsc = tsc;
exports.tsInitStages = [
    pipeline_ts_1.MakeStage(tsc, 'tscInit', function (pl) {
        var pDir = pl.dir ? pl.dir : "";
        if (pl.name) {
            pDir += pl.name;
        }
        if (!fs.existsSync(pDir + "/tsconfig.json")) {
            return true;
        }
        return false;
    }, {
        in: function (pl) {
            var pDir = pl.dir ? pl.dir : "";
            if (pl.name) {
                pDir += pl.name;
            }
            return {
                dir: pDir,
                command: [
                    "--init"
                ]
            };
        },
        out: function (nPl, oPl) {
            return oPl;
        }
    }),
    pipeline_ts_1.MakeStage(
    // @ts-ignore
    pipeline_ts_1.Fs.MkDir, 'mkSrc', function (pl) {
        var pDir = pl.dir ? pl.dir : "";
        if (pl.name) {
            pDir += pl.name;
        }
        if (!fs.existsSync(pDir + "/src")) {
            return true;
        }
        return false;
    }, {
        in: function (pl) {
            var pDir = pl.dir ? pl.dir : "";
            if (pl.name) {
                pDir += pl.name;
            }
            return {
                path: pDir + "/src"
            };
        },
        out: function (nPl, oPl) {
            return oPl;
        }
    }),
    pipeline_ts_1.MakeStage(
    // @ts-ignore
    pipeline_ts_1.Fs.Copy, 'createIndex', function (pl) {
        var pDir = pl.dir ? pl.dir : "";
        if (pl.name) {
            pDir += pl.name;
        }
        if (!fs.existsSync(pDir + "/src/index.ts")) {
            return true;
        }
        return false;
    }, {
        in: function (pl) {
            var pDir = pl.dir ? pl.dir : "";
            if (pl.name) {
                pDir += pl.name;
            }
            return {
                path: __dirname + "/../templates/index.ts",
                to: pDir + "/src/index.ts"
            };
        },
        out: function (nPl, oPl) {
            return oPl;
        }
    }),
    // @ts-ignore
    (new pipeline_ts_1.Pipeline(exports.npmSetConfigStages())).asStage(undefined, {
        in: function (pl) {
            var pDir = pl.dir ? pl.dir : "./";
            if (pl.name) {
                pDir += pl.name;
            }
            return {
                dir: pDir,
                config: {
                    scripts: {
                        build: "tsc"
                    }
                }
            };
        },
        out: function (nPl, oPl) {
            return oPl;
        }
    })
];
function tsInit(payload, pipeline, index) {
    var p = new pipeline_ts_1.Pipeline(exports.tsInitStages, undefined, "tsInit");
    return p.asExecutor(payload, pipeline, index);
}
exports.tsInit = tsInit;
exports.tsSetConfigStages = [
    // @ts-ignore
    pipeline_ts_1.MakeStage(pipeline_ts_1.Fs.ReadFile, "readTsConfig", undefined, {
        in: function (pl) {
            var pDir = pl.dir ? pl.dir : "";
            if (pl.name) {
                pDir += pl.name;
            }
            return {
                path: pDir + "/tsconfig.json"
            };
        },
        out: function (nPl, oPl) {
            return Object.assign(oPl, {
                data: nPl.data
            });
        }
    }),
    function (pl, ppl, i) {
        try {
            var conf = JSON.parse(pl.data.toString());
            for (var confName in pl.config) {
                if (pl.config.hasOwnProperty(confName)) {
                    // conf[confName] = pl.config[confName]
                    conf[confName] = Object.assign(conf[confName], pl.config[confName]);
                }
            }
            return Object.assign(pl, { data: JSON.stringify(conf) });
        }
        catch (err) {
            ppl.error(i, "TS set config error", err);
        }
    },
    pipeline_ts_1.Fs.WriteFile
];
function tsSetConfig(payload, pipeline, index) {
    // @ts-ignore
    var p = new pipeline_ts_1.Pipeline(exports.tsSetConfigStages, undefined, "tsSetConfig");
    return p.asExecutor(payload, pipeline, index);
}
exports.tsSetConfig = tsSetConfig;
exports.tsJestStages = [
    // create test directory
    pipeline_ts_1.MakeStage(
    // @ts-ignore
    pipeline_ts_1.Fs.MkDir, "mkTestDir", 
    // only if directory does not exists
    function (pl) {
        var pDir = pl.dir ? pl.dir : "";
        if (pl.name) {
            pDir += pl.name;
        }
        if (!is_directory_1.default.sync(pDir + "/tests")) {
            return true;
        }
        return false;
    }, {
        in: function (pl) {
            var pDir = pl.dir ? pl.dir : "./";
            if (pl.name) {
                pDir += pl.name;
            }
            var load = {
                path: pDir + "/tests"
            };
            return load;
        },
        out: function (nPl, oPl) {
            return oPl;
        }
    }),
    // install jest
    pipeline_ts_1.MakeStage(npmInstall, "installJest", 
    // only if directory does not exists
    function (pl) {
        var pDir = pl.dir ? pl.dir : "";
        if (pl.name) {
            pDir += pl.name;
        }
        if (!is_directory_1.default.sync(pDir + "/node_modules/.bin/jest")) {
            return true;
        }
        return false;
    }, {
        in: function (pl) {
            var pDir = pl.dir ? pl.dir : "./";
            if (pl.name) {
                pDir += pl.name;
            }
            return {
                dir: pDir,
                dependencies: [
                    "jest",
                    "ts-jest",
                    "@types/jest"
                ],
                dev: true
            };
        },
        out: function (nPl, oPl) {
            return oPl;
        }
    }),
    // update package.json
    // @ts-ignore
    (new pipeline_ts_1.Pipeline(exports.npmSetConfigStages(), undefined, 'jestUpdatePackageJson')).asStage(undefined, {
        in: function (pl) {
            var pDir = pl.dir ? pl.dir : "./";
            if (pl.name) {
                pDir += pl.name;
            }
            return {
                dir: pDir,
                config: {
                    scripts: {
                        test: "jest",
                        coverage: "jest --coverage"
                    }
                }
            };
        },
        out: function (nPl, oPl) {
            return oPl;
        }
    })
];
function tsInstallJest(payload, pipeline, index) {
    var p = new pipeline_ts_1.Pipeline(exports.tsJestStages, undefined, "tsInstallJest");
    return p.asExecutor(payload, pipeline, index);
}
exports.tsInstallJest = tsInstallJest;
exports.tsProjectStages = function () {
    return [
        // create directory
        pipeline_ts_1.MakeStage(
        // @ts-ignore
        pipeline_ts_1.Fs.MkDir, "mkDir", 
        // only if directory does not exists
        function (pl) {
            var pDir = pl.dir ? pl.dir : "";
            if (pl.name) {
                pDir += pl.name;
            }
            if (!is_directory_1.default.sync(pDir)) {
                return true;
            }
            return false;
        }, 
        // filter payload for Fs.MkDir
        {
            in: function (pl) {
                var pDir = pl.dir ? pl.dir : "./";
                if (pl.name) {
                    pDir += pl.name;
                }
                var load = {
                    path: pDir
                };
                return load;
            },
            out: function (nPl, oPl) {
                return oPl;
            }
        }),
        tsInstall,
        tsInit,
        (new pipeline_ts_1.Pipeline(exports.tsJestStages, undefined, "tsInstallJest")).asStage(function (pl) {
            if (pl.jest) {
                return true;
            }
            return false;
        }),
        // @ts-ignore
        (new pipeline_ts_1.Pipeline(exports.tsSetConfigStages, undefined, "tsSetConfig")).asStage(
        // if payload contains config instructions
        function (pl) {
            if (pl.config) {
                return true;
            }
            return false;
        }),
    ];
};
function tsProject(payload, pipeline, index) {
    var p = new pipeline_ts_1.Pipeline(exports.tsProjectStages(), undefined, "tsProject");
    return p.asExecutor(payload, pipeline, index);
}
exports.tsProject = tsProject;
