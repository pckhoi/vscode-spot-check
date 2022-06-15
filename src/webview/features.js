export const renderFeatures = (features) => {
  const container = document.querySelector("#features .container");
  container.innerHTML = "";
  for (let feat of features) {
    const label = document.createElement("label");
    label.classList.add("key");
    label.textContent = feat.key;
    container.appendChild(label);

    const value = document.createElement("span");
    value.classList.add("value");
    value.textContent = feat.value;
    container.appendChild(value);
  }
};
