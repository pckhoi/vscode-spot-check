function loadConfig() {
  const elem = document.getElementById("pdfViewerConfig");
  if (elem) {
    return JSON.parse(elem.textContent);
  }
  throw new Error("Could not load configuration.");
}

export const initializePDFViewer = () => {
  const config = loadConfig();
  PDFViewerApplicationOptions.set("cMapUrl", config.cMapUrl);
};

const openPDF = async (docPath, onLoad) => {
  await PDFViewerApplication.open(docPath);
  const optsOnLoad = () => {
    onLoad();
    PDFViewerApplication.eventBus.off("documentloaded", optsOnLoad);
  };
  PDFViewerApplication.eventBus.on("documentloaded", optsOnLoad);
};

export const renderPDF = async (docPath, pageNumber) => {
  await openPDF(docPath, () => {
    if (pageNumber !== undefined) {
      PDFViewerApplication.pdfViewer.currentPageNumber = parseInt(pageNumber);
    }
  });
};

export const reloadPDF = async (docPath) => {
  const { currentPageNumber, currentScaleValue } =
    PDFViewerApplication.pdfViewer;
  await openPDF(docPath, () => {
    PDFViewerApplication.pdfViewer.currentPageNumber = currentPageNumber;
    PDFViewerApplication.pdfViewer.currentScaleValue = currentScaleValue;
  });
};
