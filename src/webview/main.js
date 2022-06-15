import { initializeControls, renderControls } from "./control";
import { renderFeatures } from "./features";
import { initializePDFViewer, renderPDF, reloadPDF } from "./pdfviewer";

let vscode;

window.addEventListener(
  "load",
  function () {
    vscode = acquireVsCodeApi();
    initializeControls(vscode);
    initializePDFViewer();
    window.addEventListener("message", function (event) {
      const { type, sampleIndex, record, sourcePath, pageNumber } = event.data;
      switch (type) {
        case "showSample":
          renderControls(sampleIndex);
          renderFeatures(record);
          renderPDF(sourcePath, pageNumber);
          break;
        case "reload":
          renderControls(sampleIndex);
          renderFeatures(record);
          reloadPDF(sourcePath);
          break;
        default:
          throw new Error(`unrecognized message type ${type}`);
      }
    });
    vscode.postMessage({
      type: "ready",
    });
  },
  { once: true }
);

window.onerror = function () {
  const msg = document.createElement("body");
  msg.innerText =
    "An error occurred while loading the file. Please open it again.";
  document.body = msg;
};
