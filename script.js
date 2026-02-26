$(function () {
  const $barcodeEl = $("#barcode");
  const $upcInput = $("#upcInput");
  const $barcodeCard = $("#barcodeCard");
  const $historyEl = $("#history");
  const $clearBtn = $("#clearInput");
  const $video = $("#video");
  const $videoCard = $("#video-card");

  let currentUPC = null;

  function generate(value) {
    const raw = value ?? $upcInput.val();
    const text = raw.trim();
    if (!text.length) return;

    currentUPC = text;
    $upcInput.val(text);
    try {
      JsBarcode($barcodeEl[0], text, {
        format: "CODE128",
        displayValue: true,
      });

      $barcodeCard.removeClass("hidden");
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

  async function startCamera() {
    const codeReader = new ZXing.BrowserBarcodeReader();
    $videoCard.prop("hidden", false);

    try {
      const result = await codeReader.decodeOnceFromVideoDevice(null, $video[0]);
      const text = cleanShelfTag(result.text);

      if (!text.length) {
        alert("Scanned code is invalid");
        stopCamera();
        return;
      }

      $upcInput.val(text);
      generate(text);

      $videoCard.prop("hidden", true);
      stopCamera();
    } catch (err) {
      console.error(err);
      alert("Camera scan failed");
      stopCamera();
    }
  }

  function stopCamera() {
    const stream = $video[0].srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      $video[0].srcObject = null;
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
    $historyEl.empty();
    const history = JSON.parse(localStorage.getItem("history") || "[]");

    history.forEach(upc => {
      const $div = $("<div>").addClass("history-item");

      const $span = $("<span>")
        .text(upc)
        .css("cursor", "pointer")
        .on("click", () => generate(upc));

      const $deleteBtn = $("<button>")
        .addClass("delete-btn")
        .html('<i class="bi bi-trash"></i>')
        .on("click", () => removeFromHistory(upc));

      $div.append($span, $deleteBtn);
      $historyEl.append($div);
    });
  }

  function removeFromHistory(upc) {
    let history = JSON.parse(localStorage.getItem("history") || "[]");
    history = history.filter(h => h !== upc);
    localStorage.setItem("history", JSON.stringify(history));
    loadHistory();
  }

  $upcInput.on("input", function () {
    $clearBtn.toggle($(this).val().length > 0);
  });

  $clearBtn.on("click", function () {
    $upcInput.val("");
    $clearBtn.hide();
    $barcodeCard.addClass("hidden");
    $upcInput.focus();
  });

  window.startCamera = startCamera;
  window.generate = generate;

  loadHistory();
});