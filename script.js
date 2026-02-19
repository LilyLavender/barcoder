const barcodeEl = document.getElementById("barcode");
const upcInput = document.getElementById("upcInput");
const barcodeCard = document.getElementById("barcodeCard");
const historyEl = document.getElementById("history");

let currentUPC = null;

function generate(value) {
  const raw = value ?? upcInput.value;
  const text = raw.trim();

  if (!text.length) return;

  currentUPC = text;
  upcInput.value = text;

  try {
    JsBarcode(barcodeEl, text, {
      format: "CODE128",
      displayValue: true,
    });

    barcodeCard.classList.remove("hidden");
    addToHistory(text);
  } catch (err) {
    console.error(err);
    alert("Invalid barcode value");
  }
}

function cleanShelfTag(value) {
  let text = value.trim();

  if (/^\d+$/.test(text) && text.length >= 14 && text.length <= 15) {
    text = text.slice(2);
    text = text.replace(/^0+/, "");
  }

  return text;
}

let activeStream = null;

async function startCamera() {
  const codeReader = new ZXing.BrowserBarcodeReader();
  const video = document.getElementById("video");
  const videoCard = document.getElementById("video-card");
  videoCard.hidden = false;

  try {
    const result = await codeReader.decodeOnceFromVideoDevice(null, video);

    const text = cleanShelfTag(result.text);

    if (!text.length) {
      alert("Scanned code is invalid");
      stopCamera();
      return;
    }

    upcInput.value = text;
    generate(text);

    videoCard.hidden = true;
    stopCamera();
  } catch (err) {
    console.error(err);
    alert("Camera scan failed");
    stopCamera();
  }
}

function stopCamera() {
  if (activeStream) {
    activeStream.getTracks().forEach(track => track.stop());
    activeStream = null;
    const video = document.getElementById("video");
    video.srcObject = null;
  }
}

function addToHistory(upc) {
  let history = JSON.parse(localStorage.getItem("history") || "[]");

  history = history.filter(h => h !== upc);
  history.unshift(upc);
  history = history.slice(0, 20);

  localStorage.setItem("history", JSON.stringify(history));
  loadHistory();
}

function loadHistory() {
  historyEl.innerHTML = "";
  const history = JSON.parse(localStorage.getItem("history") || "[]");

  history.forEach(upc => {
    const div = document.createElement("div");
    div.className = "history-item";

    const span = document.createElement("span");
    span.textContent = upc;
    span.style.cursor = "pointer";
    span.onclick = () => generate(upc);

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
    deleteBtn.className = "delete-btn";
    deleteBtn.onclick = () => removeFromHistory(upc);

    div.appendChild(span);
    div.appendChild(deleteBtn);
    historyEl.appendChild(div);
  });
}

function removeFromHistory(upc) {
  let history = JSON.parse(localStorage.getItem("history") || "[]");
  history = history.filter(h => h !== upc);
  localStorage.setItem("history", JSON.stringify(history));
  loadHistory();
}

loadHistory();