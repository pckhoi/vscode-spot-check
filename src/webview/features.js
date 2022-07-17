export const renderFeatures = (record) => {
  const container = document.querySelector("#features .container");
  container.innerHTML = "";
  if (record) {
    for (let key in record) {
      const label = document.createElement("label");
      label.classList.add("key");
      label.textContent = key;
      container.appendChild(label);

      const value = document.createElement("pre");
      value.classList.add("value");
      value.textContent = record[key];
      container.appendChild(value);
    }
  }
};
