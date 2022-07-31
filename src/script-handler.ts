import * as vscode from "vscode";
import { basename, dirname } from "node:path";
import { execute } from "./executor";

export default class ScriptHandler {
  scriptUri: vscode.Uri;
  pythonPath: string;
  outputChannel: vscode.OutputChannel;

  constructor(
    pythonPath: string,
    scriptUri: vscode.Uri,
    outputChannel: vscode.OutputChannel
  ) {
    this.scriptUri = scriptUri;
    this.pythonPath = pythonPath;
    this.outputChannel = outputChannel;
  }

  public static async fromScriptUri(
    scriptUri: vscode.Uri,
    outputChannel: vscode.OutputChannel
  ) {
    const conf = vscode.workspace.getConfiguration("spot-check");
    const pythonPath = conf.get("pythonInterpreterPath") as string;
    const scriptBasename = basename(scriptUri.fsPath);
    const scriptDir = dirname(scriptUri.fsPath);
    const scriptStats = await vscode.workspace.fs.stat(scriptUri);
    if (!(scriptStats.type & vscode.FileType.File)) {
      throw new Error(
        `spot check script ${scriptBasename} does not exist in folder ${scriptDir}`
      );
    }

    return new ScriptHandler(pythonPath, scriptUri, outputChannel);
  }

  /**
   * generateSamples
   */
  public async generateSamples(): Promise<Sample[]> {
    const result = await execute(
      this.pythonPath,
      this.scriptUri.fsPath,
      "printSamples"
    );
    try {
      return JSON.parse(result);
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
