import * as vscode from "vscode";
import { basename, dirname } from "node:path";
import { execute } from "./executor";

export default class ScriptHandler {
  scriptUri: vscode.Uri;
  scriptStats: vscode.FileStat;
  pythonPath: string;

  constructor(
    pythonPath: string,
    scriptUri: vscode.Uri,
    scriptStats: vscode.FileStat
  ) {
    this.scriptUri = scriptUri;
    this.scriptStats = scriptStats;
    this.pythonPath = pythonPath;
  }

  public static async fromScriptUri(scriptUri: vscode.Uri) {
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

    return new ScriptHandler(pythonPath, scriptUri, scriptStats);
  }

  /**
   * generateSamples
   */
  public async generateSamples(): Promise<Sample[]> {
    const result = await execute(this.pythonPath, this.scriptUri.fsPath);
    return JSON.parse(result);
  }
}
