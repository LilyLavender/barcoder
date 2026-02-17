const barcodeEl = document.getElementById("barcode");
const upcInput = document.getElementById("upcInput");
const barcodeCard = document.getElementById("barcodeCard");
const historyEl = document.getElementById("history");

let currentUPC = null;

function generate(upc) {
  const raw = upc || upcInput.value;
  const upc11 = normalizeUPC(raw);
  if (!upc11) return;

  currentUPC = upc11;
  upcInput.value = upc11;

  JsBarcode(barcodeEl, withChecksum(upc11), {
    format: "upc",
    displayValue: true,
  });

  barcodeCard.classList.remove("hidden");
  addToHistory(upc11);
}

async function startCamera() {
  const codeReader = new ZXing.BrowserBarcodeReader();
  const video = document.getElementById("video");
  video.hidden = false;

  try {
    const result = await codeReader.decodeOnceFromVideoDevice(null, video);

    const upc11 = normalizeUPC(result.text);
    if (!upc11) {
      alert("Scanned code is not a valid UPC");
      return;
    }

    upcInput.value = upc11;
    generate(upc11);
    video.hidden = true;
  } catch (err) {
    console.error(err);
    alert("Camera scan failed");
  }
}

function normalizeUPC(value) {
  const digits = value.replace(/\D/g, "");

  if (digits.length > 12) return null;

  if (digits.length === 12) {
    return digits.slice(0, 11);
  }

  return digits.padStart(11, "0");
}

function withChecksum(upc11) {
  return upc11 + calculateUPCChecksum(upc11);
}

function calculateUPCChecksum(upc11) {
  let sumOdd = 0;
  let sumEven = 0;

  for (let i = 0; i < upc11.length; i++) {
    const digit = parseInt(upc11[i], 10);
    if (i % 2 === 0) sumOdd += digit;
    else sumEven += digit;
  }

  const total = sumOdd * 3 + sumEven;
  return (10 - (total % 10)) % 10;
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
    div.innerHTML = `
      <span onclick="generate('${upc}')">${upc}</span>
    `;
    historyEl.appendChild(div);
  });
}

loadHistory();