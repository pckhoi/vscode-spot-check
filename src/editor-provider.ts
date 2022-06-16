import ejs from "ejs";
import path from "path";
import * as vscode from "vscode";

import { disposeAll } from "./disposable";
import { SpotCheckDocument } from "./document";

/**
 * Tracks all webviews.
 */
class WebviewCollection {
  private readonly _webviews = new Set<{
    readonly resource: string;
    readonly webviewPanel: vscode.WebviewPanel;
  }>();

  /**
   * Get all known webviews for a given uri.
   */
  public *get(uri: vscode.Uri): Iterable<vscode.WebviewPanel> {
    const key = uri.toString();
    for (const entry of this._webviews) {
      if (entry.resource === key) {
        yield entry.webviewPanel;
      }
    }
  }

  /**
   * Add a new webview to the collection.
   */
  public add(uri: vscode.Uri, webviewPanel: vscode.WebviewPanel) {
    const entry = { resource: uri.toString(), webviewPanel };
    this._webviews.add(entry);

    webviewPanel.onDidDispose(() => {
      this._webviews.delete(entry);
    });
  }
}

export class SpotCheckEditorProvider
  implements vscode.CustomReadonlyEditorProvider<SpotCheckDocument>
{
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    vscode.commands.registerCommand("spot-check.openWithSpotCheck", () => {
      const uri = vscode.window.activeTextEditor?.document.uri;
      if (!uri) {
        vscode.window.showErrorMessage(
          "Must open Spot Check editor on a Python script"
        );
      }

      vscode.commands.executeCommand(
        "vscode.openWith",
        uri,
        SpotCheckEditorProvider.viewType
      );
    });

    return vscode.window.registerCustomEditorProvider(
      SpotCheckEditorProvider.viewType,
      new SpotCheckEditorProvider(context),
      {
        // For this demo extension, we enable `retainContextWhenHidden` which keeps the
        // webview alive even when it is not visible. You should avoid using this setting
        // unless is absolutely required as it does have memory overhead.
        webviewOptions: {
          retainContextWhenHidden: true,
        },
        supportsMultipleEditorsPerDocument: false,
      }
    );
  }

  private static readonly viewType = "spot-check.spotCheck";

  /**
   * Tracks all known webviews
   */
  private readonly webviews = new WebviewCollection();

  constructor(private readonly _context: vscode.ExtensionContext) {}

  async openCustomDocument(
    uri: vscode.Uri,
    openContext: { backupId?: string },
    _token: vscode.CancellationToken
  ): Promise<SpotCheckDocument> {
    const document: SpotCheckDocument = await SpotCheckDocument.create(
      uri,
      openContext.backupId
    );

    const listeners: vscode.Disposable[] = [];

    document.onDidDispose(() => disposeAll(listeners));

    return document;
  }

  async resolveCustomEditor(
    document: SpotCheckDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    // Add the webview to our internal set of active webviews
    this.webviews.add(document.uri, webviewPanel);

    // Setup initial content for the webview
    const resourceRoot = document.uri.with({
      path: document.uri.path.replace(/\/[^/]+?\.\w+$/, "/"),
    });
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        resourceRoot,
        vscode.Uri.file(this._context.extensionPath),
        ...(vscode.workspace.workspaceFolders !== undefined
          ? vscode.workspace.workspaceFolders.map((d) => d.uri)
          : []),
      ],
    };

    webviewPanel.webview.html = await this._getHtmlForWebview(
      webviewPanel.webview
    );

    webviewPanel.webview.onDidReceiveMessage(
      (e) => this._onReceiveMessage(webviewPanel, document, e),
      undefined,
      this._context.subscriptions
    );
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const resolveAsUri = (p: string[]): vscode.Uri =>
      webview.asWebviewUri(
        vscode.Uri.file(path.join(this._context.extensionPath, ...p))
      );

    return ejs.renderFile(
      path.join(this._context.extensionPath, "src", "templates", "webview.ejs"),
      {
        cspSource: webview.cspSource,
        pdfViewerConfig: JSON.stringify({
          cMapUrl: resolveAsUri([
            "src",
            "vendor",
            "pdfjs",
            "web",
            "cmaps/",
          ]).toString(),
        }),
        scriptPaths: [
          ["src", "vendor", "pdfjs", "build", "pdf.js"],
          ["src", "vendor", "pdfjs", "build", "pdf.worker.js"],
          ["src", "vendor", "pdfjs", "web", "viewer.js"],
        ].map(resolveAsUri),
        moduleScriptPaths: [["src", "webview", "main.js"]].map(resolveAsUri),
        stylePaths: [
          ["src", "vendor", "pdfjs", "web", "viewer.css"],
          ["src", "webview", "main.css"],
        ].map(resolveAsUri),
        localeUri: resolveAsUri([
          "src",
          "vendor",
          "pdfjs",
          "web",
          "locale",
          "locale.properties",
        ]),
      },
      { root: this._context.extensionPath }
    );
  }

  private _showSample(
    panel: vscode.WebviewPanel,
    document: SpotCheckDocument,
    sample: Sample
  ) {
    return panel.webview.postMessage({
      type: "showSample",
      sampleIndex: document.sampleIndex,
      ...sample,
      sourcePath: panel.webview
        .asWebviewUri(vscode.Uri.file(sample.sourcePath))
        .toString(),
    });
  }

  private async _onReceiveMessage(
    panel: vscode.WebviewPanel,
    document: SpotCheckDocument,
    message: any
  ) {
    let sample: Sample | undefined;
    switch (message.type) {
      case "prevSample":
        sample = document.prevSample();
        if (sample === undefined) {
          return;
        }
        await this._showSample(panel, document, sample);
        return;
      case "ready":
      case "nextSample":
        sample = await document.nextSample();
        await this._showSample(panel, document, sample);
        return;
    }
  }
}
