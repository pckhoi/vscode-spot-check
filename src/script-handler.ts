import { basename, dirname } from "node:path";
import { exec as unpromiseExec, ExecOptions } from "node:child_process";
import { promisify } from "node:util";

import * as vscode from "vscode";

const exec = promisify(unpromiseExec);

export default class ScriptHandler {
  scriptUri: vscode.Uri;
  pythonInterpreter: string;
  pythonPaths: string[];
  outputChannel: vscode.OutputChannel;
  cwd?: string;

  constructor(
    pythonInterpreter: string,
    pythonPaths: string[],
    scriptUri: vscode.Uri,
    outputChannel: vscode.OutputChannel,
    cwd?: string
  ) {
    this.scriptUri = scriptUri;
    this.pythonInterpreter = pythonInterpreter;
    this.pythonPaths = pythonPaths;
    this.outputChannel = outputChannel;
    this.cwd = cwd ? cwd : undefined;
  }

  public static async fromScriptUri(
    scriptUri: vscode.Uri,
    outputChannel: vscode.OutputChannel
  ) {
    const conf = vscode.workspace.getConfiguration("spot-check");
    const pythonInterpreter = conf.get("pythonInterpreterPath") as string;
    const pythonPaths = conf.get("pythonPaths") as string[];
    const cwd = conf.get<string>("cwd");
    const scriptBasename = basename(scriptUri.fsPath);
    const scriptDir = dirname(scriptUri.fsPath);
    const scriptStats = await vscode.workspace.fs.stat(scriptUri);
    if (!(scriptStats.type & vscode.FileType.File)) {
      throw new Error(
        `spot check script ${scriptBasename} does not exist in folder ${scriptDir}`
      );
    }

    return new ScriptHandler(
      pythonInterpreter,
      pythonPaths,
      scriptUri,
      outputChannel,
      cwd
    );
  }

  /**
   * generateSamples
   */
  public async generateSamples(): Promise<Sample[]> {
    const options: {
      encoding: "buffer" | null;
    } & ExecOptions = {
      encoding: "buffer",
    };
    let workspaceFolder = "";
    for (let wf of vscode.workspace.workspaceFolders || []) {
      if (this.scriptUri.fsPath.startsWith(wf.uri.fsPath)) {
        workspaceFolder = wf.uri.fsPath;
      }
    }
    if (this.pythonPaths && this.pythonPaths.length > 0) {
      options.env = {
        PYTHONPATH: this.pythonPaths
          .map((s) =>
            workspaceFolder
              ? s.replace("${workspaceFolder}", workspaceFolder)
              : s
          )
          .join(":"),
      };
      this.outputChannel.appendLine(`env: ${JSON.stringify(options.env)}`);
    }
    if (this.cwd) {
      options.cwd = workspaceFolder
        ? this.cwd.replace("${workspaceFolder}", workspaceFolder)
        : this.cwd;
    }
    const { stdout } = await exec(
      `${this.pythonInterpreter} ${this.scriptUri.fsPath} printSamples`,
      options
    );
    try {
      return JSON.parse(stdout.toString());
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error(
          `${err.message}\ndid you call vscodeSpotCheck.printSamples?`
        );
      } else {
        throw err;
      }
    }
  }
}
