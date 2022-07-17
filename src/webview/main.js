import { initializeControls, renderControls } from "./control.js";
import { renderFeatures } from "./features.js";
import { initializePDFViewer, renderPDF, reloadPDF } from "./pdfviewer.js";

let vscode;

window.addEventListener(
  "load",
  function () {
    vscode = acquireVsCodeApi();
    initializeControls(vscode);
    initializePDFViewer();
    window.addEventListener("message", function (event) {
      const {
        type,
        sampleIndex,
        record,
        sourcePath,
        sourceUri,
        pageNumber,
        error,
      } = event.data;
      switch (type) {
        case "showSample":
          renderControls(sourcePath, sampleIndex);
          renderFeatures(record);
          renderPDF(sourceUri, pageNumber);
          break;
        case "reload":
          renderControls(sourcePath, sampleIndex);
          renderFeatures(record);
          reloadPDF(sourceUri);
          break;
        case "error":
          throw new Error(error);
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

window.onerror = function (error) {
  const elem = document.createElement("body");
  const errorContainer = document.createElement("pre");
  errorContainer.classList.add("error-container");
  errorContainer.innerText =
    "An error occurred while loading the file.\n\n" + error;
  elem.appendChild(errorContainer);
  document.body = elem;
};
