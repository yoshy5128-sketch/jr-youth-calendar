const WORKER_URL =
  "https://jr-youth-calendar-api.yoshy55.workers.dev";

const DEFAULT_TITLE =
  "Jrユース・スケジュール";

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
const selectAllButton = document.getElementById("selectAllButton");
const deselectAllButton = document.getElementById("deselectAllButton");
const eventTemplate = document.getElementById("eventTemplate");
const duplicateWarning = document.getElementById("duplicateWarning");
const auditWarning = document.getElementById("auditWarning");
const exportCard = document.getElementById("exportCard");
const calendarTitleInput = document.getElementById("calendarTitleInput");
const reminderSelect = document.getElementById("reminderSelect");
const includeSourceNote = document.getElementById("includeSourceNote");
const downloadIcsButton = document.getElementById("downloadIcsButton");
const exportMessage = document.getElementById("exportMessage");
const bulkAllDayButton = document.getElementById("bulkAllDayButton");

let selectedFile = null;
let sourceDocumentTitle = "";

yearInput.value = new Date().getFullYear();


imageInput.addEventListener("change", () => {
  selectedFile = imageInput.files?.[0] || null;

  if (!selectedFile) {
    resetImage();
    return;
  }

  if (
    !selectedFile.type.startsWith("image/") &&
    !/\.(jpg|jpeg|png|webp|heic|heif)$/i.test(selectedFile.name)
  ) {
    showStatus("画像ファイルを選択してください。", true);
    resetImage();
    return;
  }

  const objectUrl = URL.createObjectURL(selectedFile);

  previewImage.src = objectUrl;
  previewArea.classList.remove("hidden");

  fileInfo.textContent =
    `${selectedFile.name} / ${formatBytes(selectedFile.size)} / ` +
    `${selectedFile.type || "画像"}`;

  analyzeButton.disabled = false;
  hideResults();
});


