/// <reference types="node" />
import { Payload, ParentPipelineInterface, Payloadable, Fs } from "pipeline-ts";
export declare function npmCommand(payload: Payloadable, pipeline?: ParentPipelineInterface, index?: number): Promise<Payload>;
export declare const npmSetConfigStages: () => (import("pipeline-ts").Stage | ((pl: SetConfigPayload, ppl: ParentPipelineInterface, i: number) => ({
    config: {
        [key: string]: string | number | boolean | string[] | number[];
    };
} & {
    sanitizeTo?: ((data: string | Buffer) => string | Buffer) | undefined;
    data: string | Buffer;
} & {
    to: string;
    force?: boolean | undefined;
    bak?: string | boolean | undefined;
} & {
    path: string;
} & Payloadable & {
    data: string;
}) | undefined))[];
export declare function npmSetConfig(payload: Payloadable, pipeline?: ParentPipelineInterface, index?: number): Promise<Payload>;
export declare function npmInit(payload: Payloadable, pipeline?: ParentPipelineInterface, index?: number): Promise<Payload>;
export declare const npmInstallStages: () => import("pipeline-ts").Stage[];
export declare function npmInstall(payload: Payloadable, pipeline?: ParentPipelineInterface, index?: number): Promise<Payload>;
export declare const tsInstallStages: import("pipeline-ts").Stage[];
export declare function tsInstall(payload: Payloadable, pipeline?: ParentPipelineInterface, index?: number): Promise<Payload>;
export declare function tsc(payload: Payloadable, pipeline?: ParentPipelineInterface, index?: number): Promise<Payload>;
export declare const tsInitStages: import("pipeline-ts").Stage[];
export declare function tsInit(payload: Payloadable, pipeline?: ParentPipelineInterface, index?: number): Promise<Payload>;
export declare type SetConfigPayload = {
    config: {
        [key: string]: string | boolean | number | Array<string> | Array<number>;
    };
} & Fs.writePayload;
export declare const tsSetConfigStages: (import("pipeline-ts").Stage | typeof Fs.WriteFile | ((pl: SetConfigPayload, ppl: ParentPipelineInterface, i: number) => ({
    config: {
        [key: string]: string | number | boolean | string[] | number[];
    };
} & {
    sanitizeTo?: ((data: string | Buffer) => string | Buffer) | undefined;
    data: string | Buffer;
} & {
    to: string;
    force?: boolean | undefined;
    bak?: string | boolean | undefined;
} & {
    path: string;
} & Payloadable & {
    data: string;
}) | undefined))[];
export declare function tsSetConfig(payload: Payloadable, pipeline?: ParentPipelineInterface, index?: number): Promise<Payload>;
export declare const tsJestStages: import("pipeline-ts").Stage[];
export declare function tsInstallJest(payload: Payloadable, pipeline?: ParentPipelineInterface, index?: number): Promise<Payload>;
export declare const tsProjectStages: () => (import("pipeline-ts").Stage | typeof tsInstall)[];
export declare function tsProject(payload: Payloadable, pipeline?: ParentPipelineInterface, index?: number): Promise<Payload>;
