import * as vscode from "vscode";
import { basename, dirname } from "node:path";
import { execute } from "./executor";

export default class ScriptHandler {
  scriptUri: vscode.Uri;
  scriptStats: vscode.FileStat;
  dataFilesStats: vscode.FileStat[];
  pythonPath: string;

  constructor(
    pythonPath: string,
    scriptUri: vscode.Uri,
    scriptStats: vscode.FileStat,
    dataFilesStats: vscode.FileStat[]
  ) {
    this.scriptUri = scriptUri;
    this.scriptStats = scriptStats;
    this.pythonPath = pythonPath;
    this.dataFilesStats = dataFilesStats;
  }

  public static async fromScriptUri(scriptUri: vscode.Uri) {
    const conf = vscode.workspace.getConfiguration("spot-check");
    const pythonPath = conf.get("pythonInterpreterPath") as string;
    const scriptBasename = basename(scriptUri.fsPath);
    const scriptDir = dirname(scriptUri.fsPath);
    const scriptStats = await vscode.workspace.fs.stat(scriptUri);
    if (scriptStats.type & vscode.FileType.File) {
      throw new Error(
        `spot check script ${scriptBasename} does not exist in folder ${scriptDir}`
      );
    }

    const result = await execute(pythonPath, scriptUri.fsPath, "dataFiles");
    const dataFiles = result.trim().split("\n");

    return new ScriptHandler(
      pythonPath,
      scriptUri,
      scriptStats,
      await Promise.all(
        dataFiles.map((file) => vscode.workspace.fs.stat(vscode.Uri.file(file)))
      )
    );
  }

  /**
   * maxModTime
   */
  public maxModTime() {
    return Math.max(
      this.scriptStats.mtime,
      ...this.dataFilesStats.map((stats) => stats.mtime)
    );
  }

  /**
   * generateSamples
   */
  public async generateSamples(): Promise<any[]> {
    const result = await execute(
      this.pythonPath,
      this.scriptUri.fsPath,
      "generate"
    );
    return JSON.parse(result);
  }
}
