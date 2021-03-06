export const initializeControls = (vscode) => {
  document.querySelector("#controlPanel .previous").onclick = () => {
    vscode.postMessage({
      type: "prevSample",
    });
  };
  document.querySelector("#controlPanel .next").onclick = () => {
    vscode.postMessage({
      type: "nextSample",
    });
  };
};

export const renderControls = (sourcePath, currentPage) => {
  document.querySelector("#sourcePath").innerText = sourcePath;
  if (currentPage === 0) {
    document
      .querySelector("#controlPanel .previous")
      .setAttribute("disabled", "");
  } else {
    document
      .querySelector("#controlPanel .previous")
      .removeAttribute("disabled");
  }
};
