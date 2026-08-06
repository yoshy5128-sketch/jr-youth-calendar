const WORKER_URL = "https://jr-youth-calendar-api.yoshy55.workers.dev";

const imageInput = document.getElementById("imageInput");
const yearInput = document.getElementById("yearInput");
const previewArea = document.getElementById("previewArea");
const previewImage = document.getElementById("previewImage");
const fileInfo = document.getElementById("fileInfo");
const analyzeButton = document.getElementById("analyzeButton");
const statusCard = document.getElementById("statusCard");
const statusMessage = document.getElementById("statusMessage");
const resultCard = document.getElementById("resultCard");
const resultSummary = document.getElementById("resultSummary");
const eventList = document.getElementById("eventList");
const clearButton = document.getElementById("clearButton");
const eventTemplate = document.getElementById("eventTemplate");

let selectedFile = null;

yearInput.value = new Date().getFullYear();

imageInput.addEventListener("change", () => {
  selectedFile = imageInput.files?.[0] || null;

  if (!selectedFile) {
    resetImage();
    return;
  }

  if (!selectedFile.type.startsWith("image/")) {
    showStatus("画像ファイルを選択してください。", true);
    resetImage();
    return;
  }

  const objectUrl = URL.createObjectURL(selectedFile);
  previewImage.src = objectUrl;
  previewArea.classList.remove("hidden");
  fileInfo.textContent =
    `${selectedFile.name} / ${formatBytes(selectedFile.size)} / ${selectedFile.type}`;
  analyzeButton.disabled = false;
  hideResults();
});

analyzeButton.addEventListener("click", async () => {
  if (!selectedFile) return;

  analyzeButton.disabled = true;
  showStatus("画像を準備しています…");

  try {
    const optimized = await resizeImage(selectedFile, 1800, 0.88);
    showStatus("予定表を解析しています…\n画像の大きさによっては少し時間がかかります。");

    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        year: Number(yearInput.value),
        mimeType: optimized.mimeType,
        imageBase64: optimized.dataUrl
      })
    });

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(`サーバーから正しい応答を受け取れませんでした。HTTP ${response.status}`);
    }

    if (!response.ok || !data.ok) {
      throw new Error(data.details || data.error || `HTTP ${response.status}`);
    }

    renderEvents(data);
    showStatus(`解析完了：「男」の予定を ${data.eventCount ?? data.events?.length ?? 0} 件取得しました。`);
  } catch (error) {
    console.error(error);
    showStatus(
      `解析できませんでした。\n${error instanceof Error ? error.message : String(error)}`,
      true
    );
  } finally {
    analyzeButton.disabled = false;
  }
});

clearButton.addEventListener("click", () => {
  imageInput.value = "";
  resetImage();
  hideResults();
  statusCard.classList.add("hidden");
});

function renderEvents(data) {
  eventList.innerHTML = "";
  const events = Array.isArray(data.events) ? data.events : [];

  resultSummary.textContent =
    `${data.year ?? yearInput.value}年${data.month ? `${data.month}月` : ""}／${events.length}件`;

  if (events.length === 0) {
    eventList.innerHTML = "<p>登録対象となる「男」の予定は見つかりませんでした。</p>";
  }

  for (const event of events) {
    const node = eventTemplate.content.cloneNode(true);
    node.querySelector(".event-date").textContent = formatDate(event.date);
    node.querySelector(".event-time").textContent =
      event.startTime && event.endTime
        ? `${event.startTime} ～ ${event.endTime}`
        : "時刻不明";
    node.querySelector(".event-location").textContent =
      event.location || "場所不明";
    node.querySelector(".event-team").textContent = event.team || "―";
    node.querySelector(".event-category").textContent = event.category || "男";
    node.querySelector(".event-open").textContent = event.keyOpen || "―";
    node.querySelector(".event-close").textContent = event.keyClose || "―";
    node.querySelector(".event-notes").textContent = event.notes || "―";
    node.querySelector(".event-confidence").textContent =
      typeof event.confidence === "number"
        ? `${Math.round(event.confidence * 100)}%`
        : "―";
    eventList.appendChild(node);
  }

  resultCard.classList.remove("hidden");
  resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showStatus(message, isError = false) {
  statusCard.classList.remove("hidden");
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

function hideResults() {
  resultCard.classList.add("hidden");
  eventList.innerHTML = "";
}

function resetImage() {
  selectedFile = null;
  previewImage.removeAttribute("src");
  previewArea.classList.add("hidden");
  fileInfo.textContent = "";
  analyzeButton.disabled = true;
}

function formatDate(value) {
  if (!value) return "日付不明";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${weekdays[date.getDay()]}）`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function resizeImage(file, maxDimension, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("画像ファイルを読み込めませんでした。"));

    reader.onload = () => {
      const image = new Image();

      image.onerror = () => reject(new Error("画像を開けませんでした。"));

      image.onload = () => {
        let width = image.naturalWidth;
        let height = image.naturalHeight;
        const largest = Math.max(width, height);

        if (largest > maxDimension) {
          const scale = maxDimension / largest;
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d", { alpha: false });
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);

        const mimeType = "image/jpeg";
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve({ dataUrl, mimeType, width, height });
      };

      image.src = String(reader.result);
    };

    reader.readAsDataURL(file);
  });
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(console.error);
  });
}