analyzeButton.addEventListener("click", async () => {
  if (!selectedFile) return;

  analyzeButton.disabled = true;
  showStatus("画像を準備しています…");
  hideExportMessage();

  try {
    const optimized = await resizeImage(selectedFile, 2200, 0.92);

    showStatus(
      "予定表を厳密に解析しています…\n" +
      "読み取り漏れを減らすため、同じ画像を2回照合しています。"
    );

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
      throw new Error(
        `サーバーから正しい応答を受け取れませんでした。HTTP ${response.status}`
      );
    }

    if (!response.ok || !data.ok) {
      throw new Error(
        data.details ||
        data.error ||
        `HTTP ${response.status}`
      );
    }

    sourceDocumentTitle = data.documentTitle || "";

    renderEvents(data);

    showStatus(
      "解析完了：\n" +
      `「男」の予定を ${data.eventCount ?? 0} 件取得しました。`
    );
  } catch (error) {
    console.error(error);

    showStatus(
      "解析できませんでした。\n" +
      (error instanceof Error ? error.message : String(error)),
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
  hideExportMessage();
});


selectAllButton.addEventListener("click", () => {
  setAllEnabled(true);
});


deselectAllButton.addEventListener("click", () => {
  setAllEnabled(false);
});


bulkAllDayButton.addEventListener("click", () => {
  const cards = [...document.querySelectorAll(".event-card")];

  let changedCount = 0;
  let dateMissingCount = 0;

  for (const card of cards) {
    const enabled = card.querySelector(".event-enabled").checked;

    if (!enabled) continue;

    const date = card.querySelector(".event-date").value;
    const start = card.querySelector(".event-start").value;
    const end = card.querySelector(".event-end").value;
    const allDay = card.querySelector(".event-all-day");

    if (!date) {
      dateMissingCount++;
      continue;
    }

    if (!start || !end) {
      allDay.checked = true;

      card.dataset.autoAllDay = "true";

      card.querySelector(".event-start").disabled = true;
      card.querySelector(".event-end").disabled = true;

      card.querySelector(".time-warning").classList.add("hidden");
      card.classList.remove("invalid");

      changedCount++;
    }
  }

  bulkAllDayButton.classList.add("hidden");
  updateExportState();
  detectDuplicates();

  if (changedCount > 0 && dateMissingCount === 0) {
    showExportMessage(
      `${changedCount}件の時刻不明予定を終日予定に変更しました。`
    );
  } else if (changedCount > 0) {
    showExportMessage(
      `${changedCount}件を終日予定に変更しました。` +
      ` 日付未入力が ${dateMissingCount} 件残っています。`,
      true
    );
  } else {
    showExportMessage(
      "終日予定へ変更できる時刻不明予定はありませんでした。",
      true
    );
  }
});


downloadIcsButton.addEventListener("click", () => {
  hideExportMessage();

  const cards = [...document.querySelectorAll(".event-card")];

  const selected = cards
    .map(readEventCard)
    .filter(event => event.enabled);

  if (selected.length === 0) {
    showExportMessage(
      "出力する予定を1件以上選択してください。",
      true
    );
    return;
  }

  const invalid = selected.filter(event => !validateEvent(event));

  cards.forEach(card => {
    const event = readEventCard(card);

    card.classList.toggle(
      "invalid",
      event.enabled && !validateEvent(event)
    );
  });

  if (invalid.length > 0) {
    showExportMessage(
      `未入力または時刻不明の予定が ${invalid.length} 件あります。` +
      "赤枠を修正するか終日予定を選んでください。",
      true
    );

    bulkAllDayButton.classList.remove("hidden");
    return;
  }

  const title =
    calendarTitleInput.value.trim() ||
    DEFAULT_TITLE;

  const reminder =
    reminderSelect.value;

  const ics =
    buildIcs(
      selected,
      title,
      reminder,
      includeSourceNote.checked
    );

  downloadTextFile(
    ics,
    `${safeFileName(title)}.ics`,
    "text/calendar;charset=utf-8"
  );

  showExportMessage(
    `${selected.length}件の予定をICSファイルにまとめました。`
  );
});


function renderEvents(data) {
  eventList.innerHTML = "";

  const events = Array.isArray(data.events) ? data.events : [];

  resultSummary.textContent =
    `${data.year ?? yearInput.value}年` +
    `${data.month ? `${data.month}月` : ""}` +
    `／${events.length}件`;

  renderAudit(data.audit);

  if (events.length === 0) {
    eventList.innerHTML =
      "<p>登録対象となる「男」の予定は見つかりませんでした。</p>";
  }

  for (const event of events) {
    const node = eventTemplate.content.cloneNode(true);
    const card = node.querySelector(".event-card");

    card.querySelector(".event-date").value = event.date || "";
    card.querySelector(".event-start").value = event.startTime || "";
    card.querySelector(".event-end").value = event.endTime || "";
    card.querySelector(".event-location").value = event.location || "";
    card.querySelector(".event-team").value = event.team || "";
    card.querySelector(".event-open").value = event.keyOpen || "";
    card.querySelector(".event-close").value = event.keyClose || "";
    card.querySelector(".event-notes").value = event.notes || "";

    card.querySelector(".event-confidence").textContent =
      typeof event.confidence === "number"
        ? `${Math.round(event.confidence * 100)}%`
        : "―";

    const noTime = !event.startTime || !event.endTime;

    card.querySelector(".time-warning").classList.toggle(
      "hidden",
      !noTime
    );

    wireEventCard(card);
    eventList.appendChild(node);
  }

  detectDuplicates();

  resultCard.classList.remove("hidden");
  exportCard.classList.remove("hidden");

  updateExportState();

  resultCard.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


function renderAudit(audit) {
  if (!audit) {
    auditWarning.classList.add("hidden");
    return;
  }

  auditWarning.classList.remove("hidden");
  auditWarning.classList.toggle(
    "caution",
    Boolean(audit.hasDisagreement)
  );

  if (audit.hasDisagreement) {
    auditWarning.textContent =
      "読み取りチェック：2回の解析結果に差がありました。 " +
      `1回目 ${audit.firstPassRows}行、` +
      `2回目 ${audit.secondPassRows}行、` +
      `統合後 ${audit.mergedRows}行です。 ` +
      "漏れ候補を統合していますが、念のため一覧をご確認ください。";
  } else {
    auditWarning.textContent =
      "読み取りチェック：2回の解析結果は一致しました。 " +
      `確認した予定行は ${audit.mergedRows} 行です。`;
  }
}


function wireEventCard(card) {
  const enabled = card.querySelector(".event-enabled");
  const allDay = card.querySelector(".event-all-day");
  const start = card.querySelector(".event-start");
  const end = card.querySelector(".event-end");

  enabled.addEventListener("change", () => {
    updateEventCardState(card);
    updateExportState();
  });

  allDay.addEventListener("change", () => {
    /*
      ユーザーが手動で終日を操作した場合は
      「自動で時間未定にした」という印を解除する。
    */
    card.dataset.autoAllDay = "false";

    start.disabled = allDay.checked;
    end.disabled = allDay.checked;

    card.querySelector(".time-warning").classList.toggle(
      "hidden",
      allDay.checked ||
      Boolean(start.value && end.value)
    );

    card.classList.remove("invalid");

    updateExportState();
    detectDuplicates();
  });

  card.querySelectorAll("input, textarea").forEach(field => {
    field.addEventListener("input", () => {
      card.classList.remove("invalid");

      card.querySelector(".time-warning").classList.toggle(
        "hidden",
        allDay.checked ||
        Boolean(start.value && end.value)
      );

      detectDuplicates();
      updateExportState();
    });
  });

  updateEventCardState(card);
}


function setAllEnabled(value) {
  document
    .querySelectorAll(".event-enabled")
    .forEach(input => {
      input.checked = value;
      updateEventCardState(input.closest(".event-card"));
    });

  updateExportState();
}


function updateEventCardState(card) {
  const enabled = card.querySelector(".event-enabled").checked;

  card.classList.toggle(
    "disabled",
    !enabled
  );
}


function readEventCard(card) {
  return {
    card,

    enabled:
      card.querySelector(".event-enabled").checked,

    allDay:
      card.querySelector(".event-all-day").checked,

    autoAllDay:
      card.dataset.autoAllDay === "true",

    date:
      card.querySelector(".event-date").value,

    startTime:
      card.querySelector(".event-start").value,

    endTime:
      card.querySelector(".event-end").value,

    location:
      card.querySelector(".event-location").value.trim(),

    team:
      card.querySelector(".event-team").value.trim(),

    keyOpen:
      card.querySelector(".event-open").value.trim(),

    keyClose:
      card.querySelector(".event-close").value.trim(),

    notes:
      card.querySelector(".event-notes").value.trim()
  };
}


function validateEvent(event) {
  if (!event.date) return false;

  if (event.allDay) return true;

  if (!event.startTime || !event.endTime) return false;

  return event.endTime > event.startTime;
}


function updateExportState() {
  const selectedCount =
    [...document.querySelectorAll(".event-enabled")]
      .filter(input => input.checked)
      .length;

  downloadIcsButton.disabled =
    selectedCount === 0;

  downloadIcsButton.textContent =
    selectedCount > 0
      ? `選択した${selectedCount}件をICSファイルにする`
      : "選択した予定をICSファイルにする";
}


function detectDuplicates() {
  const cards = [...document.querySelectorAll(".event-card")];
  const groups = new Map();

  cards.forEach(card => {
    card.classList.remove("duplicate");
    card.querySelector(".duplicate-badge").classList.add("hidden");

    const event = readEventCard(card);

    const key = [
      event.date,
      event.allDay ? "ALLDAY" : event.startTime,
      event.allDay ? "" : event.endTime,
      normalizeKey(event.location),
      normalizeKey(event.team)
    ].join("|");

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(card);
  });

  let duplicateCount = 0;

  for (const group of groups.values()) {
    if (group.length > 1) {
      duplicateCount += group.length;

      group.forEach(card => {
        card.classList.add("duplicate");
        card.querySelector(".duplicate-badge").classList.remove("hidden");
      });
    }
  }

  duplicateWarning.classList.toggle(
    "hidden",
    duplicateCount === 0
  );

  duplicateWarning.textContent =
    duplicateCount > 0
      ? `同じ日付・時刻・場所・枠に見える予定が ${duplicateCount} 件あります。不要なものはチェックを外してください。`
      : "";
}


/*
  ==========================================================
  ICS生成
  ==========================================================

  重要:
  時刻あり予定は「固定時刻（floating time）」で保存する。

  例:
  2026-08-08 14:00
  ↓
  DTSTART:20260808T140000

  ZもTZIDも付けないため、Googleカレンダー側がGMT+00表示でも
  予定表に書かれた14:00を14:00として取り込む。
*/
function buildIcs(
  events,
  title,
  reminderMinutes,
  addSourceNote
) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//JrYouthSchedule//JA",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(title)}`
  ];

  for (const event of events) {
    const summaryTitle =
      event.allDay && event.autoAllDay
        ? `【時間未定】${title}`
        : title;

    const descriptionParts = [
      event.team
        ? `枠・チーム：${event.team}`
        : "",

      "区分：男",

      event.keyOpen
        ? `鍵当番・開：${event.keyOpen}`
        : "",

      event.keyClose
        ? `鍵当番・閉：${event.keyClose}`
        : "",

      event.notes
        ? `備考：${event.notes}`
        : "",

      event.allDay && event.autoAllDay
        ? "時刻：未定"
        : "",

      sourceDocumentTitle
        ? `元資料：${sourceDocumentTitle}`
        : "",

      addSourceNote
        ? "予定表画像から自動作成"
        : ""
    ].filter(Boolean);

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${createUid(event)}`);
    lines.push(`DTSTAMP:${formatUtcDate(new Date())}`);
    lines.push(`SUMMARY:${escapeIcs(summaryTitle)}`);

    if (event.allDay) {
      const startDate =
        event.date.replaceAll("-", "");

      const endDate =
        addDays(event.date, 1)
          .replaceAll("-", "");

      lines.push(
        `DTSTART;VALUE=DATE:${startDate}`
      );

      lines.push(
        `DTEND;VALUE=DATE:${endDate}`
      );
    } else {
      /*
        固定時刻（floating time）として保存する。
        ZもTZIDも付けないことで、予定表に書かれた
        14:00はカレンダー側のタイムゾーン設定に関係なく
        14:00として取り込ませる。
      */
      lines.push(
        `DTSTART:${formatFloatingDateTime(event.date, event.startTime)}`
      );

      lines.push(
        `DTEND:${formatFloatingDateTime(event.date, event.endTime)}`
      );
    }

    if (event.location) {
      lines.push(
        `LOCATION:${escapeIcs(event.location)}`
      );
    }

    if (descriptionParts.length > 0) {
      lines.push(
        "DESCRIPTION:" +
        escapeIcs(descriptionParts.join("\n"))
      );
    }

    if (reminderMinutes !== "none") {
      lines.push("BEGIN:VALARM");
      lines.push(
        `TRIGGER:-PT${Number(reminderMinutes)}M`
      );
      lines.push("ACTION:DISPLAY");
      lines.push(
        `DESCRIPTION:${escapeIcs(summaryTitle)}`
      );
      lines.push("END:VALARM");
    }

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  return foldIcsLines(lines).join("\r\n") + "\r\n";
}


/*
  JST (UTC+9) をUTCへ変換する。
  PCが日本以外のタイムゾーンでも結果は同じ。
*/
function formatFloatingDateTime(
  dateString,
  timeString
) {
  return (
    dateString.replaceAll("-", "") +
    "T" +
    timeString.replace(":", "") +
    "00"
  );
}

function createUid(event) {
  const raw = [
    event.date,
    event.startTime,
    event.endTime,
    event.location,
    event.team,
    Date.now(),
    Math.random().toString(36).slice(2)
  ].join("-");

  return (
    `${simpleHash(raw)}@jr-youth-calendar`
  );
}


function simpleHash(text) {
  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash =
      (
        (hash << 5) -
        hash +
        text.charCodeAt(i)
      ) | 0;
  }

  return Math.abs(hash).toString(36);
}


function escapeIcs(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}


function foldIcsLines(lines) {
  const result = [];
  const encoder = new TextEncoder();

  for (const line of lines) {
    let remaining = line;
    let firstChunk = true;

    while (encoder.encode(remaining).length > 73) {
      const limit =
        firstChunk ? 73 : 72;

      let cut =
        Math.min(remaining.length, limit);

      while (
        cut > 1 &&
        encoder.encode(
          remaining.slice(0, cut)
        ).length > limit
      ) {
        cut--;
      }

      result.push(
        (firstChunk ? "" : " ") +
        remaining.slice(0, cut)
      );

      remaining =
        remaining.slice(cut);

      firstChunk = false;
    }

    result.push(
      (firstChunk ? "" : " ") +
      remaining
    );
  }

  return result;
}


function formatUtcDate(date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}


function addDays(dateString, days) {
  const [year, month, day] =
    dateString.split("-").map(Number);

  /*
    日付だけの加算なのでUTC基準で処理して
    DSTや端末タイムゾーンの影響を避ける。
  */
  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day + days
      )
    );

  const y =
    date.getUTCFullYear();

  const m =
    String(date.getUTCMonth() + 1)
      .padStart(2, "0");

  const d =
    String(date.getUTCDate())
      .padStart(2, "0");

  return `${y}-${m}-${d}`;
}


function downloadTextFile(
  text,
  fileName,
  mimeType
) {
  const blob =
    new Blob(
      [text],
      { type: mimeType }
    );

  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(
    () => URL.revokeObjectURL(url),
    1000
  );
}


function safeFileName(value) {
  return (
    value
      .replace(/[\\/:*?"<>|]/g, "_")
      .trim() ||
    "calendar"
  );
}


function normalizeKey(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .toLowerCase();
}


function showStatus(
  message,
  isError = false
) {
  statusCard.classList.remove("hidden");
  statusMessage.textContent = message;

  statusMessage.classList.toggle(
    "error",
    isError
  );
}


function showExportMessage(
  message,
  isError = false
) {
  exportMessage.classList.remove("hidden");
  exportMessage.textContent = message;

  exportMessage.classList.toggle(
    "error",
    isError
  );
}


function hideExportMessage() {
  exportMessage.classList.add("hidden");
  exportMessage.textContent = "";
  exportMessage.classList.remove("error");
  bulkAllDayButton.classList.add("hidden");
}


function hideResults() {
  resultCard.classList.add("hidden");
  exportCard.classList.add("hidden");

  eventList.innerHTML = "";

  duplicateWarning.classList.add("hidden");
  auditWarning.classList.add("hidden");
}


function resetImage() {
  selectedFile = null;

  previewImage.removeAttribute("src");
  previewArea.classList.add("hidden");

  fileInfo.textContent = "";
  analyzeButton.disabled = true;
}


function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


function resizeImage(
  file,
  maxDimension,
  quality
) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () =>
      reject(
        new Error(
          "画像ファイルを読み込めませんでした。"
        )
      );

    reader.onload = () => {
      const image = new Image();

      image.onerror = () =>
        reject(
          new Error(
            "画像を開けませんでした。"
          )
        );

      image.onload = () => {
        let width = image.naturalWidth;
        let height = image.naturalHeight;

        const largest =
          Math.max(width, height);

        if (largest > maxDimension) {
          const scale =
            maxDimension / largest;

          width =
            Math.round(width * scale);

          height =
            Math.round(height * scale);
        }

        const canvas =
          document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const context =
          canvas.getContext(
            "2d",
            { alpha: false }
          );

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);

        context.drawImage(
          image,
          0,
          0,
          width,
          height
        );

        const mimeType = "image/jpeg";

        const dataUrl =
          canvas.toDataURL(
            mimeType,
            quality
          );

        resolve({
          dataUrl,
          mimeType
        });
      };

      image.src = String(reader.result);
    };

    reader.readAsDataURL(file);
  });
}


if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator
      .serviceWorker
      .register("service-worker.js")
      .catch(console.error);
  });
}
