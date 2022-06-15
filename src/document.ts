import * as vscode from "vscode";

import { Disposable } from "./disposable";
import ScriptHandler from "./script-handler";

export class SpotCheckDocument
  extends Disposable
  implements vscode.CustomDocument
{
  static async create(
    uri: vscode.Uri,
    backupId: string | undefined
  ): Promise<SpotCheckDocument | PromiseLike<SpotCheckDocument>> {
    // If we have a backup, read that. Otherwise read the resource from the workspace
    const dataFile =
      typeof backupId === "string" ? vscode.Uri.parse(backupId) : uri;
    const sh = await ScriptHandler.fromScriptUri(dataFile);
    return new SpotCheckDocument(uri, sh);
  }

  private readonly _uri: vscode.Uri;

  private _scriptHandler: ScriptHandler;

  private _samples: Sample[];

  private _sampleIndex: number;

  private constructor(uri: vscode.Uri, scriptHandler: ScriptHandler) {
    super();
    this._uri = uri;
    this._scriptHandler = scriptHandler;
    this._samples = [];
    this._sampleIndex = -1;
  }

  public get uri() {
    return this._uri;
  }

  public async nextSample(): Promise<Sample> {
    if (this._sampleIndex >= this._samples.length - 1) {
      const samples = await this._scriptHandler.generateSamples();
      this._samples = [...this._samples, ...samples];
    }
    this._sampleIndex++;
    return this._samples[this._sampleIndex];
  }

  public prevSample(): Sample | undefined {
    if (this._sampleIndex <= 0) {
      return undefined;
    }
    this._sampleIndex--;
    return this._samples[this._sampleIndex];
  }

  public get sampleIndex(): number {
    return this._sampleIndex;
  }

  private readonly _onDidDispose = this._register(
    new vscode.EventEmitter<void>()
  );
  /**
   * Fired when the document is disposed of.
   */
  public readonly onDidDispose = this._onDidDispose.event;

  /**
   * Called by VS Code when there are no more references to the document.
   *
   * This happens when all editors for it have been closed.
   */
  dispose(): void {
    this._onDidDispose.fire();
    super.dispose();
  }
}
