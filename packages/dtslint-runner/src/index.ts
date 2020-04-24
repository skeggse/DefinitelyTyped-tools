import os from "os";
import yargs from "yargs";
import { RunDTSLintOptions } from "./types";
import { runDTSLint } from "./main";
import { assertDefined, logUncaughtErrors } from "@definitelytyped/utils";

export { runDTSLint, RunDTSLintOptions };

if (!module.parent) {
  const args = yargs.options({
    clone: {
      group: "DefinitelyTyped acquisition",
      description: "Clone DefinitelyTyped before running. Can be used as a boolean flag or set to the SHA to clone.",
      conflicts: "path"
    },
    path: {
      group: "DefinitelyTyped acquisition",
      description: "Path to local DefinitelyTyped clone.",
      conflicts: "clone",
      type: "string"
    },
    selection: {
      group: "Package selection",
      description: "Which packages to test.",
      type: "string",
      choices: ["all", "affected"]
    },
    nProcesses: {
      group: "Parallelism",
      description: "How many processes to distribute parallelizable tasks over.",
      type: "number"
    },
    shardId: {
      group: "Parallelism",
      description: "The machine index when sharding a run over multiple machines.",
      type: "number",
      implies: "shardCount"
    },
    shardCount: {
      group: "Parallelism",
      description: "The total number of machines when sharding a run over multiple machines.",
      type: "number",
      implies: "shardId"
    },
    localTypeScriptPath: {
      group: "dtslint options",
      description:
        "Path to local TypeScript installation to be used by dtslint instead of all supported TypeScript versions.",
      type: "string",
      conflicts: "onlyTestTsNext"
    },
    onlyTestTsNext: {
      group: "dtslint options",
      description: "Run dtslint only with typescript@next instead of all supported TypeScript versions.",
      type: "boolean",
      conflicts: "localTypeScriptPath"
    },
    expectOnly: {
      group: "dtslint options",
      description: "Run only the ExpectType lint rule.",
      type: "boolean"
    },
    // Not sure why you’d use this, so I’m hiding it
    noInstall: {
      hidden: true,
      type: "boolean"
    }
  }).argv;

  const options: RunDTSLintOptions = {
    definitelyTypedAcquisition: args.clone
      ? {
          kind: "clone",
          sha: typeof args.clone === "string" ? args.clone : undefined
        }
      : {
          kind: "local",
          path: assertDefined(args.path)
        },
    onlyRunAffectedPackages: args.selection === "affected",
    nProcesses: args.nProcesses ?? os.cpus().length,
    shard: args.shardCount ? { id: assertDefined(args.shardId), count: args.shardCount } : undefined,
    localTypeScriptPath: args.localTypeScriptPath,
    onlyTestTsNext: args.onlyTestTsNext ?? false,
    expectOnly: args.expectOnly ?? false,
    noInstall: args.noInstall ?? false
  };

  logUncaughtErrors(async () => {
    const failures = await runDTSLint(options);
    process.exit(failures);
  });
}
