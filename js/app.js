(function () {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const elements = {
    settingsGrid: $("#settings-grid"), settingsAdvanced: $("#settings-advanced"), settingsAdvancedGrid: $("#settings-advanced-grid"), settingsProfilePicker: $("#settings-profile-picker"), settingsRecommendationValues: $("#settings-recommendation-values"), customProfileNameField: $("#custom-profile-name-field"), customProfileName: $("#custom-profile-name"), settingsPanel: $("#settings-panel"), settingsShell: $("#settings-shell"), settingsBody: $("#settings-body"), settingsToggle: $("#settings-toggle"), settingsExampleToggle: $("#settings-example-toggle"), theme: $("#setting-theme"), fontSelect: $("#setting-editor-font"), fontSizeValue: $("#font-size-value"), scrollSync: $("#scroll-sync"), textColoring: $("#text-coloring"), boldCode: $("#bold-code"), addedBackground: $("#added-background"), plainEditBars: $("#plain-edit-bars"), finalBarsThrough: $("#final-bars-through"), previewTransposeMain: $("#preview-transpose-main"), previewTransposeMainDown: $("#preview-transpose-main-down"), previewTransposeMainUp: $("#preview-transpose-main-up"), previewSpellingMain: $("#preview-spelling-main"), previewTranspose: $("#preview-transpose"), previewTransposeDown: $("#preview-transpose-down"), previewTransposeUp: $("#preview-transpose-up"), previewSpelling: $("#preview-spelling"), previewDoubleSharp: $("#preview-double-sharp"), previewTheoretical: $("#preview-theoretical"), openScoreWindow: $("#open-score-window"),
    correctionCard: $(".correction-card"), correctionHeading: $(".correction-card .editor-heading"), correctionContext: $(".correction-context-bar"), outputHeading: $(".output-card .editor-heading"), outputSettingsToggle: $("#output-settings-toggle"), outputSettingsMobile: $("#output-settings-mobile"), previewSettingsToggle: $("#preview-settings-toggle"), previewSettingsMobile: $("#preview-settings-mobile"), removalControls: $(".removal-controls"), correction: $("#correction-text"), input: $("#input-text"), output: $("#output-text"), finalOutput: $("#final-output-text"), finalPreview: $("#final-score-preview"), committedOutput: $("#committed-output-text"),
    workspace: $(".workspace"), fontPanel: $(".font-panel"), displaySettingsShell: $("#display-settings-shell"), displaySettingsToggle: $("#display-settings-toggle"), correctionGuide: $(".correction-input-guide"), guideToggleAll: $("#guide-toggle-all"), correctionShell: $("#correction-shell"), inputShell: $("#input-shell"), outputShell: $("#output-shell"), finalOutputShell: $("#final-output-shell"),
    correctionLines: $("#correction-lines"), correctionModes: $("#correction-modes"), correctionGrid: $("#correction-grid"), inputLines: $("#input-lines"), outputLines: $("#output-lines"), finalOutputLines: $("#final-output-lines"), committedOutputLines: $("#committed-output-lines"),
    correctionHighlight: $("#correction-highlight"), inputHighlight: $("#input-highlight"), outputHighlight: $("#output-highlight"), finalOutputHighlight: $("#final-output-highlight"), committedOutputHighlight: $("#committed-output-highlight"),
    correctionCount: $("#correction-count"), correctionPosition: $("#correction-position"), correctionUndo: $("#correction-undo"), correctionRedo: $("#correction-redo"), correctionRefreshLine: $("#correction-refresh-line"), correctionRebuildAll: $("#correction-rebuild-all"), inputCount: $("#input-count"), outputCount: $("#output-count"), finalOutputCount: $("#final-output-count"), committedOutputCount: $("#committed-output-count"), committedOutputShell: $("#committed-output-shell"), committedOutputToggle: $("#committed-output-toggle"), openCommittedPreview: $("#open-committed-preview"), openRealtimeEditor: $("#open-realtime-editor"),
    removalTargets: $("#hyphen-removal-targets"), removalLinked: $("#hyphen-removal-linked"), lyricHyphenMode: $("#lyric-hyphen-mode"), removalSummary: $("#removal-summary"), measureCapacityWarning: $("#measure-capacity-warning"), measureCapacityWarningText: $("#measure-capacity-warning-text"), measureCapacityWarningOpen: $("#measure-capacity-warning-open"), measureCapacityWarningDismiss: $("#measure-capacity-warning-dismiss"),
    statusDetail: $("#status-detail"), toast: $("#toast"), helpDialog: $("#help-dialog"), helpExamplePreview: $("#help-example-preview"), historyDialog: $("#history-dialog"), historyList: $("#history-list"), historyPreviewPanel: $("#history-preview-panel"), historyPreviewTabs: $("#history-preview-tabs"), historyTextPreview: $("#history-text-preview"), historyPreview: $("#history-score-preview"), historyPreviewTitle: $("#history-preview-title"), historyPreviewDate: $("#history-preview-date"), historyRestore: $("#history-restore"), historyExportTest: $("#history-export-test"), historyImportTest: $("#history-import-test"), historyImportFile: $("#history-import-file"), historyDeleteAll: $("#history-delete-all"), keySettingsDialog: $("#key-settings-dialog"), keySettingsList: $("#key-settings-list"), keySettingsPreview: $("#key-settings-score-preview")
  };
  elements.displaySettingsToggle.insertAdjacentElement("afterend", elements.fontPanel);
  const correctionGuideItems = [...document.querySelectorAll(".guide-item")];
  const contextHelpButtons = [...document.querySelectorAll(".context-help-button")];
  let contextHelpHoverTimer;
  let openContextHelpButton = null;
  function closeContextHelp(button = openContextHelpButton) {
    if (!button) return;
    const popover = document.getElementById(button.getAttribute("aria-controls"));
    if (popover) popover.hidden = true;
    button.setAttribute("aria-expanded", "false");
    button.dataset.pinned = "false";
    if (openContextHelpButton === button) openContextHelpButton = null;
  }
  function showContextHelp(button, pinned = false) {
    if (openContextHelpButton && openContextHelpButton !== button) closeContextHelp(openContextHelpButton);
    const popover = document.getElementById(button.getAttribute("aria-controls"));
    if (!popover) return;
    popover.hidden = false;
    button.setAttribute("aria-expanded", "true");
    button.dataset.pinned = String(pinned);
    openContextHelpButton = button;
  }
  contextHelpButtons.forEach((button) => {
    const wrapper = button.closest(".context-help");
    wrapper.addEventListener("pointerenter", () => {
      clearTimeout(contextHelpHoverTimer);
      contextHelpHoverTimer = setTimeout(() => showContextHelp(button), 650);
    });
    wrapper.addEventListener("pointerleave", () => {
      clearTimeout(contextHelpHoverTimer);
      if (button.dataset.pinned !== "true") closeContextHelp(button);
    });
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const pinned = button.dataset.pinned === "true";
      if (pinned) closeContextHelp(button);
      else showContextHelp(button, true);
    });
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".context-help")) closeContextHelp();
    if (!elements.displaySettingsShell.classList.contains("display-collapsed")
        && !event.target.closest(".font-panel") && !event.target.closest("#display-settings-toggle")) setDisplaySettingsOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeContextHelp();
      if (!elements.displaySettingsShell.classList.contains("display-collapsed")) setDisplaySettingsOpen(false);
    }
  });
  function updateGuideToggleAll() {
    if (!elements.guideToggleAll) return;
    const allOpen = correctionGuideItems.length > 0 && correctionGuideItems.every((item) => item.open);
    elements.guideToggleAll.textContent = allOpen ? "すべてを閉じる▲" : "詳細を全て表示▼";
    elements.guideToggleAll.setAttribute("aria-expanded", String(allOpen));
  }
  elements.guideToggleAll?.addEventListener("click", () => {
    const open = !correctionGuideItems.every((item) => item.open);
    correctionGuideItems.forEach((item) => { item.open = open; });
    updateGuideToggleAll();
  });
  correctionGuideItems.forEach((item) => item.addEventListener("toggle", updateGuideToggleAll));
  updateGuideToggleAll();
  const HELP_EXAMPLE_PREVIEW_TEXT = [
    "[|][C]あいうえ[G]お　かき[|][Am][--]く[G][--]け[F][----]こ[|]",
    "[|][E]さしす[Am]せそ　たち[|][F][---]つて[D/F#][-]と[----][|]",
    "なに[|][Gsus4]ぬねの　は[|][G]ひふ[G#dim]へほ[|]"
  ].join("\n");
  if (window.ChordWikiPreview) window.ChordWikiPreview.renderInto(elements.helpExamplePreview, HELP_EXAMPLE_PREVIEW_TEXT);
  let toastTimer;
  let conversionTimer;
  let pendingCorrectionRefresh = false;
  let pendingCorrectionLineIndices = new Set();
  let pendingSourceLineIndices = new Set();
  let correctionSlotCounts = [];
  let authoredWhiteNoteCounts = [];
  let linkedLineIndex = -1;
  let linkedSlotIndex = -1;
  let correctionSymbolOffset = -1;
  let correctionCaretMode = "slot";
  let correctionUndoStack = [];
  let correctionRedoStack = [];
  let correctionHistoryValue = "";
  let restoringCorrectionHistory = false;
  let correctionCompositionValue = "";
  let pendingCompositionCommit = "";
  let pendingCompositionCommitAt = 0;
  let restoringPasteScroll = false;
  let scrollSyncEnabled = true;
  let mobileLinkedScrollPaused = false;
  let mobileProgrammaticScroll = false;
  let mobileLastLinkedLine = -1;
  let keyPreviewTargets = [];
  let settingsMode = "compact";
  let settingsExamplesOpen = false;
  let convertedOutput = "";
  let outputManuallyEdited = false;
  let outputHighlightValue = "";
  let outputAddedOffsets = new Set();
  let manualOutputLines = new Set();
  let sourceLineIds = [];
  let outputOverrides = {};
  let lastGeneratedOutput = "";
  let sourceLineIdSequence = 0;
  let lastAppliedCorrectionLines = [];
  let inferenceFallbackCorrectionLines = [];
  let correctionDisplayStates = [];
  let rowAdoptionModes = [];
  let lastConvertedInputLines = [];
  let removalLinked = true;
  let historyTimer;
  let crashTimer;
  let suppressActivity = false;
  let scorePreviewChannel = null;
  let selectedHistoryEntry = null;
  let historyPreviewMode = "score";
  let keySectionSettings = [];
  let scoreWindowRevision = Date.now();
  const FONT_STORAGE_KEY = "chordWikiBarFormatter.editorFont.v1";
  const FONT_SIZE_STORAGE_KEY = "chordWikiBarFormatter.editorFontSize.v1";
  const SCROLL_SYNC_STORAGE_KEY = "chordWikiBarFormatter.scrollSync.v1";
  const TEXT_COLORING_STORAGE_KEY = "chordWikiBarFormatter.textColoring.v1";
  const BOLD_CODE_STORAGE_KEY = "chordWikiBarFormatter.boldCode.v1";
  const ADDED_BACKGROUND_STORAGE_KEY = "chordWikiBarFormatter.addedBackground.v1";
  const REMOVAL_STORAGE_KEY = "chordWikiBarFormatter.hyphenRemovalTargets.v3";
  const LYRIC_HYPHEN_MODE_STORAGE_KEY = "chordWikiBarFormatter.lyricHyphenMode.v1";
  const LEGACY_HIDE_LYRIC_HYPHENS_STORAGE_KEY = "chordWikiBarFormatter.hideLyricHyphens.v1";
  const INPUT_STORAGE_KEY = "chordWikiBarFormatter.inputText.v1";
  const CORRECTION_STORAGE_KEY = "chordWikiBarFormatter.correctionText.v1";
  const ROW_ADOPTION_MODES_STORAGE_KEY = "chordWikiBarFormatter.rowAdoptionModes.v1";
  const SOURCE_LINE_IDS_STORAGE_KEY = "chordWikiBarFormatter.sourceLineIds.v1";
  const OUTPUT_OVERRIDES_STORAGE_KEY = "chordWikiBarFormatter.outputOverrides.v1";
  const CORRECTION_SYNTAX_VERSION_KEY = "chordWikiBarFormatter.correctionSyntaxVersion";
  const LAYOUT_STORAGE_KEY = "chordWikiBarFormatter.editorLayout.v3";
  const DISPLAY_PANEL_STORAGE_KEY = "chordWikiBarFormatter.displayPanelOpen.v4";
  const THEME_STORAGE_KEY = "chordWikiBarFormatter.theme.v1";
  const PLAIN_EDIT_BARS_STORAGE_KEY = "chordWikiBarFormatter.plainEditBars.v1";
  const FINAL_BARS_THROUGH_STORAGE_KEY = "chordWikiBarFormatter.finalBarsThrough.v1";
  const PREVIEW_TRANSPOSE_STORAGE_KEY = "chordWikiBarFormatter.previewTranspose.v2";
  const PREVIEW_SPELLING_STORAGE_KEY = "chordWikiBarFormatter.previewSpelling.v1";
  const PREVIEW_THEORETICAL_STORAGE_KEY = "chordWikiBarFormatter.previewTheoretical.v1";
  const PREVIEW_DOUBLE_SHARP_STORAGE_KEY = "chordWikiBarFormatter.previewDoubleSharp.v1";
  const PREVIEW_KEY_SECTIONS_STORAGE_KEY = "chordWikiBarFormatter.previewKeySections.v1";
  const COMMITTED_OUTPUT_STORAGE_KEY = "chordWikiBarFormatter.committedOutput.v1";
  const COMMITTED_DRAFT_STORAGE_KEY = "chordWikiBarFormatter.committedWindowDraft.v1";
  const SCORE_WINDOW_STATE_KEY = "chordWikiBarFormatter.scoreWindow.v1";
  const SCORE_WINDOW_CHANNEL = "chordWikiBarFormatter.scoreWindow.channel.v1";
  const REMOVAL_LINKED_STORAGE_KEY = "chordWikiBarFormatter.hyphenRemovalLinked.v1";
  const CURRENT_STATE_UPDATED_AT_KEY = "chordWikiBarFormatter.currentStateUpdatedAt.v1";
  const HISTORY_DELAY_MS = 1 * 60 * 1000;
  const CRASH_DELAY_MS = 5 * 60 * 1000;
  const historyStore = CBFHistoryStore.createStore(localStorage);
  try {
    if ("BroadcastChannel" in window) scorePreviewChannel = new BroadcastChannel(SCORE_WINDOW_CHANNEL);
  } catch (_error) {
    scorePreviewChannel = null;
  }
  const highlightByEditor = new Map([
    [elements.correction, elements.correctionHighlight],
    [elements.input, elements.inputHighlight],
    [elements.output, elements.outputHighlight],
    [elements.finalOutput, elements.finalOutputHighlight],
    [elements.committedOutput, elements.committedOutputHighlight]
  ]);
  const gutterByEditor = new Map([
    [elements.correction, elements.correctionLines],
    [elements.input, elements.inputLines],
    [elements.output, elements.outputLines],
    [elements.finalOutput, elements.finalOutputLines],
    [elements.committedOutput, elements.committedOutputLines]
  ]);
  elements.output.parentElement.classList.add("diff-visible");
  elements.correction.parentElement.classList.add("linked-position-visible");
  const INITIAL_INPUT = [
    "{title:変換テスト用サンプル}",
    "{subtitle:これは実在する楽曲ではありません}",
    "{comment:ChordWiki Bar Formatterの機能確認用ダミー歌詞です}",
    "{c:BPM=100　　4/4拍子　-：8分音符　＝：16分音符　>：8分音符アクセント　≧：16分音符アクセント　○：白玉}",
    "{key:C}",
    "[C]ChordPro形式の[G]テキストを貼ると　[Am]自動[G]で小節線[F]と長さ記号を追記します",
    "[E]原曲と異[Am]なる部分は　[F]行修正の[D/F#]数値を変えて",
    "[Gsus4]ハイフン数を[G]合わせます　[G#dim]",
    "",
    "[Am]＝(イコール)表示は*([G#aug]アスタリスク)で、[C/G]＞(アクセント)は[F#m7-5]^(キャレット)で",
    "[F]入力[G]できま[C]す",
    "[F]細かい部分は[G]手動修正が[E7]必[E7/G#]要[Am7]です🙏🏻",
    "[F]編集[G]お疲れ[Csus4]様で[C]す！（ありが[N.C.]とう！）"
  ].join("\n");
  const INITIAL_CORRECTION = ["", "", "", "", "", "88448", "3535", "844", "", "4444", "628", "4*s433a", "444^22"].join("\n");
  const INITIAL_SETTINGS = { measureCapacity: 8, hyphenUnit: 4, hyphenSpacing: 4, shortFractionPrepose: 1, longBeatLyricPlacement: 3, singleCharacterHyphens: 0, showContinuationChord: 0 };
  const CUSTOM_PROFILE_NAME_STORAGE_KEY = "chordWikiBarFormatter.customProfileName.v1";
  const RECOMMENDED_VALUES = {
    fourFour: [0, 2, 4, 8, 16, 24, 32],
    sixEight: [0, 2, 3, 6, 9, 12, 24],
    custom: [0, 2, 3, 4, 6, 8, 9, 12, 16, 24, 32]
  };
  const SETTING_GUIDES = {
    hyphenUnit: (defaultValue) => `コード直後に補うハイフン数です。デフォルト：${defaultValue}。`,
    measureCapacity: (defaultValue) => `1小節分に相当するハイフンの合計数です。デフォルト：${defaultValue}。`,
    hyphenSpacing: () => "長く連続するハイフンを、指定した数ごとに空白で区切ります。0では区切りません。",
    shortFractionPrepose: () => "コード間の長さに端数ができたとき、歌詞を1文字手前へ移動します。する：歌詞を前へ寄せる（デフォルト）、しない：歌詞位置を変えない。",
    longBeatLyricPlacement: () => "行修正で長い拍を指定したときの歌詞位置です。前に分ける：歌詞を最初へ、前後に分ける：最初と最後へ、均等に分ける：すべての長さ記号へ、後に分ける：歌詞を最後へ配置します。",
    singleCharacterHyphens: () => "1文字だけで完結する小節のハイフンです。省略する：歌詞だけを表示（デフォルト）、残す：拍の長さを表示。",
    showContinuationChord: () => "コードがない小節に直前のコードを引き継ぎます。する：直前のコードを表示、しない：小節線のみ（デフォルト）。"
  };
  function customProfileName() { return localStorage.getItem(CUSTOM_PROFILE_NAME_STORAGE_KEY)?.trim() || "カスタム"; }
  function settingsProfileLabel(profile) {
    return profile === "custom" ? customProfileName() : profile === "sixEight" ? "6/8拍子" : "4/4拍子";
  }
  function recommendedValues() { return RECOMMENDED_VALUES[CBFSettings.activeProfile()] || RECOMMENDED_VALUES.custom; }
  const editorFonts = [
    { value: "browser", label: "ブラウザ標準", stack: 'sans-serif' },
    { value: "system-ui", label: "system-ui", stack: 'system-ui, sans-serif' },
    { value: "meiryo", label: "メイリオ / Meiryo", stack: 'Meiryo, sans-serif' },
    { value: "biz-udp", label: "BIZ UDPゴシック", stack: '"BIZ UDPGothic", sans-serif' },
    { value: "ms-gothic", label: "MS Gothic", stack: '"MS Gothic", monospace' },
    { value: "segoe-ui", label: "Segoe UI", stack: '"Segoe UI", sans-serif' },
    { value: "verdana", label: "Verdana", stack: 'Verdana, sans-serif' },
    { value: "consolas", label: "Consolas", stack: 'Consolas, monospace' },
    { value: "courier-new", label: "Courier New", stack: '"Courier New", monospace' }
  ];

  function applyTheme(value, save = true) {
    const theme = value === "dark-gray" ? "dark" : ["dark", "light"].includes(value) ? value : "light";
    document.documentElement.dataset.theme = theme;
    elements.theme.value = theme;
    if (save) localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  function applyEditorFont(value) {
    const font = editorFonts.find((item) => item.value === value) || editorFonts[0];
    document.documentElement.style.setProperty("--editor-font", font.stack);
    localStorage.setItem(FONT_STORAGE_KEY, font.value);
  }
  function applyEditorFontSize(value) {
    const size = Math.max(10, Math.min(24, Number(value) || 14));
    document.documentElement.style.setProperty("--editor-font-size", `${size}px`);
    elements.fontSizeValue.value = String(size);
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, String(size));
  }
  function cycleEditorFont(direction) {
    const lastIndex = elements.fontSelect.options.length - 1;
    const nextIndex = Math.max(0, Math.min(lastIndex, elements.fontSelect.selectedIndex + direction));
    if (nextIndex === elements.fontSelect.selectedIndex) return;
    elements.fontSelect.selectedIndex = nextIndex;
    applyEditorFont(elements.fontSelect.value);
    updateFontCycleButtons();
  }
  function updateFontCycleButtons() {
    $("#font-previous").disabled = elements.fontSelect.selectedIndex <= 0;
    $("#font-next").disabled = elements.fontSelect.selectedIndex >= elements.fontSelect.options.length - 1;
  }
  function syncPreviewControlMirrors() {
    elements.previewTransposeMain.value = elements.previewTranspose.value;
    elements.previewSpellingMain.value = elements.previewSpelling.value;
  }
  function updatePreviewTransposeButtons() {
    const amount = Number(elements.previewTranspose.value) || 0;
    elements.previewTransposeDown.disabled = amount <= -12;
    elements.previewTransposeUp.disabled = amount >= 12;
    elements.previewTransposeMainDown.disabled = amount <= -12;
    elements.previewTransposeMainUp.disabled = amount >= 12;
  }
  function stepPreviewTranspose(direction, focusButton) {
    const amount = Math.max(-12, Math.min(12, (Number(elements.previewTranspose.value) || 0) + direction));
    elements.previewTranspose.value = String(amount);
    elements.previewTranspose.dispatchEvent(new Event("change", { bubbles: true }));
    focusButton.focus();
  }

  function renderSettings(values) {
    elements.settingsGrid.textContent = "";
    elements.settingsAdvancedGrid.textContent = "";
    const basicKeys = new Set(["measureCapacity", "hyphenUnit", "hyphenSpacing"]);
    const standardValues = new Set([...RECOMMENDED_VALUES.fourFour, ...RECOMMENDED_VALUES.sixEight]);
    // Keep the visible order aligned with the conversion priority:
    // measure/grid -> remainder placement -> long-beat lyric placement -> chord carry-over -> single lyric.
    const settingOrder = ["measureCapacity", "hyphenUnit", "hyphenSpacing", "shortFractionPrepose", "longBeatLyricPlacement", "showContinuationChord", "singleCharacterHyphens"];
    const orderedDefinitions = settingOrder
      .map((key) => CBFSettings.definitions.find((definition) => definition.key === key))
      .filter(Boolean);
    orderedDefinitions.forEach((definition, index) => {
      const field = document.createElement("div");
      field.className = `setting-field${definition.choices ? " setting-field-choice" : ""}`;
      const profileDefault = CBFSettings.profileDefaults(CBFSettings.activeProfile())[definition.key];
      const candidates = recommendedValues().filter((value) => value >= definition.min && value <= definition.max);
      const control = definition.choices
        ? `<div class="setting-value-stepper"><select id="setting-${definition.key}" name="${definition.key}" aria-describedby="help-${definition.key} error-${definition.key}">${definition.choices.map((choice) => `<option value="${choice.value}"${Number(values[definition.key]) === choice.value ? " selected" : ""}>${choice.label}</option>`).join("")}</select></div>`
        : `<select id="setting-${definition.key}" name="${definition.key}" aria-describedby="help-${definition.key} error-${definition.key}">${Array.from({ length: definition.max - definition.min + 1 }, (_, offset) => definition.min + offset).map((value) => `<option value="${value}" class="${standardValues.has(value) ? "setting-option-common" : "setting-option-rare"}"${Number(values[definition.key]) === value ? " selected" : ""}>${value}</option>`).join("")}</select>`;
      const recommendations = definition.choices ? "" : `<datalist id="recommended-${definition.key}">${candidates.map((value) => `<option value="${value}"></option>`).join("")}</datalist>`;
      const bounds = definition.choices ? definition.bounds : `${definition.min}～${definition.max}、デフォルト：${profileDefault}`;
      const guide = SETTING_GUIDES[definition.key]?.(profileDefault) || definition.prompt;
      const guideMarkup = guide.replace(/。(?!$)/gu, "。<br>");
      const exampleMarkup = definition.examples.map((example) => {
        if (example.endsWith("：")) return `<span class="example-subhead">${example}</span>`;
        const arrowIndex = example.indexOf(" → ");
        if (arrowIndex < 0) return `<span>${example}</span>`;
        const label = example.slice(0, arrowIndex);
        const result = example.slice(arrowIndex + 3);
        return `<span class="setting-example-row"><span class="setting-example-label">${label}</span><span class="setting-example-result">→ ${result}</span></span>`;
      }).join("");
      const exampleLabelWidth = Math.max(1, ...definition.examples.map((example) => {
        const arrowIndex = example.indexOf(" → ");
        return arrowIndex < 0 ? 0 : [...example.slice(0, arrowIndex)].length;
      })) + 1;
      field.innerHTML = `<div class="setting-core"><label for="setting-${definition.key}" title="${definition.prompt}"><span class="setting-number">${index + 1}.</span>${definition.label}</label>
          ${control}${recommendations}
          <small id="help-${definition.key}" class="setting-bounds">（${bounds}）</small>
          <small id="error-${definition.key}" class="setting-error" aria-live="polite"></small>
          <span class="setting-help context-help"><button class="context-help-button setting-help-button" type="button" aria-label="${definition.label}の説明" aria-expanded="false" aria-controls="help-popover-${definition.key}">?</button><span id="help-popover-${definition.key}" class="context-help-popover" role="tooltip" hidden><strong class="context-help-title">${definition.label}</strong>${guide}</span></span>
        </div>
        <div class="setting-example" style="--setting-example-label-width:${exampleLabelWidth}em"><span class="example-description">${guideMarkup}</span>${exampleMarkup}</div>`;
      (basicKeys.has(definition.key) ? elements.settingsGrid : elements.settingsAdvancedGrid).append(field);
    });
  }

  function updateSettingsProfileUI() {
    const profile = CBFSettings.activeProfile();
    elements.settingsProfilePicker?.querySelectorAll("[data-settings-profile]").forEach((button) => {
      if (button.dataset.settingsProfile === "custom") button.textContent = customProfileName();
      button.setAttribute("aria-pressed", String(button.dataset.settingsProfile === profile));
    });
    if (elements.settingsRecommendationValues) elements.settingsRecommendationValues.textContent = recommendedValues().join(", ");
    elements.customProfileNameField.hidden = profile !== "custom";
    elements.customProfileName.value = localStorage.getItem(CUSTOM_PROFILE_NAME_STORAGE_KEY) || "";
  }

  function switchSettingsProfile(profile) {
    const current = validatedSettings();
    const seedValues = current.valid ? current.values : CBFSettings.load();
    const values = CBFSettings.setActiveProfile(profile, seedValues);
    renderSettings(values);
    updateSettingsProfileUI();
    if (removalLinked) {
      elements.removalTargets.value = String(values.hyphenUnit);
      localStorage.setItem(REMOVAL_STORAGE_KEY, elements.removalTargets.value);
    }
    convert({ refreshCorrections: true });
    markActivity();
    notify(`${settingsProfileLabel(profile)}の設定へ切り替えました。`);
  }

  function rawSettings() { return Object.fromEntries(CBFSettings.definitions.map((item) => [item.key, $(`#setting-${item.key}`).value])); }
  function validatedSettings({ persist = true } = {}) {
    const result = CBFSettings.validate(rawSettings());
    CBFSettings.definitions.forEach((item) => {
      const input = $(`#setting-${item.key}`);
      input.setAttribute("aria-invalid", String(Boolean(result.errors[item.key])));
      $(`#error-${item.key}`).textContent = result.errors[item.key] || "";
    });
    if (result.valid && persist) CBFSettings.save(result.values);
    return result;
  }
  function updateMeasureCapacityWarning(values = null) {
    if (!values || !elements.input.value) {
      elements.measureCapacityWarning.hidden = true;
      elements.measureCapacityWarningText.textContent = "";
      syncResultRowAlignment();
      return;
    }
    const measureMismatch = CBFConverter.analyzeAuthoredMeasureCapacity(elements.input.value, values.measureCapacity);
    const formatting = CBFConverter.analyzeAuthoredFormatting(elements.input.value, values);
    const mismatch = measureMismatch || { detected: 0, percentage: 0 };
    const hyphenUnitMismatch = formatting.hyphenUnit && formatting.hyphenUnit.detected !== Number(values.hyphenUnit);
    const hyphenSpacingMismatch = formatting.hyphenSpacing && formatting.hyphenSpacing.detected !== Number(values.hyphenSpacing);
    if (!measureMismatch && !hyphenUnitMismatch && !hyphenSpacingMismatch) {
      elements.measureCapacityWarning.hidden = true;
      elements.measureCapacityWarningText.textContent = "";
      syncResultRowAlignment();
      return;
    }
    const useSixEightProfile = [3, 6, 9, 12].includes(mismatch.detected);
    elements.measureCapacityWarningText.textContent = measureMismatch && useSixEightProfile
      ? `※変換前で使われている1小節のハイフン数が、初期設定と異なるようです。判定できた小節の約${mismatch.percentage}%が「1小節${mismatch.detected}ハイフン」です。6/8拍子タブへ切り替え、合計${mismatch.detected}を適用しますか？`
      : measureMismatch
        ? `※変換前で使われている1小節のハイフン数が、初期設定と異なるようです。判定できた小節の約${mismatch.percentage}%が「1小節${mismatch.detected}ハイフン」です。初期設定を${mismatch.detected}に変更しますか？`
        : "※変換前の譜面を解析した結果、現在の初期設定と異なる書式が検出されました。設定を変更しますか？";
    const formattingDetails = [];
    const detail = (label, result, configured) => {
      const detected = result?.detected ?? Number(configured);
      const percentage = result ? `（${result.percentage}%）` : "（現状と同じ）";
      const same = result && detected === Number(configured) ? "（現状と同じ）" : "";
      return `${label}：${detected}ハイフン${percentage}${same}`;
    };
    formattingDetails.push(measureMismatch
      ? `1小節：${mismatch.detected}ハイフン（${mismatch.percentage}%）`
      : `1小節：${Number(values.measureCapacity)}ハイフン（現状と同じ）`);
    formattingDetails.push(detail("コード直後", formatting.hyphenUnit, values.hyphenUnit));
    formattingDetails.push(detail("区切り間隔", formatting.hyphenSpacing, values.hyphenSpacing));
    if (formattingDetails.length) {
      const actionText = measureMismatch
        ? useSixEightProfile
          ? `6/8拍子タブへ切り替え、合計${mismatch.detected}を適用しますか？`
          : `初期設定を${mismatch.detected}に変更しますか？`
        : "検出した書式を初期設定へ反映しますか？";
      elements.measureCapacityWarningText.textContent = `※変換前の譜面を解析した結果、現在の初期設定と異なる書式が検出されました。\n\n${formattingDetails.map((detail, index) => `${index + 1}: ${detail}`).join("\n")}\n\n${actionText}`;
    }
    elements.measureCapacityWarningOpen.dataset.detected = measureMismatch ? String(mismatch.detected) : "";
    elements.measureCapacityWarningOpen.dataset.formatting = JSON.stringify({
      hyphenUnit: formatting.hyphenUnit?.detected || null,
      hyphenSpacing: formatting.hyphenSpacing?.detected || null
    });
    elements.measureCapacityWarningOpen.dataset.profile = useSixEightProfile ? "sixEight" : "";
    elements.measureCapacityWarningOpen.textContent = formattingDetails.length > 1
      ? "設定を一括適用"
      : !measureMismatch
        ? "設定を変更"
      : useSixEightProfile
        ? `6/8・${mismatch.detected}を適用`
        : `${mismatch.detected}に変更`;
    elements.measureCapacityWarning.hidden = false;
    syncResultRowAlignment();
  }
  function lineCount(text) { return text.length ? text.split(/\r\n|\r|\n/).length : 0; }
  function updateCount(textarea, target) { target.textContent = `${textarea.value.length}文字 / ${lineCount(textarea.value)}行`; }
  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }
  function colorizeChunk(text, chunkStart, className, activeOffset, addedOffsets) {
    let content = "";
    let plain = "";
    const flushPlain = () => { if (plain) { content += escapeHtml(plain); plain = ""; } };
    for (let index = 0; index < text.length; index += 1) {
      const absoluteIndex = chunkStart + index;
      const character = text[index];
      if (absoluteIndex === activeOffset && !/[\r\n]/.test(character)) {
        flushPlain();
        content += `<span class="active-character">${escapeHtml(character)}</span>`;
      } else if (addedOffsets.has(absoluteIndex)) {
        flushPlain();
        let addedText = character;
        while (index + 1 < text.length && addedOffsets.has(chunkStart + index + 1) && chunkStart + index + 1 !== activeOffset) {
          index += 1;
          addedText += text[index];
        }
        content += `<span class="generated-token">${escapeHtml(addedText)}</span>`;
      } else {
        plain += character;
      }
    }
    flushPlain();
    return className ? `<span class="${className}">${content}</span>` : content;
  }
  function colorizeText(text, activeOffset = -1, addedOffsets = new Set(), linkedTokenOffset = -1) {
    const tokenPattern = /(\{[^{}\r\n]*\}|\[[^\[\]\r\n]*\]|\|)/g;
    let html = "";
    let lastIndex = 0;
    for (const match of text.matchAll(tokenPattern)) {
      html += colorizeChunk(text.slice(lastIndex, match.index), lastIndex, "", activeOffset, addedOffsets);
      const token = match[0];
      let className = "";
      if (token === "|") className = "syntax-bracket";
      else if (/^\{\s*key\s*:/i.test(token)) className = "syntax-key";
      else if (token.startsWith("{")) className = "syntax-directive";
      else {
        const inner = token.slice(1, -1);
        className = inner !== "|" && !/^[\s\-=>≧○]+$/.test(inner) ? "syntax-chord" : "syntax-bracket";
      }
      if (match.index === linkedTokenOffset) className = `${className} linked-code-target`.trim();
      html += colorizeChunk(token, match.index, className, activeOffset, addedOffsets);
      lastIndex = match.index + token.length;
    }
    return html + colorizeChunk(text.slice(lastIndex), lastIndex, "", activeOffset, addedOffsets);
  }
  function syncHighlightScroll(textarea) {
    const highlight = highlightByEditor.get(textarea);
    if (highlight) highlight.style.transform = `translate(${-textarea.scrollLeft}px, ${-textarea.scrollTop}px)`;
  }
  function activeLineIndex(textarea) {
    return textarea.value.slice(0, textarea.selectionStart).split(/\r\n|\r|\n/).length - 1;
  }
  function lineColumnAtSelection(textarea) {
    const before = textarea.value.slice(0, textarea.selectionStart);
    return before.length - Math.max(before.lastIndexOf("\n") + 1, before.lastIndexOf("\r") + 1);
  }
  function correctionSlots(line) {
    return [...line].map((character, index) => /^[0-9a-i@]$/i.test(character) ? { character, index } : null).filter(Boolean);
  }
  function slotIndexAt(textarea, lineIndex, column) {
    const line = textarea.value.split(/\r\n|\r|\n/)[lineIndex] || "";
    if (textarea === elements.correction) {
      const slots = correctionSlots(line);
      if (!slots.length) return -1;
      const found = slots.findIndex((slot) => slot.index >= column);
      return found < 0 ? slots.length - 1 : found;
    }
    const targets = [];
    for (const match of line.matchAll(/\[([^\[\]\r\n]+)\]/g)) {
      if (match[1] === "○" || CBFConverter.isChordSymbol(match[1])) targets.push({ start: match.index, end: match.index + match[0].length });
    }
    if (!targets.length) return -1;
    const containing = targets.findIndex((target) => column >= target.start && column <= target.end);
    if (containing >= 0) return containing;
    let previous = -1;
    targets.forEach((target, index) => { if (target.end <= column) previous = index; });
    return previous >= 0 ? previous : 0;
  }
  function correctionOffsetAt(lineIndex, slotIndex) {
    if (lineIndex < 0 || slotIndex < 0) return -1;
    const lines = elements.correction.value.split(/\r\n|\r|\n/);
    const line = lines[lineIndex] || "";
    const slot = correctionSlots(line)[slotIndex];
    if (!slot) return -1;
    let offset = 0;
    for (let index = 0; index < lineIndex; index += 1) offset += lines[index].length + 1;
    return offset + slot.index;
  }
  function outputCodeOffsetAt(lineIndex, slotIndex) {
    if (lineIndex < 0 || slotIndex < 0) return -1;
    const lines = elements.output.value.split(/\r\n|\r|\n/);
    const line = lines[lineIndex] || "";
    const targets = [...line.matchAll(/\[([^\[\]\r\n]+)\]/g)]
      .filter((match) => match[1] === "○" || CBFConverter.isChordSymbol(match[1]));
    const target = targets[slotIndex];
    if (!target) return -1;
    let offset = 0;
    for (let index = 0; index < lineIndex; index += 1) offset += lines[index].length + 1;
    return offset + target.index;
  }
  function correctionLineOffset(lineIndex) {
    const lines = elements.correction.value.split(/\r\n|\r|\n/);
    let offset = 0;
    for (let index = 0; index < Math.max(0, lineIndex); index += 1) offset += (lines[index] || "").length + 1;
    return offset;
  }
  function keepCorrectionLineInView(lineIndex) {
    if (window.matchMedia("(max-width: 699px)").matches) return;
    // A correction paste may update the active slot as part of its input event.
    // Keep that bookkeeping, but do not let it move the viewport captured at
    // the start of the paste.
    if (restoringPasteScroll) return;
    const computed = getComputedStyle(elements.correction);
    const lineHeight = Number.parseFloat(computed.lineHeight) || 23;
    const nextScrollTop = CBFCorrectionInput.scrollTopForLineMargin(
      elements.correction.scrollTop,
      elements.correction.clientHeight,
      lineHeight,
      lineIndex,
      lineCount(elements.correction.value),
      1,
      Number.parseFloat(computed.paddingTop) || 0,
      2
    );
    if (nextScrollTop !== elements.correction.scrollTop) elements.correction.scrollTop = nextScrollTop;
  }
  function keepMobileLinkedLineInView(lineIndex) {
    if (!window.matchMedia("(max-width: 699px)").matches || restoringPasteScroll || lineIndex < 0) return;
    const lineChanged = lineIndex !== mobileLastLinkedLine;
    mobileLastLinkedLine = lineIndex;
    if (lineChanged) mobileLinkedScrollPaused = false;
    if (mobileLinkedScrollPaused) return;
    const centerLine = (textarea) => {
      const computed = getComputedStyle(textarea);
      const lineHeight = Number.parseFloat(computed.lineHeight) || 23;
      const paddingTop = Number.parseFloat(computed.paddingTop) || 0;
      const lineTop = paddingTop + lineIndex * lineHeight;
      const safeTop = textarea.scrollTop + lineHeight;
      const safeBottom = textarea.scrollTop + textarea.clientHeight - lineHeight * 2;
      if (lineTop >= safeTop && lineTop <= safeBottom) return;
      textarea.scrollTop = Math.max(0, lineTop - (textarea.clientHeight - lineHeight) / 2);
    };
    mobileProgrammaticScroll = true;
    centerLine(elements.correction);
    centerLine(elements.output);
    requestAnimationFrame(() => { mobileProgrammaticScroll = false; });
  }
  function selectCorrectionSlot(lineIndex, slotIndex) {
    const lines = elements.correction.value.split(/\r\n|\r|\n/);
    const resolvedLine = Math.max(0, Math.min(lines.length - 1, lineIndex));
    const selection = CBFCorrectionInput.slotSelection(lines[resolvedLine] || "", slotIndex);
    linkedLineIndex = resolvedLine;
    linkedSlotIndex = selection?.index ?? -1;
    correctionCaretMode = "slot";
    const lineOffset = correctionLineOffset(resolvedLine);
    const start = selection ? lineOffset + selection.start : lineOffset;
    const end = selection ? lineOffset + selection.end : lineOffset;
    // Symbol input (^, *, s, x, |) uses this offset.  Keep it aligned with
    // the visible slot selected by arrows, clicks, or completed beat input.
    correctionSymbolOffset = start;
    if (elements.correction.selectionStart !== start || elements.correction.selectionEnd !== end) {
      elements.correction.setSelectionRange(start, end);
    }
    keepCorrectionLineInView(resolvedLine);
    applyLinkedPosition();
  }
  function moveCorrectionSlot(key) {
    const lines = elements.correction.value.split(/\r\n|\r|\n/);
    let lineIndex = linkedLineIndex >= 0 ? linkedLineIndex : activeLineIndex(elements.correction);
    let slotIndex = linkedSlotIndex;
    const slots = () => correctionSlots(lines[lineIndex] || "");
    if (key === "ArrowLeft") {
      if (slotIndex > 0) slotIndex -= 1;
      else if (lineIndex > 0) {
        lineIndex -= 1;
        slotIndex = Math.max(0, correctionSlots(lines[lineIndex] || "").length - 1);
      }
    } else if (key === "ArrowRight") {
      if (slotIndex >= 0 && slotIndex < slots().length - 1) slotIndex += 1;
      else if (lineIndex < lines.length - 1) {
        lineIndex += 1;
        slotIndex = 0;
      }
    } else if (key === "ArrowUp") {
      lineIndex = Math.max(0, lineIndex - 1);
    } else if (key === "ArrowDown") {
      lineIndex = Math.min(lines.length - 1, lineIndex + 1);
    } else if (key === "Home") {
      slotIndex = 0;
    } else if (key === "End") {
      slotIndex = Math.max(0, slots().length - 1);
    }
    selectCorrectionSlot(lineIndex, slotIndex);
  }
  function correctionTargetAt(lineIndex, slotIndex) {
    const sourceLine = elements.input.value.split(/\r\n|\r|\n/)[lineIndex] || "";
    const targets = [];
    for (const match of sourceLine.matchAll(/\[([^\[\]\r\n]+)\]/g)) {
      if (match[1] === "○") targets.push("[○]");
      else if (CBFConverter.isChordSymbol(match[1])) targets.push(`[${match[1]}]`);
    }
    return targets[slotIndex] || "対象コードなし";
  }
  function correctionBeatLabel(character) {
    if (character === "@") return "白丸";
    if (/^[0-9]$/.test(character)) return `ハイフン換算${Number(character)}`;
    if (/^[a-g]$/i.test(character)) return `ハイフン換算${character.toLowerCase().charCodeAt(0) - 87}`;
    if (character.toLowerCase() === "h") return "ハイフン換算24";
    if (character.toLowerCase() === "i") return "ハイフン換算32";
    return "長さ未入力";
  }
  function updateCorrectionPosition() {
    if (linkedLineIndex < 0) return;
    const line = elements.correction.value.split(/\r\n|\r|\n/)[linkedLineIndex] || "";
    const slots = correctionSlots(line);
    if (!slots.length) {
      elements.correctionPosition.textContent = `${linkedLineIndex + 1}行目｜修正対象なし`;
      return;
    }
    const resolvedIndex = Math.max(0, Math.min(slots.length - 1, linkedSlotIndex));
    const slot = slots[resolvedIndex];
    elements.correctionPosition.textContent = `${linkedLineIndex + 1}行目｜${resolvedIndex + 1}番目 ${correctionTargetAt(linkedLineIndex, resolvedIndex)}｜${slot.character}＝${correctionBeatLabel(slot.character)}`;
  }
  function applyLinkedPosition() {
    gutterByEditor.forEach((gutter) => {
      gutter.querySelectorAll("span").forEach((line, index) => line.classList.toggle("active-line", index === linkedLineIndex));
    });
    elements.correctionGrid?.querySelectorAll(".correction-grid-row").forEach((row, index) => {
      row.classList.toggle("active-row", index === linkedLineIndex);
      row.classList.toggle("before-active-row", index + 1 === linkedLineIndex);
    });
    highlightByEditor.forEach((highlight, textarea) => {
      const visible = linkedLineIndex >= 0 && linkedLineIndex < Math.max(1, lineCount(textarea.value));
      highlight.classList.toggle("active-line-visible", visible);
      if (!visible) return;
      const computed = getComputedStyle(textarea);
      const lineHeight = Number.parseFloat(computed.lineHeight) || (Number.parseFloat(computed.fontSize) || 16) * 1.65;
      const paddingTop = Number.parseFloat(computed.paddingTop) || 0;
      highlight.style.setProperty("--active-line-top", `${paddingTop + linkedLineIndex * lineHeight}px`);
      highlight.style.setProperty("--active-line-height", `${lineHeight}px`);
    });
    updateEditorHighlight(elements.correction, correctionOffsetAt(linkedLineIndex, linkedSlotIndex));
    updateEditorHighlight(elements.output, -1, outputCodeOffsetAt(linkedLineIndex, linkedSlotIndex));
    updateCorrectionPosition();
  }
  function updateActivePosition(textarea, _gutter, activate = false, eventType = "") {
    if (activate) {
      linkedLineIndex = activeLineIndex(textarea);
      linkedSlotIndex = slotIndexAt(textarea, linkedLineIndex, lineColumnAtSelection(textarea));
      if (textarea === elements.correction && textarea.selectionEnd - textarea.selectionStart <= 1) {
        if (eventType === "click" || eventType === "focus") {
          correctionSymbolOffset = textarea.selectionStart;
          correctionCaretMode = "slot";
        }
        const correctionLine = textarea.value.split(/\r\n|\r|\n/)[linkedLineIndex] || "";
        const correctionColumn = lineColumnAtSelection(textarea);
        const awaitingWhiteNoteDuration = textarea.selectionStart === textarea.selectionEnd
          && CBFCorrectionInput.needsInsertedWhiteNoteDuration(
            correctionLine,
            correctionColumn,
            correctionSlotCounts[linkedLineIndex] || 0,
            authoredWhiteNoteCounts[linkedLineIndex] || 0
          );
        const selection = awaitingWhiteNoteDuration || correctionCaretMode === "boundary" ? null : CBFCorrectionInput.slotSelection(correctionLine, linkedSlotIndex);
        if (selection) {
          const lineOffset = correctionLineOffset(linkedLineIndex);
          const start = lineOffset + selection.start;
          const end = lineOffset + selection.end;
          if (textarea.selectionStart !== start || textarea.selectionEnd !== end) textarea.setSelectionRange(start, end);
          linkedSlotIndex = selection.index;
        }
      }
    }
    if (activate && textarea === elements.correction) keepCorrectionLineInView(linkedLineIndex);
    applyLinkedPosition();
    if (activate) keepMobileLinkedLineInView(linkedLineIndex);
  }
  function updateEditorHighlight(
    textarea,
    activeOffset = textarea === elements.correction ? correctionOffsetAt(linkedLineIndex, linkedSlotIndex) : -1,
    linkedTokenOffset = textarea === elements.output ? outputCodeOffsetAt(linkedLineIndex, linkedSlotIndex) : -1
  ) {
    const highlight = highlightByEditor.get(textarea);
    if (!highlight) return;
    const addedOffsets = textarea === elements.output && elements.addedBackground.checked
      ? outputAddedOffsets
      : new Set();
    highlight.innerHTML = colorizeText(textarea.value, activeOffset, addedOffsets, linkedTokenOffset);
    syncHighlightScroll(textarea);
  }
  function syncCorrectionScrollbarWidth() {
    const textarea = elements.correction;
    const shell = elements.correctionShell;
    if (!textarea || !shell) return;
    const scrollbarWidth = Math.max(0, textarea.offsetWidth - textarea.clientWidth);
    shell.style.setProperty("--correction-scrollbar-width", `${scrollbarWidth}px`);
  }
  function syncCorrectionModeScroll(scrollTop = elements.correction?.scrollTop || 0) {
    if (!elements.correctionModes) return;
    elements.correctionModes.style.setProperty("--correction-mode-scroll-top", `${scrollTop}px`);
  }
  function updateLineNumbers(textarea, gutter) {
    const count = Math.max(1, lineCount(textarea.value));
    gutter.innerHTML = Array.from({ length: count }, (_, index) => `<span>${index + 1}</span>`).join("");
    gutter.scrollTop = textarea.scrollTop;
    if (textarea === elements.correction && elements.correctionGrid) {
      syncCorrectionScrollbarWidth();
      elements.correctionGrid.innerHTML = Array.from({ length: count }, () => '<span></span><span></span>').map((cells) => `<div class="correction-grid-row">${cells}</div>`).join("");
      elements.correctionGrid.scrollTop = textarea.scrollTop;
    }
    updateEditorHighlight(textarea);
    applyLinkedPosition();
  }
  const ROW_MODE_LABELS = { auto: "自動", edit: "修正", source: "固定", recovered: "固定", fixed: "固定" };
  function createSourceLineId() {
    if (globalThis.crypto?.randomUUID) return `source-${globalThis.crypto.randomUUID()}`;
    sourceLineIdSequence += 1;
    return `source-${Date.now().toString(36)}-${sourceLineIdSequence.toString(36)}`;
  }
  function normalizeSourceLineIds() {
    sourceLineIds = CBFOutputOverrides.normalizeIds(
      elements.input.value.split(/\r\n|\r|\n/).length,
      sourceLineIds,
      createSourceLineId
    );
  }
  function persistOutputLayer() {
    localStorage.setItem(SOURCE_LINE_IDS_STORAGE_KEY, JSON.stringify(sourceLineIds));
    localStorage.setItem(OUTPUT_OVERRIDES_STORAGE_KEY, JSON.stringify(outputOverrides));
  }
  function syncManualOutputLinesFromOverrides() {
    manualOutputLines = CBFOutputOverrides.overriddenIndices(sourceLineIds, outputOverrides);
    outputManuallyEdited = manualOutputLines.size > 0;
  }
  function removeOutputOverride(index) {
    const id = sourceLineIds[index];
    if (id && outputOverrides[id]) delete outputOverrides[id];
    syncManualOutputLinesFromOverrides();
    persistOutputLayer();
  }
  function persistRowAdoptionModes() {
    while (rowAdoptionModes.length && !rowAdoptionModes[rowAdoptionModes.length - 1]) rowAdoptionModes.pop();
    localStorage.setItem(ROW_ADOPTION_MODES_STORAGE_KEY, JSON.stringify(rowAdoptionModes));
  }
  function effectiveRowMode(index) {
    return rowAdoptionModes[index] || correctionDisplayStates[index] || "auto";
  }
  function updateCorrectionModes() {
    if (!elements.correctionModes) return;
    const count = Math.max(1, lineCount(elements.correction.value));
    elements.correctionModes.innerHTML = Array.from({ length: count }, (_, index) => {
      const state = correctionDisplayStates[index] || "none";
      if (state === "none" && !(correctionSlotCounts[index] > 0)) return '<span class="correction-mode-row" aria-hidden="true"></span>';
      const mode = effectiveRowMode(index);
      const directlyEdited = mode === "edit" && manualOutputLines.has(index);
      const fixed = directlyEdited || mode === "source" || mode === "recovered" || mode === "fixed";
      const displayMode = fixed ? "fixed" : mode;
      const label = fixed ? "固定" : ROW_MODE_LABELS[mode] || ROW_MODE_LABELS.auto;
      const next = mode === "auto" ? "修正" : mode === "edit" ? "固定" : mode === "source" ? "自動" : "修正";
      const detail = directlyEdited ? "変換後を直接編集した内容を保持中。行修正を変更すると修正へ切り替わります" : mode === "recovered" ? "復元した行修正値を表示中。変更するまで変換後を保持します" : mode === "fixed" ? "非対応の表記を保持中。行修正では上書きしません" : `${label}を採用中`;
      return `<button type="button" class="correction-mode-row" data-line="${index}" data-mode="${displayMode}" aria-label="${index + 1}行目：${detail}。押すと${next}へ切替" title="${detail}（押すと${next}）">${label}</button>`;
    }).join("");
    syncCorrectionModeScroll();
  }
  function setRowAdoptionMode(index, mode) {
    if (!(correctionSlotCounts[index] > 0) || !ROW_MODE_LABELS[mode]) return;
    rowAdoptionModes[index] = mode;
    if (mode !== "edit") removeOutputOverride(index);
    persistRowAdoptionModes();
    updateCorrectionModes();
    convert({ changedLineIndices: new Set([index]) });
    markActivity();
  }
  elements.correctionModes?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-line]");
    if (!button) return;
    const index = Number(button.dataset.line);
    const current = effectiveRowMode(index);
    setRowAdoptionMode(index, current === "auto" ? "edit" : current === "edit" ? "source" : current === "source" ? "auto" : "edit");
  });
  function updateCorrectionHistoryButtons() {
    elements.correctionUndo.disabled = correctionUndoStack.length === 0;
    elements.correctionRedo.disabled = correctionRedoStack.length === 0;
  }
  function resetCorrectionHistory() {
    correctionUndoStack = [];
    correctionRedoStack = [];
    correctionHistoryValue = elements.correction.value;
    updateCorrectionHistoryButtons();
  }
  function syncCorrectionHistoryOnFocus() {
    if (elements.correction.value === correctionHistoryValue) return;
    resetCorrectionHistory();
  }
  function recordCorrectionHistory() {
    if (restoringCorrectionHistory || elements.correction.value === correctionHistoryValue) return;
    correctionUndoStack.push(correctionHistoryValue);
    if (correctionUndoStack.length > 100) correctionUndoStack.shift();
    correctionRedoStack = [];
    correctionHistoryValue = elements.correction.value;
    updateCorrectionHistoryButtons();
  }
  function applyCorrectionHistory(value) {
    const selectionStart = elements.correction.selectionStart;
    const selectionEnd = elements.correction.selectionEnd;
    const scrollTop = elements.correction.scrollTop;
    const scrollLeft = elements.correction.scrollLeft;
    const restoreViewport = () => {
      elements.correction.scrollTop = scrollTop;
      elements.correction.scrollLeft = scrollLeft;
      elements.correctionLines.scrollTop = scrollTop;
      syncCorrectionModeScroll(scrollTop);
      syncHighlightScroll(elements.correction);
    };
    restoringCorrectionHistory = true;
    elements.correction.value = value;
    correctionHistoryValue = value;
    elements.correction.setSelectionRange(Math.min(selectionStart, value.length), Math.min(selectionEnd, value.length));
    elements.correction.dispatchEvent(new Event("input", { bubbles: true }));
    restoringCorrectionHistory = false;
    elements.correction.focus({ preventScroll: true });
    restoreViewport();
    requestAnimationFrame(restoreViewport);
    updateCorrectionPosition();
    updateCorrectionHistoryButtons();
  }
  function undoCorrection() {
    if (!correctionUndoStack.length) return;
    correctionRedoStack.push(elements.correction.value);
    applyCorrectionHistory(correctionUndoStack.pop());
  }
  function redoCorrection() {
    if (!correctionRedoStack.length) return;
    correctionUndoStack.push(elements.correction.value);
    applyCorrectionHistory(correctionRedoStack.pop());
  }
  elements.correction.addEventListener("focus", syncCorrectionHistoryOnFocus);
  function installLocalEditorHistory(textarea) {
    const state = {
      value: textarea.value,
      selectionStart: textarea.selectionStart || 0,
      selectionEnd: textarea.selectionEnd || 0,
      undo: [],
      redo: [],
      restoring: false,
      beforeEdit: null
    };
    const snapshot = () => ({
      value: state.value,
      selectionStart: state.selectionStart,
      selectionEnd: state.selectionEnd
    });
    const syncExternalValue = () => {
      if (state.value === textarea.value) return;
      state.value = textarea.value;
      state.selectionStart = textarea.selectionStart;
      state.selectionEnd = textarea.selectionEnd;
      state.undo = [];
      state.redo = [];
      state.beforeEdit = null;
    };
    const restore = (next, destination) => {
      if (!next) return;
      destination.push(snapshot());
      state.restoring = true;
      textarea.value = next.value;
      state.value = next.value;
      state.selectionStart = Math.min(next.selectionStart, next.value.length);
      state.selectionEnd = Math.min(next.selectionEnd, next.value.length);
      textarea.setSelectionRange(state.selectionStart, state.selectionEnd);
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      state.restoring = false;
    };
    textarea.addEventListener("focus", syncExternalValue);
    textarea.addEventListener("beforeinput", () => {
      if (state.restoring) return;
      syncExternalValue();
      state.beforeEdit = snapshot();
    });
    textarea.addEventListener("input", () => {
      if (state.restoring) return;
      const previous = state.beforeEdit || snapshot();
      state.beforeEdit = null;
      if (previous.value !== textarea.value) {
        state.undo.push(previous);
        if (state.undo.length > 100) state.undo.shift();
        state.redo = [];
      }
      state.value = textarea.value;
      state.selectionStart = textarea.selectionStart;
      state.selectionEnd = textarea.selectionEnd;
    });
    ["keyup", "mouseup", "select"].forEach((eventName) => textarea.addEventListener(eventName, () => {
      if (state.restoring || state.value !== textarea.value) return;
      state.selectionStart = textarea.selectionStart;
      state.selectionEnd = textarea.selectionEnd;
    }));
    textarea.addEventListener("keydown", (event) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      const undo = key === "z" && !event.shiftKey;
      const redo = key === "y" || (key === "z" && event.shiftKey);
      if (!undo && !redo) return;
      event.preventDefault();
      event.stopPropagation();
      syncExternalValue();
      if (undo) restore(state.undo.pop(), state.redo);
      else restore(state.redo.pop(), state.undo);
    });
  }
  [elements.input, elements.output, elements.committedOutput].forEach(installLocalEditorHistory);
  function jumpToCorrectionLine(lineNumber) {
    const lines = elements.correction.value.split(/\r\n|\r|\n/);
    const targetIndex = Math.max(0, Math.min(lines.length - 1, lineNumber - 1));
    let offset = 0;
    for (let index = 0; index < targetIndex; index += 1) offset += lines[index].length + 1;
    elements.correction.focus();
    elements.correction.setSelectionRange(offset, offset);
    const lineHeight = Number.parseFloat(getComputedStyle(elements.correction).lineHeight) || 23;
    elements.correction.scrollTop = Math.max(0, targetIndex * lineHeight - elements.correction.clientHeight / 3);
    updateActivePosition(elements.correction, elements.correctionLines, true);
  }
  function editorLine(textarea, lineIndex) {
    return textarea.value.split(/\r\n|\r|\n/)[lineIndex] || "";
  }
  function applyKeyTransitionOnEnter(textarea, event) {
    if (event.key !== "Enter" || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return false;
    const lineNumber = textarea.value.slice(0, textarea.selectionStart).split(/\r\n|\r|\n/).length;
    const result = window.ChordWikiTranspose.applyKeyTransition(textarea.value, lineNumber);
    if (!result.changed) return false;
    event.preventDefault();
    textarea.value = result.text;
    const lines = result.text.split(/\r\n|\r|\n/);
    const nextLineStart = lines.slice(0, result.lineNumber).join("\n").length + 1;
    textarea.setSelectionRange(Math.min(nextLineStart, result.text.length), Math.min(nextLineStart, result.text.length));
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }
  function replaceCorrectionLine(lineIndex, nextValue) {
    const lines = elements.correction.value.split(/\r\n|\r|\n/);
    while (lines.length <= lineIndex) lines.push("");
    lines[lineIndex] = nextValue;
    elements.correction.value = lines.join("\n");
    elements.correction.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function focusEditorLine(textarea, lineIndex) {
    const lines = textarea.value.split(/\r\n|\r|\n/);
    const target = Math.max(0, Math.min(lines.length - 1, lineIndex));
    const start = lines.slice(0, target).reduce((sum, line) => sum + line.length + 1, 0);
    const end = start + (lines[target] || "").length;
    textarea.focus();
    textarea.setSelectionRange(start, end);
    const lineHeight = Number.parseFloat(getComputedStyle(textarea).lineHeight) || 23;
    textarea.scrollTop = Math.max(0, target * lineHeight - textarea.clientHeight / 3);
  }
  function keepOutputAndRefreshCorrection(lineIndex) {
    const settings = validatedSettings();
    if (!settings.valid) return;
    const outputLine = editorLine(elements.output, lineIndex);
    const inferred = CBFConverter.inferBeatCodeFromRenderedLine(outputLine, inferenceFallbackCorrectionLines[lineIndex] || "", settings.values);
    if (!inferred) {
      const hasTarget = CBFConverter.parseTokens(outputLine).some((token) => token.kind === "chord" || (token.kind === "text" && token.value === "[○]"));
      if (!hasTarget) {
        manualOutputLines.add(lineIndex);
        outputManuallyEdited = true;
        replaceCorrectionLine(lineIndex, "");
        scheduleConversion(false, new Set([lineIndex]));
        updateCorrectionModes();
        notify(`${lineIndex + 1}行目にはコード・白玉がないため、行修正を空欄にしました。`);
        return;
      }
      focusEditorLine(elements.output, lineIndex);
      notify("この変換後行から行修正を作れませんでした。変換後の行を確認してください。", true);
      return;
    }
    manualOutputLines.add(lineIndex);
    outputManuallyEdited = true;
    updateCorrectionModes();
    replaceCorrectionLine(lineIndex, inferred);
    rowAdoptionModes[lineIndex] = "recovered";
    persistRowAdoptionModes();
    scheduleConversion(false, new Set([lineIndex]));
    jumpToCorrectionLine(lineIndex + 1);
    notify(`${lineIndex + 1}行目を変換後に合わせて更新しました。`);
  }
  elements.correctionRefreshLine.addEventListener("click", () => {
    const scrollPositions = captureEditorScrollPositions();
    const lineIndex = linkedLineIndex >= 0 ? linkedLineIndex : activeLineIndex(elements.output);
    keepOutputAndRefreshCorrection(lineIndex);
    restoreEditorScrollPositions(scrollPositions);
  });
  function rebuildCorrectionsFromOutput() {
    const settings = validatedSettings();
    if (!settings.valid) return;
    const outputLines = elements.output.value.split(/\r\n|\r|\n/);
    const rebuilt = outputLines.map((line, index) => CBFConverter.inferBeatCodeFromRenderedLine(
      line,
      inferenceFallbackCorrectionLines[index] || "",
      settings.values
    ) || "");
    const targetRows = rebuilt.filter(Boolean).length;
    const unresolvedRows = outputLines.length - targetRows;
    if (!window.confirm(`変換後の${outputLines.length}行から行修正を復元します。\n現在の行修正値は${targetRows}行分が置き換わります。\n変換後の表示内容は変更しません。`)) return;
    elements.correction.value = rebuilt.join("\n");
    // Let the normal input path save this restoration as one undoable change.
    elements.correction.dispatchEvent(new Event("input", { bubbles: true }));
    correctionSlotCounts = rebuilt.map((code) => CBFCorrectionInput.groups(code).length);
    authoredWhiteNoteCounts = outputLines.map((line) => CBFConverter.parseTokens(line)
      .filter((token) => token.kind === "text" && token.value === "[○]").length);
    // Force this conversion to use the reconstructed values rather than
    // considering them identical to the former automatic fallback.
    inferenceFallbackCorrectionLines = rebuilt.map(() => "");
    lastAppliedCorrectionLines = [...rebuilt];
    manualOutputLines = new Set(outputLines.map((_line, index) => index));
    rowAdoptionModes = rebuilt.map((code) => code ? "recovered" : "none");
    persistRowAdoptionModes();
    updateCorrectionModes();
    scheduleConversion(false, new Set(outputLines.map((_line, index) => index)));
    notify(`変換後から${targetRows}行分の行修正を復元しました。${unresolvedRows ? ` ${unresolvedRows}行は復元できないため空欄です。` : ""}`);
  }
  elements.correctionRebuildAll.addEventListener("click", rebuildCorrectionsFromOutput);
  function renderSupport(messages, correctionErrors = []) {
    const items = Array.isArray(messages) ? messages : [messages];
    elements.statusDetail.textContent = "";
    items.filter(Boolean).forEach((message) => {
      const row = document.createElement("div");
      row.className = "support-message";
      const text = document.createElement("span");
      text.textContent = message;
      row.append(text);
      correctionErrors.filter((error) => message.includes(error.message)).forEach((error) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "support-jump-button";
        button.textContent = `${error.line}行目を確認`;
        button.addEventListener("click", () => {
          jumpToCorrectionLine(error.line);
          elements.correctionCard.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        row.append(button);
      });
      elements.statusDetail.append(row);
    });
  }
  let resultAlignmentFrame;
  function syncResultRowAlignment() {
    cancelAnimationFrame(resultAlignmentFrame);
    resultAlignmentFrame = requestAnimationFrame(() => {
      elements.workspace.style.setProperty("--correction-controls-offset", "0px");
      if (window.matchMedia("(max-width: 699px)").matches) {
        positionFrameResizeEdges();
        return;
      }
      const correctionTop = elements.correctionShell.getBoundingClientRect().top;
      const outputTop = elements.outputShell.getBoundingClientRect().top;
      elements.workspace.style.setProperty("--correction-controls-offset", `${outputTop - correctionTop}px`);
      positionFrameResizeEdges();
    });
  }
  function parseRemovalTargets(raw) {
    const parts = raw.split(/[,、\s]+/).filter(Boolean);
    if (!parts.length) return [];
    if (parts.some((part) => !/^\d+$/.test(part) || Number(part) < 0 || Number(part) > 32)) return null;
    return [...new Set(parts.map(Number))];
  }
  function updateLyricHyphenControls() {
    const targetMode = elements.lyricHyphenMode.value === "target";
    elements.removalTargets.disabled = !targetMode;
    elements.removalLinked.disabled = !targetMode;
  }
  function transposedPreviewText() {
    if (!window.ChordWikiTranspose) return elements.finalOutput.value;
    return window.ChordWikiTranspose.transposeText(
      elements.finalOutput.value,
      elements.previewTranspose.value,
      elements.previewSpelling.value,
      elements.previewTheoretical.checked,
      [],
      "##"
    );
  }
  function scoreWindowPayload(source = "main") {
    return {
      source,
      text: elements.finalOutput.value,
      committedText: elements.committedOutput.value,
      transpose: Number.parseInt(elements.previewTranspose.value, 10) || 0,
      spelling: elements.previewSpelling.value,
      theoretical: elements.previewTheoretical.checked,
      doubleSharp: "##",
      keySections: [],
      barsThrough: elements.finalBarsThrough.checked,
      theme: elements.theme.value,
      editorFont: elements.fontSelect.value,
      editorFontStack: getComputedStyle(document.documentElement).getPropertyValue("--editor-font").trim(),
      editorFontSize: elements.fontSizeValue.value,
      scrollSync: scrollSyncEnabled,
      textColoring: elements.textColoring.checked,
      boldCode: elements.boldCode.checked,
      updatedAt: scoreWindowRevision
    };
  }
  function publishScoreWindow() {
    scoreWindowRevision = Math.max(Date.now(), scoreWindowRevision + 1);
    const payload = scoreWindowPayload();
    try { localStorage.setItem(SCORE_WINDOW_STATE_KEY, JSON.stringify(payload)); } catch (_error) { /* preview still works locally */ }
    if (scorePreviewChannel) scorePreviewChannel.postMessage({ type: "score-state", payload });
  }
  function renderFinalPreview() {
    elements.finalPreview.classList.toggle("bars-through", elements.finalBarsThrough.checked);
    if (window.ChordWikiPreview) window.ChordWikiPreview.renderInto(elements.finalPreview, transposedPreviewText());
    publishScoreWindow();
  }
  function showScorePreview() {
    elements.finalOutputShell.classList.add("preview-mode");
    elements.finalPreview.hidden = false;
    renderFinalPreview();
  }
  function renderBars(text, plainBars) {
    return plainBars ? text.replaceAll("[|]", "|") : text;
  }
  function resetOutputAddedOffsets() {
    outputHighlightValue = elements.output.value;
    outputAddedOffsets = new Set(CBFConverter.addedCharacterIndices(elements.input.value, outputHighlightValue));
  }
  function updateMergedOutputAddedOffsets(previousValue, mergedValue, changedLineIndices) {
    const changed = new Set(changedLineIndices || []);
    const remapped = new Set(CBFConverter.remapTrackedCharacterIndices(previousValue, mergedValue, outputAddedOffsets));
    const lineAt = (text, offset) => text.slice(0, offset).split("\n").length - 1;
    const mergedLines = mergedValue.split("\n");
    const sourceLines = elements.input.value.split(/\r\n|\r|\n/);
    const starts = [];
    let offset = 0;
    mergedLines.forEach((line) => { starts.push(offset); offset += line.length + 1; });
    outputAddedOffsets = new Set([...remapped].filter((index) => !changed.has(lineAt(mergedValue, index))));
    changed.forEach((lineIndex) => {
      const added = CBFConverter.addedCharacterIndices(sourceLines[lineIndex] || "", mergedLines[lineIndex] || "");
      added.forEach((index) => outputAddedOffsets.add((starts[lineIndex] || 0) + index));
    });
    outputHighlightValue = mergedValue;
  }
  function updateRenderedOutputs(force = false, changedLineIndices = null) {
    const lyricHyphenMode = ["show", "target", "minimize", "all"].includes(elements.lyricHyphenMode.value)
      ? elements.lyricHyphenMode.value
      : "target";
    const parsedTargets = parseRemovalTargets(elements.removalTargets.value);
    const invalid = lyricHyphenMode === "target" && parsedTargets === null;
    elements.removalTargets.setAttribute("aria-invalid", String(invalid));
    if (invalid) {
      elements.removalSummary.textContent = "0～32をカンマ区切りで入力してください";
      return;
    }
    const targets = lyricHyphenMode === "target" ? parsedTargets : [0];
    localStorage.setItem(REMOVAL_STORAGE_KEY, elements.removalTargets.value.trim());
    if (outputManuallyEdited && !force) {
      elements.finalOutput.value = elements.output.value;
      renderFinalPreview();
      updateCount(elements.output, elements.outputCount);
      updateLineNumbers(elements.output, elements.outputLines);
      updateCount(elements.finalOutput, elements.finalOutputCount);
      updateLineNumbers(elements.finalOutput, elements.finalOutputLines);
      elements.removalSummary.textContent = "手動編集を保持中";
      return;
    }
    const activeSettings = validatedSettings({ persist: false });
    const hyphenSpacing = activeSettings.valid ? activeSettings.values.hyphenSpacing : 0;
    const keepSingleCharacterHyphens = Boolean(activeSettings.valid && activeSettings.values.singleCharacterHyphens);
    const visibilityMode = lyricHyphenMode === "all" ? "all" : lyricHyphenMode === "minimize";
    const result = CBFConverter.renderCompletedOutput(convertedOutput, targets, hyphenSpacing, visibilityMode, keepSingleCharacterHyphens);
    const renderedOutput = renderBars(result.output, elements.plainEditBars.checked);
    const nextOutput = CBFConverter.restoreSourceAdoptedLines(renderedOutput, elements.input.value, rowAdoptionModes);
    lastGeneratedOutput = nextOutput;
    const layeredOutput = CBFOutputOverrides.apply(nextOutput, sourceLineIds, outputOverrides);
    if (changedLineIndices?.size) {
      const previousValue = elements.output.value;
      const mergedValue = outputManuallyEdited
        ? layeredOutput
        : CBFConverter.mergeChangedLines(previousValue, layeredOutput, changedLineIndices);
      elements.output.value = mergedValue;
      elements.finalOutput.value = mergedValue;
      // A row correction and a direct output edit can coexist on the same line.
      // Keep tracking an already-manual line after rebuilding its rhythm.
      outputManuallyEdited = manualOutputLines.size > 0;
      updateMergedOutputAddedOffsets(previousValue, mergedValue, changedLineIndices);
    } else {
      elements.output.value = layeredOutput;
      elements.finalOutput.value = layeredOutput;
      resetOutputAddedOffsets();
    }
    renderFinalPreview();
    updateCount(elements.output, elements.outputCount);
    updateLineNumbers(elements.output, elements.outputLines);
    updateCount(elements.finalOutput, elements.finalOutputCount);
    updateLineNumbers(elements.finalOutput, elements.finalOutputLines);
    elements.removalSummary.textContent = lyricHyphenMode === "minimize"
      ? `歌詞行 ${result.hiddenLyricHyphens}個を省略（3コード以上は保持）`
      : lyricHyphenMode === "all"
      ? `歌詞行 ${result.hiddenLyricHyphens}個をすべて省略`
      : lyricHyphenMode === "show" || targets.length === 0 || targets.includes(0)
      ? "すべて表示"
      : `削除 ${result.removedHyphens}個 / ${result.changedMeasures}小節`;
  }
  function notify(message, isError = false) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.className = `toast visible${isError ? " error" : ""}`;
    toastTimer = setTimeout(() => { elements.toast.className = "toast"; }, 1800);
  }
  function collectSnapshot() {
    return {
      inputText: elements.input.value,
      correctionText: elements.correction.value,
      rowAdoptionModes: [...rowAdoptionModes],
      sourceLineIds: [...sourceLineIds],
      outputOverrides: CBFOutputOverrides.sanitize(outputOverrides),
      committedOutputText: elements.committedOutput.value,
      settings: {
        settingsProfile: CBFSettings.activeProfile(),
        converter: rawSettings(),
        removalTargets: elements.removalTargets.value,
        removalLinked,
        lyricHyphenMode: elements.lyricHyphenMode.value,
        plainEditBars: elements.plainEditBars.checked,
        finalBarsThrough: elements.finalBarsThrough.checked,
        previewTranspose: Number.parseInt(elements.previewTranspose.value, 10) || 0,
        previewSpelling: elements.previewSpelling.value,
        previewTheoretical: elements.previewTheoretical.checked,
        previewDoubleSharp: "##",
        previewKeySections: keySectionSettings,
        theme: elements.theme.value,
        editorFont: elements.fontSelect.value,
        editorFontSize: elements.fontSizeValue.value,
        scrollSync: elements.scrollSync.checked,
        textColoring: elements.textColoring.checked,
        boldCode: elements.boldCode.checked,
        addedBackground: elements.addedBackground.checked
      }
    };
  }
  function collectHistorySnapshot() {
    const snapshot = collectSnapshot();
    const activeSettings = validatedSettings({ persist: false });
    let initialOutputText = convertedOutput;
    if (activeSettings.valid && elements.input.value) {
      const rowCorrections = elements.correction.value.split(/\r\n|\r|\n/);
      initialOutputText = CBFConverter.convertChordText(
        elements.input.value,
        activeSettings.values,
        rowCorrections
      ).output;
    }
    return {
      ...snapshot,
      historyText: elements.output.value,
      initialOutputText,
      idealOutputText: elements.output.value
    };
  }
  function saveCurrentHistory(manual = false, silent = false) {
    if (!elements.output.value.trim()) {
      if (manual) notify("使用履歴へ追加する変換後テキストがありません。", true);
      return false;
    }
    try {
      const result = historyStore.saveHistory(collectHistorySnapshot());
      if (result.saved) {
        if (!silent) {
          const message = result.enriched
            ? "既存の使用履歴へテストデータを追加し、先頭へ移動しました。"
            : result.refreshed
            ? "同じ内容の日時を更新し、使用履歴の先頭へ移動しました。"
            : manual
            ? "使用履歴へ追加しました。"
            : "使用履歴へ保存しました。";
          notify(message);
        }
        if (elements.historyDialog.open) renderHistoryList();
        return true;
      }
      if (manual) notify("同じ内容はすでに使用履歴へ保存されています。");
      return false;
    } catch (_error) {
      notify("使用履歴を保存できませんでした。ブラウザの保存容量を確認してください。", true);
      return false;
    }
  }
  function markActivity() {
    if (suppressActivity) return;
    localStorage.setItem(CURRENT_STATE_UPDATED_AT_KEY, String(Date.now()));
    clearTimeout(historyTimer);
    clearTimeout(crashTimer);
    historyTimer = setTimeout(() => {
      saveCurrentHistory();
    }, HISTORY_DELAY_MS);
    crashTimer = setTimeout(() => {
      if (!elements.input.value.trim()) return;
      try { historyStore.saveCrash(collectSnapshot()); }
      catch (_error) { notify("クラッシュ復元データを保存できませんでした。", true); }
    }, CRASH_DELAY_MS);
  }
  function persistFeatureSettings() {
    localStorage.setItem(PLAIN_EDIT_BARS_STORAGE_KEY, String(elements.plainEditBars.checked));
    localStorage.setItem(FINAL_BARS_THROUGH_STORAGE_KEY, String(elements.finalBarsThrough.checked));
    localStorage.setItem(PREVIEW_TRANSPOSE_STORAGE_KEY, elements.previewTranspose.value);
    localStorage.setItem(PREVIEW_SPELLING_STORAGE_KEY, elements.previewSpelling.value);
    localStorage.setItem(PREVIEW_THEORETICAL_STORAGE_KEY, String(elements.previewTheoretical.checked));
    localStorage.setItem(PREVIEW_DOUBLE_SHARP_STORAGE_KEY, "##");
    localStorage.setItem(PREVIEW_KEY_SECTIONS_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(REMOVAL_LINKED_STORAGE_KEY, String(removalLinked));
    localStorage.setItem(LYRIC_HYPHEN_MODE_STORAGE_KEY, elements.lyricHyphenMode.value);
  }
  function restoreSnapshot(snapshot) {
    if (!snapshot) return;
    suppressActivity = true;
    const state = snapshot.settings || {};
    const converterSettings = { ...CBFSettings.defaults(), ...(state.converter || {}) };
    const settingsProfile = CBFSettings.PROFILE_KEYS.includes(state.settingsProfile)
      ? state.settingsProfile
      : CBFSettings.activeProfile();
    elements.input.value = String(snapshot.inputText || "");
    elements.correction.value = String(snapshot.correctionText || "");
    sourceLineIds = CBFOutputOverrides.normalizeIds(
      elements.input.value.split(/\r\n|\r|\n/).length,
      Array.isArray(snapshot.sourceLineIds) ? snapshot.sourceLineIds : [],
      createSourceLineId
    );
    outputOverrides = CBFOutputOverrides.sanitize(snapshot.outputOverrides);
    syncManualOutputLinesFromOverrides();
    persistOutputLayer();
    rowAdoptionModes = Array.isArray(snapshot.rowAdoptionModes) ? snapshot.rowAdoptionModes.map((mode) => ROW_MODE_LABELS[mode] ? mode : "") : [];
    persistRowAdoptionModes();
    resetCorrectionHistory();
    elements.committedOutput.value = String(snapshot.committedOutputText || "");
    localStorage.setItem(COMMITTED_OUTPUT_STORAGE_KEY, elements.committedOutput.value);
    updateCount(elements.committedOutput, elements.committedOutputCount);
    updateLineNumbers(elements.committedOutput, elements.committedOutputLines);
    CBFSettings.setActiveProfile(settingsProfile, converterSettings);
    renderSettings(converterSettings);
    updateSettingsProfileUI();
    const validatedConverterSettings = CBFSettings.validate(converterSettings);
    if (validatedConverterSettings.valid) CBFSettings.save(validatedConverterSettings.values);
    removalLinked = state.removalLinked !== false;
    elements.removalLinked.checked = removalLinked;
    elements.removalTargets.value = removalLinked
      ? String(converterSettings.hyphenUnit)
      : (state.removalTargets ?? String(converterSettings.hyphenUnit));
    elements.lyricHyphenMode.value = ["show", "target", "minimize", "all"].includes(state.lyricHyphenMode)
      ? state.lyricHyphenMode
      : (state.hideLyricHyphens ? "minimize" : "target");
    updateLyricHyphenControls();
    elements.plainEditBars.checked = Boolean(state.plainEditBars);
    elements.finalBarsThrough.checked = Boolean(state.finalBarsThrough);
    elements.previewTranspose.value = String(Math.max(-12, Math.min(12, Number(state.previewTranspose) || 0)));
    elements.previewSpelling.value = ["preserve", "sharp", "flat"].includes(state.previewSpelling) ? state.previewSpelling : "preserve";
    syncPreviewControlMirrors();
    updatePreviewTransposeButtons();
    elements.previewTheoretical.checked = Boolean(state.previewTheoretical);
    keySectionSettings = [];
    applyTheme(state.theme || "light");
    elements.fontSelect.value = editorFonts.some((font) => font.value === state.editorFont) ? state.editorFont : "meiryo";
    applyEditorFont(elements.fontSelect.value);
    updateFontCycleButtons();
    applyEditorFontSize(state.editorFontSize || 14);
    elements.scrollSync.checked = state.scrollSync !== false;
    scrollSyncEnabled = elements.scrollSync.checked;
    localStorage.setItem(SCROLL_SYNC_STORAGE_KEY, String(scrollSyncEnabled));
    elements.textColoring.checked = state.textColoring !== false;
    document.documentElement.classList.toggle("colorized-editors", elements.textColoring.checked);
    localStorage.setItem(TEXT_COLORING_STORAGE_KEY, String(elements.textColoring.checked));
    elements.boldCode.checked = state.boldCode !== false;
    document.documentElement.classList.toggle("bold-chords", elements.boldCode.checked);
    localStorage.setItem(BOLD_CODE_STORAGE_KEY, String(elements.boldCode.checked));
    elements.addedBackground.checked = state.addedBackground !== false;
    localStorage.setItem(ADDED_BACKGROUND_STORAGE_KEY, String(elements.addedBackground.checked));
    showScorePreview();
    persistFeatureSettings();
    localStorage.setItem(INPUT_STORAGE_KEY, elements.input.value);
    localStorage.setItem(CORRECTION_STORAGE_KEY, elements.correction.value);
    correctionSlotCounts = elements.correction.value.split(/\r\n|\r|\n/).map((line) => CBFCorrectionInput.groups(line).length);
    authoredWhiteNoteCounts = correctionSlotCounts.map(() => 0);
    updateCount(elements.input, elements.inputCount);
    updateLineNumbers(elements.input, elements.inputLines);
    convert({ refreshCorrections: false });
    suppressActivity = false;
    markActivity();
  }
  function formatSavedAt(value) {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit"
    }).format(new Date(value));
  }
  function showDialog(dialog) {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }
  function closeDialog(dialog) {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }
  function keySectionSource(section) {
    return elements.finalOutput.value.split(/\r\n|\r|\n/).slice(section.startLine - 1, section.endLine).join("\n");
  }
  function renderKeySectionSettings() {
    const sections = window.ChordWikiTranspose.analyzeKeySections(elements.finalOutput.value);
    elements.keySettingsList.textContent = "";
    sections.forEach((section) => {
      const saved = keySectionSettings[section.index] || {};
      const card = document.createElement("section");
      card.className = "key-section-card";
      card.dataset.sectionIndex = String(section.index);
      const mode = ["default", "simple", "key", "sharp", "flat"].includes(saved.mode) ? saved.mode : "default";
      card.innerHTML = `<div class="key-section-summary"><strong>${section.explicit ? `Key: ${escapeHtml(section.key)}` : "キー指定なし"}</strong><span>${section.startLine}～${section.endLine}行</span></div>
        <select class="key-section-mode" aria-label="${section.startLine}行目からの音名ルール">
          <option value="default"${mode === "default" ? " selected" : ""}>基本設定に従う</option><option value="simple"${mode === "simple" ? " selected" : ""}>かんたん表記</option><option value="key"${mode === "key" ? " selected" : ""}>キー準拠</option><option value="sharp"${mode === "sharp" ? " selected" : ""}>♯系を優先</option><option value="flat"${mode === "flat" ? " selected" : ""}>♭系を優先</option>
        </select>
        ${section.explicit ? `<div class="key-section-key-tools"><span>譜面内の {key:${escapeHtml(section.key)}} を使用</span></div>` : `<div class="key-section-key-tools"><input class="key-section-manual" type="text" value="${escapeHtml(saved.key || "")}" placeholder="C / Am / Cb"><button class="text-button key-estimate" type="button">キーを推定</button><div class="key-estimate-candidates">未確定時はかんたん表記になります</div></div>`}`;
      elements.keySettingsList.append(card);
    });
    renderKeySettingsPreview();
  }
  function draftKeySectionSettings() {
    return [...elements.keySettingsList.querySelectorAll(".key-section-card")].map((card) => ({
      mode: card.querySelector(".key-section-mode").value,
      key: card.querySelector(".key-section-manual")?.value.trim() || ""
    }));
  }
  function addKeySectionPreviewDirectives(text, sections, draftSections) {
    const lines = String(text || "").replace(/\r\n?|\r/g, "\n").split("\n");
    [...sections].sort((left, right) => right.startLine - left.startLine).forEach((section) => {
      const draft = draftSections[section.index] || {};
      if (section.explicit || draft.mode !== "key" || !draft.key) return;
      lines.splice(Math.max(0, section.startLine - 1), 0, `{key:${draft.key.replace(/[{}]/g, "")}}`);
    });
    return lines.join("\n");
  }
  function renderKeySettingsPreview() {
    const sections = window.ChordWikiTranspose.analyzeKeySections(elements.finalOutput.value);
    const draftSections = draftKeySectionSettings();
    const transposed = window.ChordWikiTranspose.transposeText(elements.finalOutput.value, elements.previewTranspose.value, elements.previewSpelling.value, elements.previewTheoretical.checked, draftSections, "##");
    const text = addKeySectionPreviewDirectives(transposed, sections, draftSections);
    elements.keySettingsPreview.classList.toggle("bars-through", elements.finalBarsThrough.checked);
    window.ChordWikiPreview.renderInto(elements.keySettingsPreview, text);
    keyPreviewTargets = [];
    const model = window.ChordWikiPreview.parse(text);
    const children = [...elements.keySettingsPreview.children];
    const insertedBefore = sections.map((section) => sections.filter((candidate) => candidate.startLine <= section.startLine && !candidate.explicit && draftSections[candidate.index]?.mode === "key" && draftSections[candidate.index]?.key).length);
    let childIndex = 0;
    sections.forEach((section, sectionIndex) => {
      const previewLine = section.startLine + insertedBefore[sectionIndex];
      for (let lineIndex = 0; lineIndex < previewLine - 1; lineIndex += 1) {
        if (model.lines[lineIndex]?.kind !== "hidden") childIndex += 1;
      }
      const target = children[childIndex];
      if (target) {
        target.dataset.keySectionIndex = String(section.index);
        target.classList.add("key-preview-section-start");
        keyPreviewTargets.push({ index: section.index, element: target });
      }
      childIndex = 0;
    });
    syncKeySectionLink();
  }
  function setActiveKeySection(index) {
    elements.keySettingsList.querySelectorAll(".key-section-card").forEach((card) => {
      card.classList.toggle("is-active", Number(card.dataset.sectionIndex) === index);
    });
    keyPreviewTargets.forEach((target) => target.element.classList.toggle("is-active", target.index === index));
  }
  function syncKeySectionLink() {
    if (!keyPreviewTargets.length) return;
    const top = elements.keySettingsPreview.scrollTop + 24;
    const current = [...keyPreviewTargets].reverse().find((target) => target.element.offsetTop <= top);
    if (current) setActiveKeySection(current.index);
  }
  function addKeyDirectivesToText(text, sections, draftSections) {
    const lines = String(text || "").replace(/\r\n?|\r/g, "\n").split("\n");
    [...sections].sort((left, right) => right.startLine - left.startLine).forEach((section) => {
      const draft = draftSections[section.index] || {};
      if (section.explicit || draft.mode !== "key" || !draft.key) return;
      lines.splice(Math.max(0, section.startLine - 1), 0, `{key:${draft.key.replace(/[{}]/g, "")}}`);
    });
    return lines.join("\n");
  }
  function applyKeySectionSettings() {
    const sections = window.ChordWikiTranspose.analyzeKeySections(elements.finalOutput.value);
    const next = draftKeySectionSettings();
    for (const card of elements.keySettingsList.querySelectorAll(".key-section-card")) {
      const index = Number(card.dataset.sectionIndex);
      const section = sections[index];
      const mode = card.querySelector(".key-section-mode").value;
      const key = card.querySelector(".key-section-manual")?.value.trim() || "";
      if (!section.explicit && !key && ["key", "sharp", "flat"].includes(mode)) {
        notify(`${section.startLine}～${section.endLine}行のキーを指定または推定してください。`, true);
        return;
      }
      next[index] = { mode, key };
    }
    const keyedOutput = addKeyDirectivesToText(elements.finalOutput.value, sections, next);
    const directivesAdded = keyedOutput !== elements.finalOutput.value;
    if (directivesAdded) {
      elements.output.value = keyedOutput;
      elements.finalOutput.value = keyedOutput;
      lastGeneratedOutput = keyedOutput;
      outputManuallyEdited = true;
      updateCount(elements.output, elements.outputCount);
      updateLineNumbers(elements.output, elements.outputLines);
      updateCount(elements.finalOutput, elements.finalOutputCount);
      updateLineNumbers(elements.finalOutput, elements.finalOutputLines);
    }
    keySectionSettings = directivesAdded ? [] : next;
    persistFeatureSettings();
    renderFinalPreview();
    closeDialog(elements.keySettingsDialog);
    markActivity();
    notify("キー別設定を適用しました。");
  }
  function historyExcerpt(text) {
    const lines = String(text || "").replace(/\r\n?/g, "\n").split("\n")
      .filter((line) => line.trim() && !/^\s*\{(?:title|t|subtitle|st|comment|c|comment_italic|ci|key)\s*:/i.test(line))
      .map((line) => line.replace(/\[[^\[\]\r\n]*\]/g, "").trim())
      .filter(Boolean);
    return lines.slice(0, 2).join("\n") || "本文の入力はありません";
  }
  function historyPreviewText(entry) {
    if (typeof entry.historyText === "string") return entry.historyText;
    const state = entry.settings || {};
    const converterCandidate = { ...CBFSettings.defaults(), ...(state.converter || {}) };
    const validated = CBFSettings.validate(converterCandidate);
    const converterSettings = validated.valid ? validated.values : CBFSettings.defaults();
    const rowCorrections = String(entry.correctionText || "").split(/\r\n|\r|\n/);
    const converted = CBFConverter.convertChordText(String(entry.inputText || ""), converterSettings, rowCorrections);
    return converted.output;
  }
  function restoreHistoryWorkState(entry) {
    restoreSnapshot(entry);
    if (typeof entry.historyText === "string") {
      const generatedLines = elements.output.value.split(/\r\n|\r|\n/);
      const restoredText = String(entry.historyText);
      const restoredLines = restoredText.split(/\r\n|\r|\n/);
      const lineMapping = CBFConverter.alignLineIndices(generatedLines, restoredLines);
      manualOutputLines = new Set();
      restoredLines.forEach((line, index) => {
        const generatedIndex = lineMapping[index];
        if (generatedIndex < 0 || line !== generatedLines[generatedIndex]) manualOutputLines.add(index);
      });
      if (!entry.outputOverrides) {
        outputOverrides = CBFOutputOverrides.capture(
          lastGeneratedOutput,
          restoredText,
          sourceLineIds,
          CBFConverter.alignLineIndices
        );
        syncManualOutputLinesFromOverrides();
        persistOutputLayer();
      }
      elements.output.value = restoredText;
      elements.finalOutput.value = restoredText;
      outputManuallyEdited = manualOutputLines.size > 0;
      resetOutputAddedOffsets();
      renderFinalPreview();
      updateCount(elements.output, elements.outputCount);
      updateLineNumbers(elements.output, elements.outputLines);
      updateCount(elements.finalOutput, elements.finalOutputCount);
      updateLineNumbers(elements.finalOutput, elements.finalOutputLines);
      updateCorrectionModes();
    }
    elements.input.focus();
  }
  function clearHistoryPreview() {
    selectedHistoryEntry = null;
    elements.historyPreviewTitle.textContent = "履歴を選択してください";
    elements.historyPreviewDate.textContent = "一覧をクリックすると、ここに全体プレビューを表示します。";
    elements.historyRestore.disabled = true;
    elements.historyExportTest.disabled = true;
    elements.historyExportTest.title = "";
    elements.historyTextPreview.textContent = "";
    elements.historyTextPreview.hidden = true;
    elements.historyPreview.hidden = false;
    elements.historyPreview.classList.remove("bars-through");
    elements.historyPreview.innerHTML = '<p class="history-preview-empty">履歴を選択すると、譜面全体を確認できます。</p>';
    setHistoryPreviewMode(historyPreviewMode);
  }
  function setHistoryPreviewMode(mode) {
    historyPreviewMode = ["input", "output", "score"].includes(mode) ? mode : "score";
    elements.historyPreviewTabs.querySelectorAll("[data-history-preview-mode]").forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.historyPreviewMode === historyPreviewMode));
    });
    const showText = historyPreviewMode !== "score";
    elements.historyTextPreview.hidden = !showText;
    elements.historyPreview.hidden = showText;
    if (!selectedHistoryEntry) return;
    if (historyPreviewMode === "input") {
      elements.historyTextPreview.innerHTML = colorizeText(String(selectedHistoryEntry.inputText || ""));
    } else if (historyPreviewMode === "output") {
      elements.historyTextPreview.innerHTML = colorizeText(historyPreviewText(selectedHistoryEntry));
    } else if (window.ChordWikiPreview) {
      window.ChordWikiPreview.renderInto(elements.historyPreview, historyPreviewText(selectedHistoryEntry));
    }
  }
  function showHistoryPreview(entry, selectedButton) {
    selectedHistoryEntry = entry;
    elements.historyList.querySelectorAll(".history-item").forEach((button) => {
      const selected = button === selectedButton;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    elements.historyPreviewTitle.textContent = entry.title;
    elements.historyPreviewDate.textContent = formatSavedAt(entry.savedAt);
    elements.historyRestore.disabled = false;
    const canExport = Boolean(entry.inputText && typeof entry.initialOutputText === "string");
    elements.historyExportTest.disabled = !canExport;
    elements.historyExportTest.title = canExport ? "" : "この履歴は入力と初期出力を含まない旧形式です";
    elements.historyPreview.classList.toggle("bars-through", Boolean(entry.settings?.finalBarsThrough));
    setHistoryPreviewMode(historyPreviewMode);
  }
  function renderHistoryList() {
    elements.historyList.textContent = "";
    clearHistoryPreview();
    const entries = historyStore.list();
    elements.historyDeleteAll.disabled = entries.length === 0;
    if (!entries.length) {
      const empty = document.createElement("p");
      empty.className = "history-empty";
      empty.textContent = "保存された使用履歴はありません。";
      elements.historyList.append(empty);
      return;
    }
    entries.forEach((entry) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "history-item";
      const date = document.createElement("span");
      date.className = "history-date";
      date.textContent = formatSavedAt(entry.savedAt);
      const title = document.createElement("span");
      title.className = "history-title";
      title.textContent = entry.title;
      const excerpt = document.createElement("span");
      excerpt.className = "history-excerpt";
      excerpt.textContent = historyExcerpt(historyPreviewText(entry));
      button.setAttribute("aria-pressed", "false");
      button.append(date, title, excerpt);
      button.addEventListener("click", () => showHistoryPreview(entry, button));
      elements.historyList.append(button);
    });
  }
  async function writeClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    const helper = document.createElement("textarea");
    helper.value = text; helper.style.position = "fixed"; helper.style.opacity = "0";
    document.body.append(helper); helper.select();
    const ok = document.execCommand("copy"); helper.remove();
    if (!ok) throw new Error("copy failed");
  }
  async function readClipboard() {
    if (navigator.clipboard?.readText) return navigator.clipboard.readText();
    throw new Error("clipboard read unavailable");
  }
  const pasteScrollEditors = [elements.correction, elements.input, elements.output, elements.finalOutput, elements.committedOutput];
  function captureEditorScrollPositions() {
    return pasteScrollEditors.map((editor) => ({ editor, top: editor.scrollTop, left: editor.scrollLeft }));
  }
  function restoreEditorScrollPositions(positions) {
    restoringPasteScroll = true;
    // Browsers reveal the new caret after the paste event. Restore the viewport
    // after that native movement and after the input/highlight handlers finish.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      positions.forEach(({ editor, top, left }) => {
        editor.scrollTop = top;
        editor.scrollLeft = left;
        const gutter = gutterByEditor.get(editor);
        if (gutter) gutter.scrollTop = top;
        if (editor === elements.correction) syncCorrectionModeScroll(top);
        syncHighlightScroll(editor);
      });
      requestAnimationFrame(() => { restoringPasteScroll = false; });
    }));
  }
  function preserveEditorScrollOnPaste() {
    restoreEditorScrollPositions(captureEditorScrollPositions());
  }
  pasteScrollEditors.forEach((editor) => editor.addEventListener("paste", preserveEditorScrollOnPaste));
  function safeTestDataFileName(name) {
    const base = CBFTestData.titleForFileName(name).replace(/[\\/:*?"<>|]/g, "_").slice(0, 80);
    return `${base || "test-data"}.cbf-test.json`;
  }
  function downloadTestData(entry) {
    const testData = CBFTestData.create(entry);
    const blob = new Blob([`${JSON.stringify(testData, null, 2)}\n`], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = safeTestDataFileName(testData.name);
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
  async function importTestDataFile(file) {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) throw new Error("20MBを超えるファイルは読み込めません。");
    const testData = CBFTestData.parse(await file.text());
    const result = historyStore.saveHistory(CBFTestData.toHistorySnapshot(testData));
    renderHistoryList();
    const importedButton = elements.historyList.querySelector(".history-item");
    if (importedButton) importedButton.click();
    return result;
  }
  function convert({ refreshCorrections = false, preserveUserEdits = false, changedLineIndices = null, sourceChangedLineIndices = null } = {}) {
    const settings = validatedSettings();
    if (!settings.valid) {
      updateMeasureCapacityWarning();
      renderSupport("設定に範囲外または数値以外の項目があります。");
      return;
    }
    if (!elements.input.value) {
      updateMeasureCapacityWarning();
      convertedOutput = "";
      inferenceFallbackCorrectionLines = [];
      correctionDisplayStates = [];
      elements.correction.value = "";
      correctionSlotCounts = [];
      authoredWhiteNoteCounts = [];
      resetCorrectionHistory();
      outputManuallyEdited = false;
      manualOutputLines.clear();
      sourceLineIds = [];
      outputOverrides = {};
      lastGeneratedOutput = "";
      persistOutputLayer();
      rowAdoptionModes = [];
      persistRowAdoptionModes();
      lastConvertedInputLines = [""];
      updateRenderedOutputs(true);
      elements.correctionCount.textContent = `${lineCount(elements.correction.value)}行`;
      updateLineNumbers(elements.correction, elements.correctionLines);
      updateCorrectionModes();
      localStorage.setItem(CORRECTION_STORAGE_KEY, elements.correction.value);
      renderSupport("入力内容はリアルタイムで右側へ反映されます。");
      return;
    }
    updateMeasureCapacityWarning(settings.values);
    const sourceChanged = new Set(sourceChangedLineIndices || []);
    const currentInputLines = elements.input.value.split(/\r\n|\r|\n/);
    const currentCorrectionLines = elements.correction.value.split(/\r\n|\r|\n/);
    const rowCorrections = refreshCorrections
      ? []
      : currentCorrectionLines.map((line, index) => {
        const musicStructureChanged = sourceChanged.has(index)
          && !CBFConverter.sameMusicStructure(lastConvertedInputLines[index] || "", currentInputLines[index] || "");
        if (musicStructureChanged && rowAdoptionModes[index] !== "source") return "";
        if (line === (inferenceFallbackCorrectionLines[index] || "")) return "";
        return line;
      });
    const manualSources = [];
    const previousCorrections = [...lastAppliedCorrectionLines];
    const result = CBFConverter.convertChordText(elements.input.value, settings.values, rowCorrections, manualSources, previousCorrections, rowAdoptionModes);
    convertedOutput = result.output;
    correctionDisplayStates = result.correctionStates || [];
    inferenceFallbackCorrectionLines = String(result.automaticCorrections || result.corrections).split(/\r\n|\r|\n/);
    syncManualOutputLinesFromOverrides();
    if (refreshCorrections || sourceChanged.size) {
      elements.correction.value = result.corrections;
      if (refreshCorrections) resetCorrectionHistory();
      else {
        correctionHistoryValue = elements.correction.value;
        updateCorrectionHistoryButtons();
      }
    }
    correctionSlotCounts = result.correctionSlotCounts;
    authoredWhiteNoteCounts = result.authoredWhiteNoteCounts;
    localStorage.setItem(CORRECTION_STORAGE_KEY, elements.correction.value);
    updateRenderedOutputs(true, changedLineIndices);
    lastAppliedCorrectionLines = String(result.appliedCorrections || result.corrections).split(/\r\n|\r|\n/);
    lastConvertedInputLines = elements.input.value.split(/\r\n|\r|\n/);
    elements.correctionCount.textContent = `${lineCount(elements.correction.value)}行`;
    updateLineNumbers(elements.correction, elements.correctionLines);
    updateCorrectionModes();
    renderSupport(result.warnings, result.correctionErrors || []);
  }
  function scheduleConversion(refreshCorrections = false, changedLineIndices = null, sourceChangedLineIndices = null) {
    renderSupport("解析中…");
    pendingCorrectionRefresh ||= refreshCorrections;
    if (changedLineIndices) changedLineIndices.forEach((lineIndex) => pendingCorrectionLineIndices.add(lineIndex));
    if (sourceChangedLineIndices) sourceChangedLineIndices.forEach((lineIndex) => pendingSourceLineIndices.add(lineIndex));
    clearTimeout(conversionTimer);
    conversionTimer = setTimeout(() => {
      const refresh = pendingCorrectionRefresh;
      const sourceChanged = refresh ? null : new Set(pendingSourceLineIndices);
      const changed = refresh ? null : new Set([...pendingCorrectionLineIndices, ...pendingSourceLineIndices]);
      pendingCorrectionRefresh = false;
      pendingCorrectionLineIndices.clear();
      pendingSourceLineIndices.clear();
      convert({
        refreshCorrections: refresh,
        preserveUserEdits: !refresh,
        changedLineIndices: changed?.size ? changed : null,
        sourceChangedLineIndices: sourceChanged?.size ? sourceChanged : null
      });
    }, 100);
  }

  function schedulePrioritySettingConversion() {
    clearTimeout(conversionTimer);
    pendingCorrectionRefresh = false;
    pendingCorrectionLineIndices.clear();
    pendingSourceLineIndices.clear();
    conversionTimer = setTimeout(() => {
      const inputLineCount = elements.input.value ? elements.input.value.split(/\r\n|\r|\n/).length : 0;
      const changed = new Set();
      for (let index = 0; index < inputLineCount; index += 1) {
        if (!manualOutputLines.has(index)) changed.add(index);
      }
      if (changed.size) convert({ preserveUserEdits: true, changedLineIndices: changed });
      else validatedSettings();
    }, 100);
  }

  elements.settingsBody.addEventListener("input", (event) => {
    if (event.target.id === "setting-hyphenUnit" && removalLinked) {
      elements.removalTargets.value = event.target.value;
      localStorage.setItem(REMOVAL_STORAGE_KEY, elements.removalTargets.value);
    }
    if (["setting-shortFractionPrepose", "setting-longBeatLyricPlacement", "setting-showContinuationChord"].includes(event.target.id)) schedulePrioritySettingConversion();
    else scheduleConversion(true);
    markActivity();
  });
  CBFNumericEntry.attach(elements.settingsBody);
  elements.settingsBody.addEventListener("change", (event) => {
    if (event.target.matches("#settings-grid select, #settings-advanced-grid select")) event.target.dispatchEvent(new Event("input", { bubbles: true }));
  });
  document.addEventListener("click", (event) => {
    const button = event.target.closest?.(".setting-help-button");
    if (!button) return;
    event.stopPropagation();
    showContextHelp(button, true);
  });
  elements.settingsBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-setting-cycle]");
    if (!button) return;
    const definition = CBFSettings.definitions.find((item) => item.key === button.dataset.settingKey);
    if (!definition) return;
    const input = $(`#setting-${definition.key}`);
    const direction = Number(button.dataset.settingCycle);
    if (definition.choices) {
      const nextIndex = Math.max(0, Math.min(input.options.length - 1, input.selectedIndex + direction));
      if (nextIndex === input.selectedIndex) return;
      input.selectedIndex = nextIndex;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
      return;
    }
    const candidates = recommendedValues().filter((value) => value >= definition.min && value <= definition.max);
    const current = Number(input.value);
    const next = direction > 0
      ? candidates.find((value) => !Number.isFinite(current) || value > current)
      : [...candidates].reverse().find((value) => !Number.isFinite(current) || value < current);
    if (next === undefined) return;
    input.value = String(next);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  });
  elements.settingsProfilePicker?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-settings-profile]");
    if (!button || button.dataset.settingsProfile === CBFSettings.activeProfile()) return;
    switchSettingsProfile(button.dataset.settingsProfile);
  });
  function commitCustomProfileName() {
    const value = elements.customProfileName.value.trim();
    if (value) localStorage.setItem(CUSTOM_PROFILE_NAME_STORAGE_KEY, value);
    else localStorage.removeItem(CUSTOM_PROFILE_NAME_STORAGE_KEY);
    updateSettingsProfileUI();
    markActivity();
    notify("カスタム名を反映しました。");
  }
  elements.customProfileName.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    commitCustomProfileName();
  });
  elements.theme.addEventListener("change", () => { applyTheme(elements.theme.value); publishScoreWindow(); markActivity(); });
  elements.fontSelect.addEventListener("change", () => { applyEditorFont(elements.fontSelect.value); updateFontCycleButtons(); publishScoreWindow(); markActivity(); });
  $("#font-previous").addEventListener("click", () => { cycleEditorFont(-1); publishScoreWindow(); markActivity(); });
  $("#font-next").addEventListener("click", () => { cycleEditorFont(1); publishScoreWindow(); markActivity(); });
  $("#font-size-down").addEventListener("click", () => { applyEditorFontSize(Number.parseInt(elements.fontSizeValue.value, 10) - 1); publishScoreWindow(); markActivity(); });
  $("#font-size-up").addEventListener("click", () => { applyEditorFontSize(Number.parseInt(elements.fontSizeValue.value, 10) + 1); publishScoreWindow(); markActivity(); });
  elements.fontSizeValue.addEventListener("change", () => { applyEditorFontSize(elements.fontSizeValue.value); publishScoreWindow(); markActivity(); });
  elements.scrollSync.addEventListener("change", () => {
    scrollSyncEnabled = elements.scrollSync.checked;
    localStorage.setItem(SCROLL_SYNC_STORAGE_KEY, String(scrollSyncEnabled));
    publishScoreWindow();
    markActivity();
  });
  elements.textColoring.addEventListener("change", () => {
    document.documentElement.classList.toggle("colorized-editors", elements.textColoring.checked);
    localStorage.setItem(TEXT_COLORING_STORAGE_KEY, String(elements.textColoring.checked));
    publishScoreWindow();
    markActivity();
  });
  elements.boldCode.addEventListener("change", () => {
    document.documentElement.classList.toggle("bold-chords", elements.boldCode.checked);
    localStorage.setItem(BOLD_CODE_STORAGE_KEY, String(elements.boldCode.checked));
    publishScoreWindow();
    markActivity();
  });
  elements.addedBackground.addEventListener("change", () => {
    localStorage.setItem(ADDED_BACKGROUND_STORAGE_KEY, String(elements.addedBackground.checked));
    updateEditorHighlight(elements.output);
    markActivity();
  });
  elements.plainEditBars.addEventListener("change", () => { persistFeatureSettings(); updateRenderedOutputs(); markActivity(); });
  elements.finalBarsThrough.addEventListener("change", () => { persistFeatureSettings(); renderFinalPreview(); markActivity(); });
  function refreshGlobalKeySettings() {
    persistFeatureSettings();
    renderFinalPreview();
    if (elements.keySettingsDialog.open) renderKeySettingsPreview();
    markActivity();
  }
  elements.previewTranspose.addEventListener("change", () => { syncPreviewControlMirrors(); updatePreviewTransposeButtons(); refreshGlobalKeySettings(); });
  elements.previewTransposeMain.addEventListener("change", () => {
    elements.previewTranspose.value = elements.previewTransposeMain.value;
    elements.previewTranspose.dispatchEvent(new Event("change", { bubbles: true }));
  });
  elements.previewTransposeDown.addEventListener("click", () => stepPreviewTranspose(-1, elements.previewTransposeDown));
  elements.previewTransposeUp.addEventListener("click", () => stepPreviewTranspose(1, elements.previewTransposeUp));
  elements.previewTransposeMainDown.addEventListener("click", () => stepPreviewTranspose(-1, elements.previewTransposeMainDown));
  elements.previewTransposeMainUp.addEventListener("click", () => stepPreviewTranspose(1, elements.previewTransposeMainUp));
  elements.previewSpelling.addEventListener("change", () => { syncPreviewControlMirrors(); refreshGlobalKeySettings(); });
  elements.previewSpellingMain.addEventListener("change", () => {
    elements.previewSpelling.value = elements.previewSpellingMain.value;
    elements.previewSpelling.dispatchEvent(new Event("change", { bubbles: true }));
  });
  elements.previewTheoretical.addEventListener("change", refreshGlobalKeySettings);
  function applyScoreWindowControls(payload) {
    if (!payload || payload.source !== "score-window") return;
    elements.previewTranspose.value = String(Math.max(-12, Math.min(12, Number(payload.transpose) || 0)));
    elements.previewSpelling.value = ["preserve", "sharp", "flat"].includes(payload.spelling) ? payload.spelling : "preserve";
    syncPreviewControlMirrors();
    updatePreviewTransposeButtons();
    elements.previewTheoretical.checked = Boolean(payload.theoretical);
    if (Array.isArray(payload.keySections)) keySectionSettings = payload.keySections;
    elements.finalBarsThrough.checked = Boolean(payload.barsThrough);
    persistFeatureSettings();
    renderFinalPreview();
  }
  if (scorePreviewChannel) {
    scorePreviewChannel.addEventListener("message", (event) => {
      if (event.data?.type === "score-controls") applyScoreWindowControls(event.data.payload);
      if (event.data?.type === "committed-text") {
        const text = String(event.data.text || "");
        if (text === elements.committedOutput.value) return;
        elements.committedOutput.value = text;
        localStorage.setItem(COMMITTED_OUTPUT_STORAGE_KEY, text);
        updateCount(elements.committedOutput, elements.committedOutputCount);
        updateLineNumbers(elements.committedOutput, elements.committedOutputLines);
        publishScoreWindow();
      }
    });
  }
  window.addEventListener("storage", (event) => {
    if (event.key !== SCORE_WINDOW_STATE_KEY || !event.newValue) return;
    try { applyScoreWindowControls(JSON.parse(event.newValue)); } catch (_error) { /* ignore invalid cross-window data */ }
  });
  window.addEventListener("message", (event) => {
    const sameOrigin = event.origin === window.location.origin
      || (event.origin === "null" && window.location.origin === "null");
    if (!sameOrigin || !event.data) return;
    if (event.data.type === "score-controls") {
      applyScoreWindowControls(event.data.payload);
      return;
    }
    if (event.data.type === "committed-text") {
      const text = String(event.data.text || "");
      if (text !== elements.committedOutput.value) {
        elements.committedOutput.value = text;
        localStorage.setItem(COMMITTED_OUTPUT_STORAGE_KEY, text);
        updateCount(elements.committedOutput, elements.committedOutputCount);
        updateLineNumbers(elements.committedOutput, elements.committedOutputLines);
        publishScoreWindow();
      }
      return;
    }
    if (event.data.type !== "score-request" || !event.source) return;
    const targetOrigin = event.origin === "null" ? "*" : event.origin;
    event.source.postMessage({ type: "score-state", payload: scoreWindowPayload() }, targetOrigin);
  });
  elements.openScoreWindow?.addEventListener("click", () => {
    publishScoreWindow();
  });
  window.addEventListener("focus", publishScoreWindow);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) publishScoreWindow();
  });
  $("#help-open").addEventListener("click", () => {
    if (typeof elements.helpDialog.showModal === "function") elements.helpDialog.showModal();
    else elements.helpDialog.setAttribute("open", "");
  });
  $("#help-close").addEventListener("click", () => elements.helpDialog.close());
  elements.helpDialog.addEventListener("click", (event) => {
    if (event.target === elements.helpDialog) elements.helpDialog.close();
  });
  $("#history-save").addEventListener("click", () => saveCurrentHistory(true));
  $("#history-open").addEventListener("click", () => { renderHistoryList(); showDialog(elements.historyDialog); });
  $("#preview-key-settings").addEventListener("click", () => { renderKeySectionSettings(); showDialog(elements.keySettingsDialog); });
  $("#key-settings-close").addEventListener("click", () => closeDialog(elements.keySettingsDialog));
  $("#key-settings-apply").addEventListener("click", applyKeySectionSettings);
  $("#key-settings-reset").addEventListener("click", () => {
    if (!window.confirm("すべてのキー別設定をクリアします。よろしいですか？")) return;
    keySectionSettings = [];
    persistFeatureSettings();
    renderKeySectionSettings();
    renderFinalPreview();
  });
  elements.keySettingsDialog.addEventListener("click", (event) => { if (event.target === elements.keySettingsDialog) closeDialog(elements.keySettingsDialog); });
  elements.keySettingsPreview.addEventListener("scroll", syncKeySectionLink, { passive: true });
  elements.keySettingsList.addEventListener("click", (event) => {
    const card = event.target.closest(".key-section-card");
    if (!card) return;
    if (!event.target.closest("select, input, button")) {
      const target = keyPreviewTargets.find((candidate) => candidate.index === Number(card.dataset.sectionIndex));
      if (target) {
        elements.keySettingsPreview.scrollTo({ top: Math.max(0, target.element.offsetTop - 18), behavior: "smooth" });
        setActiveKeySection(Number(card.dataset.sectionIndex));
      }
    }
    if (event.target.closest(".key-estimate")) {
      const sections = window.ChordWikiTranspose.analyzeKeySections(elements.finalOutput.value);
      const candidates = window.ChordWikiTranspose.estimateKeys(keySectionSource(sections[Number(card.dataset.sectionIndex)]), 3);
      const target = card.querySelector(".key-estimate-candidates");
      target.innerHTML = candidates.length ? candidates.map((candidate) => `<button type="button" data-estimate-key="${escapeHtml(candidate.key)}">${escapeHtml(candidate.label)}で使う（${candidate.confidence}）</button>`).join("") : "コードから候補を推定できませんでした";
      return;
    }
    const candidate = event.target.closest("[data-estimate-key]");
    if (candidate) {
      card.querySelector(".key-section-manual").value = candidate.dataset.estimateKey;
      card.querySelector(".key-section-mode").value = "key";
      renderKeySettingsPreview();
    }
  });
  elements.keySettingsList.addEventListener("input", renderKeySettingsPreview);
  elements.keySettingsList.addEventListener("change", renderKeySettingsPreview);
  $("#history-close").addEventListener("click", () => closeDialog(elements.historyDialog));
  elements.historyDialog.addEventListener("click", (event) => { if (event.target === elements.historyDialog) closeDialog(elements.historyDialog); });
  elements.historyPreviewTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-history-preview-mode]");
    if (button) setHistoryPreviewMode(button.dataset.historyPreviewMode);
  });
  elements.historyRestore.addEventListener("click", () => {
    if (!selectedHistoryEntry) return;
    const currentSnapshot = collectSnapshot();
    const differs = currentSnapshot.inputText !== String(selectedHistoryEntry.inputText || "")
      || currentSnapshot.correctionText !== String(selectedHistoryEntry.correctionText || "")
      || currentSnapshot.committedOutputText !== String(selectedHistoryEntry.committedOutputText || "")
      || elements.output.value !== historyPreviewText(selectedHistoryEntry)
      || JSON.stringify(currentSnapshot.rowAdoptionModes) !== JSON.stringify(selectedHistoryEntry.rowAdoptionModes || [])
      || JSON.stringify(currentSnapshot.settings) !== JSON.stringify(selectedHistoryEntry.settings || {});
    if (differs && (elements.input.value.trim() || elements.output.value.trim())
        && !window.confirm("現在の作業内容と設定を、履歴を保存した時の状態で上書きします。よろしいですか？")) return;
    restoreHistoryWorkState(selectedHistoryEntry);
    closeDialog(elements.historyDialog);
    notify("履歴を保存した時の作業状態を復元しました。");
  });
  elements.historyExportTest.addEventListener("click", () => {
    if (!selectedHistoryEntry) return;
    try {
      downloadTestData(selectedHistoryEntry);
      notify("テストデータをローカルへ書き出しました。");
    } catch (error) {
      notify(error?.message || "テストデータを書き出せませんでした。", true);
    }
  });
  elements.historyImportTest.addEventListener("click", () => elements.historyImportFile.click());
  elements.historyImportFile.addEventListener("change", async () => {
    const [file] = elements.historyImportFile.files || [];
    try {
      const result = await importTestDataFile(file);
      if (file) notify(result?.refreshed
        ? "同じテストデータの日時を更新し、使用履歴の先頭へ移動しました。"
        : "テストデータを使用履歴へ読み込みました。");
    } catch (error) {
      notify(error?.message || "テストデータを読み込めませんでした。", true);
    } finally {
      elements.historyImportFile.value = "";
    }
  });
  elements.historyDeleteAll.addEventListener("click", () => {
    if (!historyStore.list().length) return;
    if (!window.confirm("保存された使用履歴をすべて削除します。よろしいですか？")) return;
    historyStore.clearHistory();
    renderHistoryList();
    notify("使用履歴を削除しました。");
  });
  $("#insert-input-sample").addEventListener("click", () => {
    if (elements.input.value.trim() && !window.confirm("入力中の内容をサンプルで上書きします。よろしいですか？")) return;
    CBFSettings.setActiveProfile("fourFour");
    CBFSettings.save(INITIAL_SETTINGS, "fourFour");
    renderSettings(INITIAL_SETTINGS);
    updateSettingsProfileUI();
    elements.lyricHyphenMode.value = "target";
    elements.removalTargets.value = "4,8";
    removalLinked = false;
    elements.removalLinked.checked = false;
    elements.plainEditBars.checked = false;
    updateLyricHyphenControls();
    localStorage.setItem(REMOVAL_STORAGE_KEY, "4,8");
    persistFeatureSettings();
    elements.input.value = INITIAL_INPUT;
    elements.correction.value = INITIAL_CORRECTION;
    correctionSlotCounts = INITIAL_CORRECTION.split("\n").map((line) => CBFCorrectionInput.groups(line).length);
    authoredWhiteNoteCounts = correctionSlotCounts.map(() => 0);
    rowAdoptionModes = INITIAL_CORRECTION.split("\n").map((line) => line ? "edit" : "");
    correctionDisplayStates = rowAdoptionModes.map((mode) => mode ? "edit" : "none");
    lastAppliedCorrectionLines = [];
    inferenceFallbackCorrectionLines = [];
    manualOutputLines.clear();
    outputManuallyEdited = false;
    persistRowAdoptionModes();
    localStorage.setItem(INPUT_STORAGE_KEY, elements.input.value);
    localStorage.setItem(CORRECTION_STORAGE_KEY, elements.correction.value);
    updateCount(elements.input, elements.inputCount);
    updateLineNumbers(elements.input, elements.inputLines);
    updateLineNumbers(elements.correction, elements.correctionLines);
    resetCorrectionHistory();
    convert({ refreshCorrections: false });
    elements.input.focus();
    markActivity();
    notify("入力サンプルを貼り付けました。");
  });
  $("#add-input-brackets").addEventListener("click", () => {
    if (!elements.input.value) return notify("[]を追加する変換前テキストがありません。", true);
    const result = CBFInputBrackets.addMissingBrackets(elements.input.value);
    if (!result.addedCount) return notify("[]を追加する対象はありませんでした。");
    const selectionStart = elements.input.selectionStart;
    elements.input.setRangeText(result.text, 0, elements.input.value.length, "end");
    elements.input.setSelectionRange(Math.min(selectionStart, elements.input.value.length), Math.min(selectionStart, elements.input.value.length));
    elements.input.dispatchEvent(new Event("input", { bubbles: true }));
    elements.input.focus();
    notify(`${result.addedCount}か所へ[]を追加しました。`);
  });
  let pendingNativeBeatReplacement = null;
  elements.correction.addEventListener("input", (event) => {
    if (pendingNativeBeatReplacement) {
      const pending = pendingNativeBeatReplacement;
      pendingNativeBeatReplacement = null;
      elements.correction.value = pending.value;
      elements.correction.setSelectionRange(pending.start, pending.end);
      [...pending.characters].forEach((character) => replaceActiveCorrectionBeat(character));
      return;
    }
    const insertedBeat = CBFCorrectionInput.singleInsertedBeat(correctionHistoryValue, elements.correction.value);
    if (insertedBeat) {
      const currentBeforeInsertion = elements.correction.value.slice(0, insertedBeat.index);
      const lineIndex = currentBeforeInsertion.split(/\r\n|\r|\n/).length - 1;
      const currentLine = elements.correction.value.split(/\r\n|\r|\n/)[lineIndex] || "";
      const insertedWhiteNotes = Math.max(0, (currentLine.match(/@/g) || []).length - (authoredWhiteNoteCounts[lineIndex] || 0));
      const allowedSlots = (correctionSlotCounts[lineIndex] || 0) + insertedWhiteNotes;
      if (allowedSlots > 0 && CBFCorrectionInput.groups(currentLine).length > allowedSlots) {
        const previousLine = correctionHistoryValue.split(/\r\n|\r|\n/)[lineIndex] || "";
        const lineStart = correctionLineOffset(lineIndex);
        const relativeIndex = insertedBeat.index - lineStart;
        const beats = CBFCorrectionInput.beatCharacters(previousLine);
        let slotIndex = beats.findIndex((beat) => beat.index >= relativeIndex);
        if (slotIndex < 0) slotIndex = Math.max(0, beats.length - 1);
        elements.correction.value = correctionHistoryValue;
        selectCorrectionSlot(lineIndex, slotIndex);
        replaceActiveCorrectionBeat(insertedBeat.character);
        return;
      }
    }
    const nativeCharacters = CBFCorrectionInput.normalizeBeatInputSequence(event.data);
    const nativeSymbols = CBFCorrectionInput.normalizeBoundarySymbolSequence(event.data);
    if (
      nativeCharacters
      && ["insertText", "insertCompositionText"].includes(event.inputType)
      && correctionHistoryValue !== elements.correction.value
    ) {
      elements.correction.value = correctionHistoryValue;
      selectCorrectionSlot(
        linkedLineIndex >= 0 ? linkedLineIndex : 0,
        linkedSlotIndex >= 0 ? linkedSlotIndex : 0
      );
      [...nativeCharacters].forEach((character) => replaceActiveCorrectionBeat(character));
      return;
    }
    if (
      nativeSymbols
      && ["insertText", "insertCompositionText"].includes(event.inputType)
      && correctionHistoryValue !== elements.correction.value
    ) {
      elements.correction.value = correctionHistoryValue;
      [...nativeSymbols].forEach((symbol) => {
        const value = elements.correction.value;
        const offset = Math.max(0, Math.min(value.length, correctionSymbolOffset));
        const lineStart = Math.max(value.lastIndexOf("\n", offset - 1), value.lastIndexOf("\r", offset - 1)) + 1;
        const nextLf = value.indexOf("\n", offset);
        const nextCr = value.indexOf("\r", offset);
        const lineEndCandidates = [nextLf, nextCr].filter((position) => position >= 0);
        const lineEnd = lineEndCandidates.length ? Math.min(...lineEndCandidates) : value.length;
        applyBoundarySymbol(symbol, value, lineStart, lineEnd);
      });
      return;
    }
    if (
      event.data
      && ["insertText", "insertCompositionText"].includes(event.inputType)
      && !nativeCharacters
      && !nativeSymbols
      && correctionHistoryValue !== elements.correction.value
    ) {
      elements.correction.value = correctionHistoryValue;
      selectCorrectionSlot(
        linkedLineIndex >= 0 ? linkedLineIndex : 0,
        linkedSlotIndex >= 0 ? linkedSlotIndex : 0
      );
      notify("行修正で使えない文字は入力できません。", true);
      return;
    }
    const caret = elements.correction.selectionStart;
    const previousCorrectionLines = correctionHistoryValue.split(/\r\n|\r|\n/);
    const normalized = elements.correction.value.split(/\r\n|\r|\n/).map((line, index) => {
      const baseLimit = correctionSlotCounts[index] || 0;
      const authoredWhiteNotes = authoredWhiteNoteCounts[index] || 0;
      return CBFCorrectionInput.normalizeLine(line, baseLimit, authoredWhiteNotes);
    }).join("\n");
    if (normalized !== elements.correction.value) {
      elements.correction.value = normalized;
      elements.correction.setSelectionRange(Math.min(caret, normalized.length), Math.min(caret, normalized.length));
      notify("行修正で使えない文字を取り除きました。", true);
    }
    recordCorrectionHistory();
    elements.correctionCount.textContent = `${lineCount(elements.correction.value)}行`;
    updateLineNumbers(elements.correction, elements.correctionLines);
    localStorage.setItem(CORRECTION_STORAGE_KEY, elements.correction.value);
    const correctionLines = elements.correction.value.split(/\r\n|\r|\n/);
    const changedLineIndices = new Set();
    const count = Math.max(correctionLines.length, lastAppliedCorrectionLines.length);
    for (let index = 0; index < count; index += 1) {
      if ((correctionLines[index] || "") !== (lastAppliedCorrectionLines[index] || "")) changedLineIndices.add(index);
    }
    correctionLines.forEach((line, index) => {
      if (line !== (previousCorrectionLines[index] || "") && correctionSlotCounts[index] > 0) rowAdoptionModes[index] = "edit";
    });
    persistRowAdoptionModes();
    updateCorrectionModes();
    scheduleConversion(false, changedLineIndices);
    updateActivePosition(elements.correction, elements.correctionLines, true, "input");
    markActivity();
  });
  function replaceCorrectionText(start, end, replacement, caret) {
    elements.correction.setRangeText(replacement, start, end, "end");
    elements.correction.setSelectionRange(caret, caret);
    elements.correction.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function applyBoundarySymbol(key, value, lineStart, lineEnd) {
    if (correctionSymbolOffset < lineStart || correctionSymbolOffset > lineEnd) return false;
    const edit = CBFCorrectionInput.boundarySymbolEdit(
      value.slice(lineStart, lineEnd),
      correctionSymbolOffset - lineStart,
      key
    );
    if (!edit) return false;
    if (edit.error === "duplicate-bar-anchor") {
      notify("行修正の小節頭記号|は1行に1個だけ指定できます。", true);
      return true;
    }
    if (edit.error === "invalid-sync-boundary") {
      notify("sは行頭、または2つの長さ指定の間へ入力してください。", true);
      return true;
    }
    const editStart = lineStart + edit.start;
    const editEnd = lineStart + edit.end;
    correctionSymbolOffset = lineStart + edit.caret;
    correctionCaretMode = "boundary";
    // Boundary symbols update the active slot too. Preserve every viewport so
    // that a | or / entered in a lower row never jumps the editor to that row.
    restoreEditorScrollPositions(captureEditorScrollPositions());
    replaceCorrectionText(editStart, editEnd, edit.replacement, correctionSymbolOffset);
    return true;
  }
  function replaceActiveCorrectionBeat(inputCharacter) {
    const character = CBFCorrectionInput.normalizeBeatInputCharacter(inputCharacter);
    if (!character) return false;
    correctionCaretMode = "slot";
    const start = elements.correction.selectionStart;
    const end = elements.correction.selectionEnd;
    const value = elements.correction.value;
    const lineStart = Math.max(value.lastIndexOf("\n", start - 1), value.lastIndexOf("\r", start - 1)) + 1;
    const nextLf = value.indexOf("\n", start);
    const nextCr = value.indexOf("\r", start);
    const lineEndCandidates = [nextLf, nextCr].filter((position) => position >= 0);
    const lineEnd = lineEndCandidates.length ? Math.min(...lineEndCandidates) : value.length;
    const lineIndex = value.slice(0, lineStart).split(/\r\n|\r|\n/).length - 1;
    const line = value.slice(lineStart, lineEnd);
    const rawRelativeStart = start - lineStart;
    const rawRelativeEnd = end - lineStart;
    const awaitingWhiteNoteDuration = character !== "@"
      && CBFCorrectionInput.needsInsertedWhiteNoteDuration(line, rawRelativeStart, correctionSlotCounts[lineIndex] || 0, authoredWhiteNoteCounts[lineIndex] || 0);
    // The visible slot selection is authoritative. A browser may briefly
    // collapse the hidden textarea selection between key events; using that
    // caret would target the following beat and appear to skip one slot.
    const selectedSlot = !awaitingWhiteNoteDuration && correctionCaretMode === "slot" && linkedLineIndex === lineIndex
      ? CBFCorrectionInput.slotSelection(line, linkedSlotIndex)
      : null;
    const relativeStart = selectedSlot?.start ?? rawRelativeStart;
    const relativeEnd = selectedSlot?.end ?? rawRelativeEnd;
    const edit = character === "@"
      ? CBFCorrectionInput.whiteNoteEdit(line, relativeStart, relativeEnd)
      : awaitingWhiteNoteDuration
        ? { start: relativeStart, end: relativeStart, replacement: character, caret: relativeStart + 1 }
        : CBFCorrectionInput.smartBeatEdit(line, relativeStart, relativeEnd, character);
    if (!edit) return false;
    let nextCaret = lineStart + edit.caret;
    nextCaret = CBFCorrectionInput.caretAfterLineEdit(value, lineEnd, nextCaret, character === "@");
    replaceCorrectionText(lineStart + edit.start, lineStart + edit.end, edit.replacement, nextCaret);
    if (character === "@") {
      elements.correction.setSelectionRange(nextCaret, nextCaret);
      linkedLineIndex = lineIndex;
      applyLinkedPosition();
    } else if (selectedSlot) {
      const correctionLines = elements.correction.value.split(/\r\n|\r|\n/);
      const editedLine = correctionLines[lineIndex] || "";
      const editedLineSlotCount = CBFCorrectionInput.groups(editedLine).length;
      if (selectedSlot.index + 1 < editedLineSlotCount) selectCorrectionSlot(lineIndex, selectedSlot.index + 1);
      else {
        const nextLineIndex = CBFCorrectionInput.nextLineWithBeatSlot(correctionLines, lineIndex);
        if (nextLineIndex >= 0) selectCorrectionSlot(nextLineIndex, 0);
        else selectCorrectionSlot(lineIndex, Math.max(0, editedLineSlotCount - 1));
      }
    }
    return true;
  }
  const correctionSymbolButtons = [...document.querySelectorAll("[data-correction-symbol]")];
  correctionSymbolButtons.forEach((button) => {
    button.addEventListener("pointerdown", (event) => event.preventDefault());
    button.addEventListener("click", () => {
      const symbol = button.dataset.correctionSymbol || "";
      if (linkedLineIndex < 0 || correctionSymbolOffset < 0) {
        elements.correction.focus();
        notify("先に行修正の数字または数字の間を選んでください。", true);
        return;
      }
      if (symbol === "@") {
        replaceActiveCorrectionBeat(symbol);
        elements.correction.focus({ preventScroll: true });
        return;
      }
      const value = elements.correction.value;
      const offset = Math.max(0, Math.min(value.length, correctionSymbolOffset));
      const lineStart = Math.max(value.lastIndexOf("\n", offset - 1), value.lastIndexOf("\r", offset - 1)) + 1;
      const nextLf = value.indexOf("\n", offset);
      const nextCr = value.indexOf("\r", offset);
      const lineEndCandidates = [nextLf, nextCr].filter((position) => position >= 0);
      const lineEnd = lineEndCandidates.length ? Math.min(...lineEndCandidates) : value.length;
      applyBoundarySymbol(symbol, value, lineStart, lineEnd);
      elements.correction.focus({ preventScroll: true });
    });
  });
  document.querySelectorAll("[data-correction-move]").forEach((button) => {
    button.addEventListener("pointerdown", (event) => event.preventDefault());
    button.addEventListener("click", () => {
      moveCorrectionSlot(button.dataset.correctionMove || "");
      elements.correction.focus({ preventScroll: true });
    });
  });
  document.querySelectorAll("[data-correction-backspace]").forEach((button) => {
    button.addEventListener("pointerdown", (event) => event.preventDefault());
    button.addEventListener("click", () => {
      const start = elements.correction.selectionStart;
      const end = elements.correction.selectionEnd;
      if (start !== end) replaceCorrectionText(start, end, "", start);
      else if (start > 0 && !/[\r\n]/.test(elements.correction.value[start - 1])) replaceCorrectionText(start - 1, start, "", start - 1);
      elements.correction.focus({ preventScroll: true });
    });
  });
  const outputAssistButtons = [...document.querySelectorAll("[data-output-insert], [data-output-move], [data-output-backspace]")];
  const revealEditorAhead = (editor, direction) => {
    const caret = editor.selectionEnd;
    const lineStart = Math.max(editor.value.lastIndexOf("\n", caret - 1), editor.value.lastIndexOf("\r", caret - 1)) + 1;
    const linePrefix = editor.value.slice(lineStart, caret);
    const style = window.getComputedStyle(editor);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return;
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const letterSpacing = Number.parseFloat(style.letterSpacing) || 0;
    const caretX = (Number.parseFloat(style.paddingLeft) || 0) + context.measureText(linePrefix).width + linePrefix.length * letterSpacing;
    const maxScrollLeft = Math.max(0, editor.scrollWidth - editor.clientWidth);
    const caretViewportRatio = direction === "left" ? 0.58 : 0.42;
    const preferredScrollLeft = Math.max(0, Math.min(maxScrollLeft, caretX - editor.clientWidth * caretViewportRatio));
    if ((direction === "left" && preferredScrollLeft < editor.scrollLeft) || (direction === "right" && preferredScrollLeft > editor.scrollLeft)) editor.scrollLeft = preferredScrollLeft;
  };
  const moveOutputCursor = (direction) => {
    const value = elements.output.value;
    const position = elements.output.selectionEnd;
    const lineStart = Math.max(value.lastIndexOf("\n", position - 1), value.lastIndexOf("\r", position - 1)) + 1;
    const nextLineBreak = value.slice(position).search(/\r\n|\r|\n/);
    const lineEnd = nextLineBreak < 0 ? value.length : position + nextLineBreak;
    let nextPosition = position;
    if (direction === "left") nextPosition = Math.max(0, position - 1);
    if (direction === "right") nextPosition = Math.min(value.length, position + 1);
    if (direction === "up" || direction === "down") {
      const column = position - lineStart;
      if (direction === "up" && lineStart > 0) {
        const previousEnd = lineStart - 1;
        const previousStart = Math.max(value.lastIndexOf("\n", previousEnd - 1), value.lastIndexOf("\r", previousEnd - 1)) + 1;
        nextPosition = Math.min(previousStart + column, previousEnd);
      }
      if (direction === "down" && lineEnd < value.length) {
        const nextStart = lineEnd + (value[lineEnd] === "\r" && value[lineEnd + 1] === "\n" ? 2 : 1);
        const afterNextBreak = value.slice(nextStart).search(/\r\n|\r|\n/);
        const nextEnd = afterNextBreak < 0 ? value.length : nextStart + afterNextBreak;
        nextPosition = Math.min(nextStart + column, nextEnd);
      }
    }
    elements.output.setSelectionRange(nextPosition, nextPosition);
    elements.output.focus({ preventScroll: true });
    if (["left", "right"].includes(direction)) requestAnimationFrame(() => revealEditorAhead(elements.output, direction));
  };
  elements.output.addEventListener("keydown", (event) => {
    if (applyKeyTransitionOnEnter(elements.output, event)) return;
    if (!["ArrowLeft", "ArrowRight"].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
    requestAnimationFrame(() => revealEditorAhead(elements.output, event.key === "ArrowLeft" ? "left" : "right"));
  });
  elements.input.addEventListener("keydown", (event) => {
    if (applyKeyTransitionOnEnter(elements.input, event)) return;
    if (!["ArrowLeft", "ArrowRight"].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
    requestAnimationFrame(() => revealEditorAhead(elements.input, event.key === "ArrowLeft" ? "left" : "right"));
  });
  const preserveEditorHorizontalScroll = (editor) => {
    const scrollLeft = editor.scrollLeft;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (editor.scrollLeft === scrollLeft) return;
      editor.scrollLeft = scrollLeft;
      syncHighlightScroll(editor);
    }));
  };
  [elements.input, elements.output].forEach((editor) => {
    editor.addEventListener("keydown", (event) => {
      if (!["ArrowUp", "ArrowDown"].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
      preserveEditorHorizontalScroll(editor);
    });
  });
  outputAssistButtons.forEach((button) => {
    button.addEventListener("pointerdown", (event) => event.preventDefault());
    button.addEventListener("click", () => {
      if (button.hasAttribute("data-output-backspace")) {
        const start = elements.output.selectionStart;
        const end = elements.output.selectionEnd;
        if (start !== end) elements.output.setRangeText("", start, end, "end");
        else if (start > 0) elements.output.setRangeText("", start - 1, start, "end");
        elements.output.dispatchEvent(new Event("input", { bubbles: true }));
        elements.output.focus({ preventScroll: true });
        return;
      }
      const inserted = button.dataset.outputInsert;
      if (inserted) {
        const start = elements.output.selectionStart;
        const end = elements.output.selectionEnd;
        elements.output.setRangeText(inserted, start, end, "end");
        elements.output.setSelectionRange(start + inserted.length, start + inserted.length);
        elements.output.dispatchEvent(new Event("input", { bubbles: true }));
        elements.output.focus({ preventScroll: true });
        return;
      }
      moveOutputCursor(button.dataset.outputMove || "");
    });
  });
  elements.correction.addEventListener("beforeinput", (event) => {
    if (!["insertText", "insertCompositionText"].includes(event.inputType)) return;
    const normalizedCharacters = CBFCorrectionInput.normalizeBeatInputSequence(event.data);
    const characters = event.inputType === "insertCompositionText"
      ? CBFCorrectionInput.incrementalCompositionBeatInput(correctionCompositionValue, normalizedCharacters)
      : normalizedCharacters;
    if (event.inputType === "insertCompositionText") correctionCompositionValue = normalizedCharacters;
    const symbols = CBFCorrectionInput.normalizeBoundarySymbolSequence(event.data);
    if (event.inputType === "insertText" && !event.isComposing
        && CBFCorrectionInput.isRecentInputCommit(pendingCompositionCommit, pendingCompositionCommitAt, characters)) {
      pendingCompositionCommit = "";
      pendingCompositionCommitAt = 0;
      if (event.cancelable) event.preventDefault();
      else {
        pendingNativeBeatReplacement = {
          value: elements.correction.value,
          start: elements.correction.selectionStart,
          end: elements.correction.selectionEnd,
          characters: ""
        };
      }
      return;
    }
    if (symbols && event.cancelable) {
      event.preventDefault();
      [...symbols].forEach((symbol) => {
        const value = elements.correction.value;
        const offset = Math.max(0, Math.min(value.length, correctionSymbolOffset));
        const lineStart = Math.max(value.lastIndexOf("\n", offset - 1), value.lastIndexOf("\r", offset - 1)) + 1;
        const nextLf = value.indexOf("\n", offset);
        const nextCr = value.indexOf("\r", offset);
        const lineEndCandidates = [nextLf, nextCr].filter((position) => position >= 0);
        const lineEnd = lineEndCandidates.length ? Math.min(...lineEndCandidates) : value.length;
        applyBoundarySymbol(symbol, value, lineStart, lineEnd);
      });
      return;
    }
    if (!characters) return;
    if (event.cancelable) {
      event.preventDefault();
      [...characters].forEach((character) => replaceActiveCorrectionBeat(character));
      return;
    }
    pendingNativeBeatReplacement = {
      value: elements.correction.value,
      start: elements.correction.selectionStart,
      end: elements.correction.selectionEnd,
      characters
    };
  });
  elements.correction.addEventListener("compositionstart", () => {
    correctionCompositionValue = "";
    pendingCompositionCommit = "";
    pendingCompositionCommitAt = 0;
  });
  elements.correction.addEventListener("compositionend", (event) => {
    pendingCompositionCommit = CBFCorrectionInput.normalizeBeatInputSequence(event.data) || correctionCompositionValue;
    pendingCompositionCommitAt = Date.now();
    correctionCompositionValue = "";
  });
  elements.correction.addEventListener("paste", (event) => {
    const pastedText = event.clipboardData?.getData("text/plain");
    if (typeof pastedText !== "string") return;
    event.preventDefault();
    const value = elements.correction.value;
    const selectionStart = elements.correction.selectionStart;
    const selectionEnd = elements.correction.selectionEnd;
    const selectedText = value.slice(selectionStart, selectionEnd);
    if (!/[\r\n]/.test(pastedText) && !/[\r\n]/.test(selectedText)) {
      const lineStart = Math.max(value.lastIndexOf("\n", selectionStart - 1), value.lastIndexOf("\r", selectionStart - 1)) + 1;
      const nextLf = value.indexOf("\n", selectionStart);
      const nextCr = value.indexOf("\r", selectionStart);
      const lineEndCandidates = [nextLf, nextCr].filter((position) => position >= 0);
      const lineEnd = lineEndCandidates.length ? Math.min(...lineEndCandidates) : value.length;
      const pasted = CBFCorrectionInput.overwritePastedLine(
        value.slice(lineStart, lineEnd),
        selectionStart - lineStart,
        selectionEnd - lineStart,
        pastedText
      );
      elements.correction.setRangeText(pasted.text, lineStart, lineEnd, "end");
      elements.correction.setSelectionRange(lineStart + pasted.caret, lineStart + pasted.caret);
      elements.correction.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }
    const currentSettings = validatedSettings({ persist: false });
    if (currentSettings.valid) updateMeasureCapacityWarning(currentSettings.values);
    const pasted = CBFCorrectionInput.overwritePastedRows(value, selectionStart, pastedText, correctionSlotCounts.length);
    elements.correction.value = pasted.value;
    elements.correction.setSelectionRange(pasted.caret, pasted.caret);
    elements.correction.dispatchEvent(new Event("input", { bubbles: true }));
    if (pasted.truncatedRows > 0) notify(`貼り付け先がない末尾${pasted.truncatedRows}行は追加しませんでした。`, true);
  });
  elements.correction.addEventListener("keydown", (event) => {
    if (document.activeElement !== elements.correction) return;
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) redoCorrection();
      else undoCorrection();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "y") {
      event.preventDefault();
      redoCorrection();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    // During IME composition, beforeinput is the single source of truth.
    // Handling the same physical key here would advance two row-edit slots.
    if (event.isComposing || event.keyCode === 229) return;
    const start = elements.correction.selectionStart;
    const end = elements.correction.selectionEnd;
    const value = elements.correction.value;
    if (!event.shiftKey && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      moveCorrectionSlot(event.key);
      return;
    }
    if (event.key === "Enter") {
      // Row corrections are structurally one row per converted-output row.
      // Enter navigates instead of creating an extra, unpaired correction row.
      event.preventDefault();
      moveCorrectionSlot("ArrowDown");
      return;
    }
    if (/^[x\^*s|\\\/]$/i.test(event.key)) {
      const lineStart = Math.max(value.lastIndexOf("\n", start - 1), value.lastIndexOf("\r", start - 1)) + 1;
      const nextLf = value.indexOf("\n", start);
      const nextCr = value.indexOf("\r", start);
      const lineEndCandidates = [nextLf, nextCr].filter((position) => position >= 0);
      const lineEnd = lineEndCandidates.length ? Math.min(...lineEndCandidates) : value.length;
      if (applyBoundarySymbol(event.key, value, lineStart, lineEnd)) {
        event.preventDefault();
        return;
      }
    }
    if (event.key === "Backspace") {
      event.preventDefault();
      if (start !== end) {
        const lineStart = Math.max(value.lastIndexOf("\n", start - 1), value.lastIndexOf("\r", start - 1)) + 1;
        const nextLf = value.indexOf("\n", start);
        const nextCr = value.indexOf("\r", start);
        const lineEndCandidates = [nextLf, nextCr].filter((position) => position >= 0);
        const lineEnd = lineEndCandidates.length ? Math.min(...lineEndCandidates) : value.length;
        const clear = end <= lineEnd ? CBFCorrectionInput.deletionEdit(value.slice(lineStart, lineEnd), start - lineStart, end - lineStart) : null;
        if (clear) replaceCorrectionText(lineStart + clear.start, lineStart + clear.end, clear.replacement, lineStart + clear.caret);
        else {
          const replacement = value.slice(start, end).replace(/[^\r\n]/g, "");
          replaceCorrectionText(start, end, replacement, start);
        }
      } else if (start > 0 && !/[\r\n]/.test(value[start - 1])) {
        replaceCorrectionText(start - 1, start, "", start - 1);
      }
      return;
    }
    if (event.key === "Delete") {
      event.preventDefault();
      if (start !== end) {
        const lineStart = Math.max(value.lastIndexOf("\n", start - 1), value.lastIndexOf("\r", start - 1)) + 1;
        const nextLf = value.indexOf("\n", start);
        const nextCr = value.indexOf("\r", start);
        const lineEndCandidates = [nextLf, nextCr].filter((position) => position >= 0);
        const lineEnd = lineEndCandidates.length ? Math.min(...lineEndCandidates) : value.length;
        const clear = end <= lineEnd ? CBFCorrectionInput.deletionEdit(value.slice(lineStart, lineEnd), start - lineStart, end - lineStart) : null;
        if (clear) replaceCorrectionText(lineStart + clear.start, lineStart + clear.end, clear.replacement, lineStart + clear.caret);
        else {
          const replacement = value.slice(start, end).replace(/[^\r\n]/g, "");
          replaceCorrectionText(start, end, replacement, start);
        }
      } else if (start < value.length && !/[\r\n]/.test(value[start])) {
        replaceCorrectionText(start, start + 1, "", start);
      }
      return;
    }
    if (/^[sn]$/i.test(event.key)) {
      event.preventDefault();
      const lineStart = Math.max(value.lastIndexOf("\n", start - 1), value.lastIndexOf("\r", start - 1)) + 1;
      const nextLf = value.indexOf("\n", start);
      const nextCr = value.indexOf("\r", start);
      const lineEndCandidates = [nextLf, nextCr].filter((position) => position >= 0);
      const lineEnd = lineEndCandidates.length ? Math.min(...lineEndCandidates) : value.length;
      const line = value.slice(lineStart, lineEnd);
      if (event.key.toLowerCase() === "n") {
        replaceCorrectionText(lineStart, lineEnd, "n", lineStart + 1);
        return;
      }
      const relativeStart = start - lineStart;
      const relativeEnd = end - lineStart;
      const removal = CBFCorrectionInput.syncopationRemovalEdit(line, relativeStart, relativeEnd);
      if (removal) {
        replaceCorrectionText(lineStart + removal.start, lineStart + removal.end, removal.replacement, lineStart + removal.caret);
        return;
      }
      const before = line.slice(0, relativeStart);
      const after = line.slice(relativeEnd);
      const hasPreviousValue = /[0-9a-i@]/i.test(before);
      const hasFollowingValue = /[0-9a-i@]/i.test(after);
      const selectedBeat = relativeEnd - relativeStart === 1 && /^[0-9a-i@]$/i.test(line.slice(relativeStart, relativeEnd));
      if (selectedBeat && (hasFollowingValue || relativeEnd === line.length)) {
        replaceCorrectionText(end, end, "s", end + 1);
      } else if (hasPreviousValue && (hasFollowingValue || relativeStart === line.length)) {
        replaceCorrectionText(start, end, "s", start + 1);
      } else if (!line.trim() || line.trim().toLowerCase() === "n" || !hasPreviousValue) {
        replaceCorrectionText(lineStart, lineEnd, "s", lineStart + 1);
      } else notify("sは行頭、または2つの長さ指定の間へ入力してください。", true);
      return;
    }
    if (/^[x\^*]$/i.test(event.key)) {
      const lineStart = Math.max(value.lastIndexOf("\n", start - 1), value.lastIndexOf("\r", start - 1)) + 1;
      const nextLf = value.indexOf("\n", start);
      const nextCr = value.indexOf("\r", start);
      const lineEndCandidates = [nextLf, nextCr].filter((position) => position >= 0);
      const lineEnd = lineEndCandidates.length ? Math.min(...lineEndCandidates) : value.length;
      if (end > start) {
        const selectedBeat = value.slice(start, end).search(/[0-9a-i@]/i);
        if (selectedBeat >= 0) {
          const insertionPoint = event.key.toLowerCase() === "x" ? start + selectedBeat + 1 : start + selectedBeat;
          event.preventDefault();
          replaceCorrectionText(insertionPoint, insertionPoint, event.key.toLowerCase(), insertionPoint + 1);
          return;
        }
      } else if (start === lineEnd) {
        const insertion = CBFCorrectionInput.modifierInsertionAtLineEnd(value.slice(lineStart, lineEnd), event.key);
        if (insertion) {
          event.preventDefault();
          replaceCorrectionText(lineStart + insertion.start, lineStart + insertion.end, insertion.replacement, lineStart + insertion.caret);
          return;
        }
      }
    }
    if (event.key === "|") {
      event.preventDefault();
      const lineStart = Math.max(value.lastIndexOf("\n", start - 1), value.lastIndexOf("\r", start - 1)) + 1;
      const nextLf = value.indexOf("\n", start);
      const nextCr = value.indexOf("\r", start);
      const lineEndCandidates = [nextLf, nextCr].filter((position) => position >= 0);
      const lineEnd = lineEndCandidates.length ? Math.min(...lineEndCandidates) : value.length;
      const line = value.slice(lineStart, lineEnd);
      if (line.includes("|")) {
        notify("行修正の小節頭記号|は1行に1個だけ指定できます。", true);
        return;
      }
      replaceCorrectionText(start, start, "|", start + 1);
      return;
    }
    if (/^[j-mo-rt-wyz]$/i.test(event.key)) {
      event.preventDefault();
      notify("長さはa～g（10～16）、h（24）、i（32）で指定してください。", true);
      return;
    }
    // Beats are intentionally handled only by beforeinput/input. This gives
    // full-width IME input and numpad input the exact same single route.
    if (/^[0-9a-i@]$/i.test(event.key)) return;
    if (event.key.length === 1 && !event.isComposing) {
      event.preventDefault();
      notify("行修正で使えない文字は入力できません。", true);
    }
  });
  elements.correctionUndo.addEventListener("click", undoCorrection);
  elements.correctionRedo.addEventListener("click", redoCorrection);
  elements.input.addEventListener("input", () => {
    localStorage.setItem(INPUT_STORAGE_KEY, elements.input.value);
    updateCount(elements.input, elements.inputCount);
    updateLineNumbers(elements.input, elements.inputLines);
    const currentLines = elements.input.value.split(/\r\n|\r|\n/);
    if (currentLines.length !== lastConvertedInputLines.length) {
      const previousLines = [...lastConvertedInputLines];
      const mapping = CBFConverter.alignMusicLineIndices(previousLines, currentLines);
      sourceLineIds = CBFOutputOverrides.remapIds(mapping, sourceLineIds, createSourceLineId);
      syncManualOutputLinesFromOverrides();
      persistOutputLayer();
      const chordCounts = (lines) => lines.map((line) => CBFConverter.parseTokens(line).filter((token) => token.kind === "chord").length);
      const previousChordCounts = chordCounts(previousLines);
      const currentChordCounts = chordCounts(currentLines);
      const synchronizeLineBreaks = (values) => CBFCorrectionInput.synchronizeLineBreakLayout(
        previousLines.join("\n"),
        currentLines.join("\n"),
        values,
        previousChordCounts,
        currentChordCounts
      );
      const lineBreakSync = synchronizeLineBreaks(elements.correction.value.split(/\r\n|\r|\n/));
      const lineBreakOnly = Boolean(lineBreakSync);
      const redistributeCorrections = (values) => synchronizeLineBreaks(values)?.corrections || null;
      const remapArray = (values, fallback) => currentLines.map((_line, index) => {
        const previousIndex = mapping[index];
        return previousIndex >= 0 ? values[previousIndex] ?? fallback : fallback;
      });
      const remapText = (value) => remapArray(String(value || "").split(/\r\n|\r|\n/), "").join("\n");
      const previousCorrectionLines = elements.correction.value.split(/\r\n|\r|\n/);
      const redistributedCorrections = lineBreakSync?.corrections || null;
      const remapCorrectionArray = (values, fallback = "") => {
        const redistributed = redistributeCorrections(values);
        return currentLines.map((_line, index) => {
          if (lineBreakOnly && redistributed?.preserved[index]) return redistributed.lines[index];
          const previousIndex = mapping[index];
          if (previousIndex >= 0) return values[previousIndex] ?? fallback;
          return redistributed?.preserved[index] ? redistributed.lines[index] : fallback;
        });
      };
      const previousOutputLines = elements.output.value.split(/\r\n|\r|\n/);
      const previousManualOutputLines = new Set(manualOutputLines);
      const changedLines = new Set();
      currentLines.forEach((line, index) => {
        const previousIndex = mapping[index];
        if (previousIndex < 0 || line !== previousLines[previousIndex]) changedLines.add(index);
      });
      elements.correction.value = remapCorrectionArray(previousCorrectionLines).join("\n");
      inferenceFallbackCorrectionLines = remapCorrectionArray(inferenceFallbackCorrectionLines);
      lastAppliedCorrectionLines = remapCorrectionArray(lastAppliedCorrectionLines);
      correctionSlotCounts = currentLines.map((_line, index) => {
        if (lineBreakOnly && redistributedCorrections?.preserved[index]) return CBFCorrectionInput.groups(redistributedCorrections.lines[index]).length;
        const previousIndex = mapping[index];
        if (previousIndex >= 0) return correctionSlotCounts[previousIndex] || 0;
        return redistributedCorrections?.preserved[index] ? CBFCorrectionInput.groups(redistributedCorrections.lines[index]).length : 0;
      });
      authoredWhiteNoteCounts = lineBreakOnly
        ? currentLines.map((line) => CBFConverter.parseTokens(line).filter((token) => token.kind === "text" && token.value === "[○]").length)
        : remapArray(authoredWhiteNoteCounts, 0);
      correctionDisplayStates = currentLines.map((_line, index) => {
        const previousIndex = mapping[index];
        if (previousIndex >= 0) return correctionDisplayStates[previousIndex] || "none";
        return redistributedCorrections?.preserved[index] ? "edit" : "none";
      });
      rowAdoptionModes = currentLines.map((_line, index) => {
        const previousIndex = mapping[index];
        if (previousIndex >= 0) return rowAdoptionModes[previousIndex] || "";
        return redistributedCorrections?.preserved[index] && redistributedCorrections.lines[index] ? "edit" : "";
      });
      manualOutputLines = new Set();
      const remappedOutputLines = remapArray(previousOutputLines, "");
      mapping.forEach((previousIndex, index) => {
        if (previousIndex >= 0 && previousManualOutputLines.has(previousIndex)) manualOutputLines.add(index);
      });
      elements.output.value = remappedOutputLines.join("\n");
      outputHighlightValue = elements.output.value;
      outputAddedOffsets.clear();
      correctionUndoStack = correctionUndoStack.map(remapText);
      correctionRedoStack = correctionRedoStack.map(remapText);
      correctionHistoryValue = remapText(correctionHistoryValue);
      lastConvertedInputLines = currentLines.map((line, index) => {
        const previousIndex = mapping[index];
        if (previousIndex >= 0) return previousLines[previousIndex] || "";
        return redistributedCorrections?.preserved[index] ? line : "";
      });
      persistRowAdoptionModes();
      localStorage.setItem(CORRECTION_STORAGE_KEY, elements.correction.value);
      updateCorrectionHistoryButtons();
      updateCorrectionModes();
      scheduleConversion(false, null, changedLines);
    }
    else {
      normalizeSourceLineIds();
      syncManualOutputLinesFromOverrides();
      persistOutputLayer();
      const changedLines = new Set();
      currentLines.forEach((line, index) => { if (line !== (lastConvertedInputLines[index] || "")) changedLines.add(index); });
      changedLines.forEach((index) => {
        const musicStructureChanged = !CBFConverter.sameMusicStructure(lastConvertedInputLines[index] || "", currentLines[index] || "");
        if (musicStructureChanged && rowAdoptionModes[index] !== "source") rowAdoptionModes[index] = "auto";
      });
      persistRowAdoptionModes();
      updateCorrectionModes();
      scheduleConversion(false, null, changedLines);
    }
    markActivity();
  });
  $("#paste-input").addEventListener("click", async () => {
    try {
      const text = await readClipboard();
      const scrollPositions = captureEditorScrollPositions();
      elements.input.setRangeText(text, elements.input.selectionStart, elements.input.selectionEnd, "end");
      elements.input.dispatchEvent(new Event("input", { bubbles: true }));
      requestAnimationFrame(() => scheduleConversion(false));
      elements.input.focus();
      restoreEditorScrollPositions(scrollPositions);
      notify("変換前へ貼り付けました。");
    } catch (_error) {
      elements.input.focus();
      notify("ブラウザの許可が必要です。変換前で Ctrl+V を押してください。", true);
    }
  });
  $("#copy-output").addEventListener("click", async () => {
    if (!elements.output.value) return notify("コピーする結果がありません。", true);
    try { await writeClipboard(elements.output.value); saveCurrentHistory(false, true); notify("変換結果をコピーしました。"); }
    catch (_error) { notify("コピーできませんでした。結果を選択してコピーしてください。", true); elements.output.select(); }
  });
  elements.output.addEventListener("input", () => {
    const previousValue = outputHighlightValue;
    outputAddedOffsets = new Set(CBFConverter.remapTrackedCharacterIndices(previousValue, elements.output.value, outputAddedOffsets));
    outputHighlightValue = elements.output.value;
    const previousLines = previousValue.split("\n");
    const currentLines = elements.output.value.split("\n");
    const changedLineIndices = new Set();
    if (previousLines.length === currentLines.length) {
      currentLines.forEach((line, index) => { if (line !== previousLines[index]) changedLineIndices.add(index); });
    } else currentLines.forEach((_line, index) => changedLineIndices.add(index));
    changedLineIndices.forEach((index) => {
      if (correctionSlotCounts[index] > 0) rowAdoptionModes[index] = "edit";
    });
    persistRowAdoptionModes();
    const correctionLines = elements.correction.value.split(/\r\n|\r|\n/);
    const settings = validatedSettings({ persist: false });
    if (settings.valid && previousLines.length !== currentLines.length) {
      const lineMapping = CBFConverter.alignLineIndices(previousLines, currentLines);
      const previousManualLines = new Set(manualOutputLines);
      const previousFallbackLines = [...inferenceFallbackCorrectionLines];
      const previousSlotCounts = [...correctionSlotCounts];
      const previousWhiteNoteCounts = [...authoredWhiteNoteCounts];
      const currentOutputSlotCounts = currentLines.map((line) => CBFConverter.parseTokens(line)
        .filter((token) => token.kind === "chord" || (token.kind === "text" && token.value === "[○]")).length);
      const lineBreakSync = CBFCorrectionInput.synchronizeLineBreakLayout(
        previousLines.join("\n"),
        currentLines.join("\n"),
        correctionLines,
        previousSlotCounts,
        currentOutputSlotCounts
      );
      const lineBreakOnly = Boolean(lineBreakSync);
      const redistributedCorrections = lineBreakSync?.corrections || null;
      const nextCorrectionLines = [];
      const nextFallbackLines = [];
      const nextSlotCounts = [];
      const nextWhiteNoteCounts = [];
      const nextManualLines = new Set();
      currentLines.forEach((line, lineIndex) => {
        const previousIndex = lineMapping[lineIndex];
        const redistributedCorrection = redistributedCorrections?.preserved[lineIndex]
          ? redistributedCorrections.lines[lineIndex]
          : null;
        const mappedCorrection = redistributedCorrection ?? (previousIndex >= 0 ? correctionLines[previousIndex] || "" : "");
        const mappedFallback = previousIndex >= 0 ? previousFallbackLines[previousIndex] || mappedCorrection : "";
        const inferred = redistributedCorrection !== null
          ? redistributedCorrection
          : previousIndex >= 0
          ? mappedCorrection
          : CBFConverter.recoverBeatCodeFromRenderedLine(line, mappedFallback, settings.values) || "";
        nextCorrectionLines[lineIndex] = inferred;
        nextFallbackLines[lineIndex] = inferred || mappedFallback;
        nextSlotCounts[lineIndex] = redistributedCorrection !== null
          ? CBFCorrectionInput.groups(redistributedCorrection).length
          : previousIndex >= 0
          ? previousSlotCounts[previousIndex] || 0
          : CBFCorrectionInput.groups(inferred).length;
        nextWhiteNoteCounts[lineIndex] = lineBreakOnly
          ? CBFConverter.parseTokens(line).filter((token) => token.kind === "text" && token.value === "[○]").length
          : previousIndex >= 0 ? previousWhiteNoteCounts[previousIndex] || 0 : 0;
        if (previousIndex < 0 || previousManualLines.has(previousIndex)) nextManualLines.add(lineIndex);
      });
      elements.correction.value = nextCorrectionLines.join("\n");
      inferenceFallbackCorrectionLines = nextFallbackLines;
      correctionSlotCounts = nextSlotCounts;
      authoredWhiteNoteCounts = nextWhiteNoteCounts;
      lastAppliedCorrectionLines = [...nextCorrectionLines];
      manualOutputLines = nextManualLines;
    } else if (settings.valid) {
      changedLineIndices.forEach((lineIndex) => {
        const enteredCode = correctionLines[lineIndex] || "";
        const fallbackCode = enteredCode || inferenceFallbackCorrectionLines[lineIndex] || "";
        const inferred = CBFConverter.recoverBeatCodeFromRenderedLine(currentLines[lineIndex], fallbackCode, settings.values);
        if (inferred && (enteredCode || inferred !== inferenceFallbackCorrectionLines[lineIndex])) {
          correctionLines[lineIndex] = inferred;
          lastAppliedCorrectionLines[lineIndex] = inferred;
          inferenceFallbackCorrectionLines[lineIndex] = inferred;
        } else if (!inferred) {
          const protectedCode = CBFConverter.protectUnsupportedCorrectionSlots(fallbackCode, currentLines[lineIndex]);
          correctionLines[lineIndex] = protectedCode;
          lastAppliedCorrectionLines[lineIndex] = protectedCode;
          inferenceFallbackCorrectionLines[lineIndex] = protectedCode;
          rowAdoptionModes[lineIndex] = "fixed";
        }
      });
      elements.correction.value = correctionLines.join("\n");
    }
    if (previousLines.length === currentLines.length) changedLineIndices.forEach((lineIndex) => manualOutputLines.add(lineIndex));

    // A manual output line break can occasionally be combined with another
    // edit, so the strict line-break redistributor above cannot prove a pure
    // split. Never leave orphan correction rows in that case: preserve every
    // line that can still be matched, infer only genuinely new rows, and drop
    // only rows that no longer have a result-line counterpart.
    const alignedCorrectionLines = elements.correction.value.split(/\r\n|\r|\n/);
    if (alignedCorrectionLines.length !== currentLines.length) {
      const lineMapping = CBFConverter.alignLineIndices(previousLines, currentLines);
      const previousManualLines = new Set(manualOutputLines);
      const previousFallbackLines = [...inferenceFallbackCorrectionLines];
      const previousSlotCounts = [...correctionSlotCounts];
      const currentOutputSlotCounts = currentLines.map((line) => CBFConverter.parseTokens(line)
        .filter((token) => token.kind === "chord" || (token.kind === "text" && token.value === "[○]")).length);
      const splitSync = CBFCorrectionInput.synchronizeLineBreakLayout(
        previousLines.join("\n"),
        currentLines.join("\n"),
        alignedCorrectionLines,
        previousSlotCounts,
        currentOutputSlotCounts
      )?.corrections;
      const nextCorrections = [];
      const nextFallbacks = [];
      const nextSlots = [];
      const nextManualLines = new Set();
      currentLines.forEach((line, lineIndex) => {
        const previousIndex = lineMapping[lineIndex];
        const redistributed = splitSync?.preserved[lineIndex] ? splitSync.lines[lineIndex] : null;
        const mapped = redistributed ?? (previousIndex >= 0 ? alignedCorrectionLines[previousIndex] || "" : "");
        const fallback = previousIndex >= 0 ? previousFallbackLines[previousIndex] || mapped : mapped;
        const inferred = (redistributed ?? mapped) || CBFConverter.recoverBeatCodeFromRenderedLine(line, fallback, settings.values) || "";
        nextCorrections.push(inferred);
        nextFallbacks.push(inferred || fallback);
        nextSlots.push(redistributed !== null
          ? CBFCorrectionInput.groups(redistributed).length
          : previousIndex >= 0 ? previousSlotCounts[previousIndex] || 0 : CBFCorrectionInput.groups(inferred).length);
        if (previousIndex < 0 || previousManualLines.has(previousIndex)) nextManualLines.add(lineIndex);
      });
      elements.correction.value = nextCorrections.join("\n");
      inferenceFallbackCorrectionLines = nextFallbacks;
      correctionSlotCounts = nextSlots;
      lastAppliedCorrectionLines = [...nextCorrections];
      manualOutputLines = nextManualLines;
    }
    outputManuallyEdited = manualOutputLines.size > 0;
    localStorage.setItem(CORRECTION_STORAGE_KEY, elements.correction.value);
    elements.correctionCount.textContent = `${lineCount(elements.correction.value)}行`;
    updateLineNumbers(elements.correction, elements.correctionLines);
    updateCorrectionModes();
    elements.finalOutput.value = elements.output.value;
    renderFinalPreview();
    updateCount(elements.output, elements.outputCount);
    updateLineNumbers(elements.output, elements.outputLines);
    updateCount(elements.finalOutput, elements.finalOutputCount);
    updateLineNumbers(elements.finalOutput, elements.finalOutputLines);
    outputOverrides = CBFOutputOverrides.capture(
      lastGeneratedOutput,
      elements.output.value,
      sourceLineIds,
      CBFConverter.alignLineIndices
    );
    syncManualOutputLinesFromOverrides();
    persistOutputLayer();
    updateCorrectionModes();
    markActivity();
  });
  elements.removalTargets.addEventListener("input", () => {
    removalLinked = false;
    elements.removalLinked.checked = false;
    persistFeatureSettings();
    updateRenderedOutputs();
    markActivity();
  });
  elements.removalLinked.addEventListener("change", () => {
    removalLinked = elements.removalLinked.checked;
    if (removalLinked) {
      elements.removalTargets.value = String(rawSettings().hyphenUnit);
      localStorage.setItem(REMOVAL_STORAGE_KEY, elements.removalTargets.value);
    }
    persistFeatureSettings();
    updateRenderedOutputs();
    markActivity();
  });
  elements.lyricHyphenMode.addEventListener("change", () => {
    updateLyricHyphenControls();
    persistFeatureSettings();
    updateRenderedOutputs();
    markActivity();
  });
  $("#copy-final-output").addEventListener("click", async () => {
    if (!elements.finalOutput.value) return notify("コピーする譜面用テキストがありません。", true);
    try { await writeClipboard(elements.finalOutput.value); saveCurrentHistory(false, true); notify("譜面用テキストをコピーしました。"); }
    catch (_error) { notify("コピーできませんでした。変換後の内容を選択してコピーしてください。", true); elements.output.select(); }
  });
  function setCommittedOutputOpen(open) {
    elements.committedOutputShell.classList.toggle("committed-collapsed", !open);
    if (!open) {
      elements.committedOutput.scrollTop = 0;
      elements.committedOutputLines.scrollTop = 0;
      syncHighlightScroll(elements.committedOutput);
    }
    elements.committedOutputToggle.setAttribute("aria-expanded", String(open));
    elements.committedOutputToggle.textContent = open ? "閉じる▲" : "開く▼";
  }
  $("#commit-preview-to-output").addEventListener("click", () => {
    if (!elements.finalOutput.value) return notify("確定する譜面がありません。", true);
    const next = transposedPreviewText();
    if (elements.committedOutput.value && elements.committedOutput.value !== next && !window.confirm("確定譜面テキストを現在のプレビューで上書きします。よろしいですか？")) return;
    elements.committedOutput.value = next;
    localStorage.setItem(COMMITTED_OUTPUT_STORAGE_KEY, next);
    updateCount(elements.committedOutput, elements.committedOutputCount);
    updateLineNumbers(elements.committedOutput, elements.committedOutputLines);
    publishScoreWindow();
    setCommittedOutputOpen(true);
    markActivity();
    notify("譜面プレビューを確定譜面テキストへ保存しました。");
  });
  elements.committedOutputToggle.addEventListener("click", () => setCommittedOutputOpen(elements.committedOutputShell.classList.contains("committed-collapsed")));
  elements.openCommittedPreview.addEventListener("click", () => publishScoreWindow());
  elements.openRealtimeEditor.addEventListener("click", (event) => {
    // 05 is the editable source. 06 only renders that text as a score, so
    // opening the realtime editor must carry the exact 05 text across.
    const currentText = elements.output.value;
    let savedDraft = null;
    try { savedDraft = JSON.parse(localStorage.getItem(COMMITTED_DRAFT_STORAGE_KEY) || "null"); } catch (_error) { savedDraft = null; }
    const hasDifferentDraft = Boolean(savedDraft?.text) && savedDraft.text !== currentText;
    if (hasDifferentDraft && !window.confirm("リアルタイム編集ページには前回の編集内容があります。\n現在の変換結果で上書きして開きますか？\n\n［OK］上書きして開く\n［キャンセル］次の選択へ")) {
      if (!window.confirm("前回の内容を残して開きますか？\n\n［OK］前回の内容を残して開く\n［キャンセル］開くのをやめる")) {
        event.preventDefault();
        return;
      }
      elements.openRealtimeEditor.href = "committed-preview.html?draft=keep";
      setTimeout(() => { elements.openRealtimeEditor.href = "committed-preview.html"; }, 0);
      return;
    }
    elements.openRealtimeEditor.href = "committed-preview.html";
    elements.committedOutput.value = currentText;
    localStorage.setItem(COMMITTED_OUTPUT_STORAGE_KEY, elements.committedOutput.value);
    localStorage.setItem(COMMITTED_DRAFT_STORAGE_KEY, JSON.stringify({ text: elements.committedOutput.value, updatedAt: Date.now() }));
    updateCount(elements.committedOutput, elements.committedOutputCount);
    updateLineNumbers(elements.committedOutput, elements.committedOutputLines);
    publishScoreWindow();
  });
  elements.committedOutput.addEventListener("input", () => {
    localStorage.setItem(COMMITTED_OUTPUT_STORAGE_KEY, elements.committedOutput.value);
    updateCount(elements.committedOutput, elements.committedOutputCount);
    updateLineNumbers(elements.committedOutput, elements.committedOutputLines);
    publishScoreWindow();
    markActivity();
  });
  elements.committedOutput.addEventListener("scroll", () => {
    elements.committedOutputLines.scrollTop = elements.committedOutput.scrollTop;
    syncHighlightScroll(elements.committedOutput);
  });
  $("#copy-committed-output").addEventListener("click", async () => {
    if (!elements.committedOutput.value) return notify("コピーする確定譜面がありません。", true);
    try { await writeClipboard(elements.committedOutput.value); saveCurrentHistory(false, true); notify("確定譜面をコピーしました。"); }
    catch (_error) { notify("確定譜面をコピーできませんでした。", true); elements.committedOutput.select(); }
  });
  $("#settings-reset").addEventListener("click", () => {
    const currentValues = CBFSettings.load();
    const profile = CBFSettings.inferProfileFromValues(currentValues);
    const label = settingsProfileLabel(profile);
    if (!window.confirm(`${label}の設定を初期値に戻します。よろしいですか？`)) return;
    const values = CBFSettings.resetForValues(currentValues);
    renderSettings(values);
    updateSettingsProfileUI();
    if (removalLinked) {
      elements.removalTargets.value = String(values.hyphenUnit);
      localStorage.setItem(REMOVAL_STORAGE_KEY, elements.removalTargets.value);
    }
    convert({ refreshCorrections: true });
    markActivity();
    notify(`${label}の設定を初期値へ戻しました。`);
  });
  function setSettingsMode(mode) {
    settingsMode = mode === "expanded" ? "compact" : mode;
    elements.settingsShell.style.removeProperty("height");
    elements.settingsPanel.classList.toggle("settings-closed", mode === "closed");
    elements.settingsPanel.classList.toggle("settings-compact", settingsMode === "compact");
    elements.settingsPanel.classList.toggle("settings-examples-closed", !settingsExamplesOpen);
    elements.settingsPanel.classList.remove("settings-expanded");
    elements.settingsBody.hidden = mode === "closed";
    elements.settingsToggle.setAttribute("aria-expanded", String(settingsMode !== "closed"));
    elements.settingsToggle.textContent = settingsMode === "closed" ? "設定を開く▼" : "設定を閉じる▼";
    elements.settingsExampleToggle.hidden = settingsMode === "closed";
    positionSettingsPanel();
  }
  function setSettingsExamplesOpen(open) {
    settingsExamplesOpen = Boolean(open);
    elements.settingsPanel.classList.toggle("settings-examples-closed", !settingsExamplesOpen);
    elements.settingsExampleToggle.setAttribute("aria-expanded", String(settingsExamplesOpen));
    elements.settingsExampleToggle.textContent = "説明・使用例▼";
    positionSettingsPanel();
    syncResultRowAlignment();
  }
  elements.settingsToggle.addEventListener("click", () => setSettingsMode(settingsMode === "closed" ? "compact" : "closed"));
  elements.settingsExampleToggle.addEventListener("click", () => setSettingsExamplesOpen(!settingsExamplesOpen));
  elements.settingsAdvanced?.addEventListener("toggle", () => {
    const summary = elements.settingsAdvanced.querySelector("summary");
    if (summary) summary.textContent = elements.settingsAdvanced.open ? "詳細設定▲" : "詳細設定▼";
  });
  elements.measureCapacityWarningOpen.addEventListener("click", () => {
    const detected = Number(elements.measureCapacityWarningOpen.dataset.detected);
    const targetProfile = elements.measureCapacityWarningOpen.dataset.profile;
    let formatting = {};
    try { formatting = JSON.parse(elements.measureCapacityWarningOpen.dataset.formatting || "{}"); } catch (_error) { formatting = {}; }
    if ((!Number.isInteger(detected) || detected < 2) && !formatting.hyphenUnit && !formatting.hyphenSpacing) return;
    elements.measureCapacityWarning.hidden = true;
    syncResultRowAlignment();
    if (targetProfile === "sixEight" && CBFSettings.activeProfile() !== "sixEight") {
      const values = CBFSettings.setActiveProfile("sixEight");
      renderSettings(values);
      updateSettingsProfileUI();
      if (removalLinked) {
        elements.removalTargets.value = String(values.hyphenUnit);
        localStorage.setItem(REMOVAL_STORAGE_KEY, elements.removalTargets.value);
      }
    }
    setSettingsMode("compact");
    requestAnimationFrame(() => {
      const changes = {
        measureCapacity: detected >= 2 ? detected : null,
        hyphenUnit: Number.isInteger(formatting.hyphenUnit) ? formatting.hyphenUnit : null,
        hyphenSpacing: Number.isInteger(formatting.hyphenSpacing) ? formatting.hyphenSpacing : null
      };
      Object.entries(changes).forEach(([key, value]) => {
        const input = $(`#setting-${key}`);
        if (value === null || !input) return;
        if (key === "measureCapacity") input.value = String(detected);
        else input.value = String(value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
      $("#setting-measureCapacity")?.focus();
    });
  });
  elements.measureCapacityWarningDismiss.addEventListener("click", () => {
    elements.measureCapacityWarning.hidden = true;
    elements.measureCapacityWarningText.textContent = "";
    syncResultRowAlignment();
  });
  function positionSettingsPanel() {
    Object.assign(elements.settingsPanel.style, { left: "", top: "", width: "", height: "" });
    positionFrameResizeEdges();
  }
  function positionFrameResizeEdges() {
    document.querySelectorAll(".frame-resize-edge").forEach((edge) => {
      const panelName = edge.dataset.panel || "";
      const row = edge.dataset.row || "";
      const container = panelName === "settings" ? elements.settingsPanel : edge.closest(".editor-card");
      const target = panelName === "settings"
        ? elements.settingsShell
        : container?.classList.contains("correction-card")
          ? elements.correctionShell
          : row === "top"
            ? elements.inputShell
            : row === "final"
              ? elements.finalOutputShell
              : elements.outputShell;
      if (!target || !container) return;
      const targetRect = target.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const edgeY = edge.dataset.edge === "top" ? targetRect.top : targetRect.bottom;
      edge.style.top = `${Math.round(edgeY - containerRect.top - 4)}px`;
      edge.style.bottom = "auto";
    });
  }
  function saveLayout() {
    const displayHeight = Number.parseFloat(elements.displaySettingsShell.style.height);
    const settingsHeight = Number.parseFloat(elements.settingsShell.style.height);
    const layout = {
      leftWidth: elements.correctionCard.getBoundingClientRect().width,
      topHeight: elements.inputShell.getBoundingClientRect().height,
      resultHeight: elements.outputShell.getBoundingClientRect().height,
      finalHeight: elements.finalOutputShell.getBoundingClientRect().height,
      committedHeight: elements.committedOutputShell.classList.contains("committed-collapsed")
        ? Number.parseFloat(elements.workspace.style.getPropertyValue("--committed-editor-height")) || null
        : elements.committedOutputShell.getBoundingClientRect().height,
      displayHeight: Number.isFinite(displayHeight) ? displayHeight : null,
      settingsHeight: Number.isFinite(settingsHeight) ? settingsHeight : null
    };
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  }
  function resetLayout() {
    ["--left-column-width", "--top-editor-height", "--result-editor-height", "--final-editor-height", "--committed-editor-height"].forEach((property) => elements.workspace.style.removeProperty(property));
    elements.displaySettingsShell.style.removeProperty("height");
    elements.settingsShell.style.removeProperty("height");
    elements.correctionGuide.style.removeProperty("height");
    localStorage.removeItem(LAYOUT_STORAGE_KEY);
    applyTheme("light");
    elements.fontSelect.value = "meiryo";
    applyEditorFont("meiryo");
    applyEditorFontSize(14);
    updateFontCycleButtons();
    elements.scrollSync.checked = true;
    scrollSyncEnabled = true;
    localStorage.setItem(SCROLL_SYNC_STORAGE_KEY, "true");
    elements.textColoring.checked = true;
    document.documentElement.classList.add("colorized-editors");
    localStorage.setItem(TEXT_COLORING_STORAGE_KEY, "true");
    elements.boldCode.checked = true;
    document.documentElement.classList.add("bold-chords");
    localStorage.setItem(BOLD_CODE_STORAGE_KEY, "true");
    elements.addedBackground.checked = true;
    localStorage.setItem(ADDED_BACKGROUND_STORAGE_KEY, "true");
    setDisplaySettingsOpen(false);
    setSettingsMode("compact");
    setSettingsExamplesOpen(true);
    positionSettingsPanel();
    notify("レイアウトと表示設定を初期化しました。");
  }
  $("#reset-layout").addEventListener("click", () => {
    if (!window.confirm("レイアウトと表示設定を初期化します。よろしいですか？")) return;
    resetLayout();
  });
  function setDisplaySettingsOpen(open, save = true) {
    elements.displaySettingsShell.hidden = false;
    elements.displaySettingsShell.classList.toggle("display-collapsed", !open);
    elements.displaySettingsToggle.textContent = open ? "表示設定▲" : "表示設定▼";
    elements.displaySettingsToggle.setAttribute("aria-expanded", String(open));
    if (save) localStorage.setItem(DISPLAY_PANEL_STORAGE_KEY, String(open));
    requestAnimationFrame(positionSettingsPanel);
  }
  elements.displaySettingsToggle.addEventListener("click", () => setDisplaySettingsOpen(elements.displaySettingsShell.classList.contains("display-collapsed")));
  function restoreLayout() {
    try {
      const layout = JSON.parse(localStorage.getItem(LAYOUT_STORAGE_KEY) || "null");
      if (!layout) return;
      elements.displaySettingsShell.style.removeProperty("height");
      elements.settingsShell.style.removeProperty("height");
      elements.correctionGuide.style.removeProperty("height");
      if (Number.isFinite(layout.leftWidth)) setLeftColumnWidth(layout.leftWidth);
      if (Number.isFinite(layout.topHeight)) setRowHeight("top", layout.topHeight);
      if (Number.isFinite(layout.resultHeight)) setRowHeight("bottom", layout.resultHeight);
      if (Number.isFinite(layout.finalHeight)) setRowHeight("final", layout.finalHeight);
      if (Number.isFinite(layout.committedHeight)) setRowHeight("committed", layout.committedHeight);
    } catch (_error) { /* 壊れた保存値は既定レイアウトを使う */ }
  }
  function setLeftColumnWidth(width) {
    const workspaceWidth = elements.workspace.getBoundingClientRect().width;
    const clamped = Math.max(220, Math.min(width, Math.max(220, workspaceWidth - 10)));
    const current = Number.parseFloat(elements.workspace.style.getPropertyValue("--left-column-width"));
    if (!Number.isFinite(current) || Math.abs(current - clamped) > 1) elements.workspace.style.setProperty("--left-column-width", `${clamped}px`);
    document.querySelectorAll(".column-resize-edge").forEach((edge) => edge.setAttribute("aria-valuenow", String(Math.round(clamped))));
    saveLayout();
    positionSettingsPanel();
  }
  document.querySelectorAll(".column-resize-edge").forEach((edge) => {
    let dragStartX = 0;
    let dragStartWidth = 0;
    edge.addEventListener("pointerdown", (event) => {
      dragStartX = event.clientX;
      dragStartWidth = elements.correctionCard.getBoundingClientRect().width;
      edge.classList.add("dragging");
      edge.setPointerCapture(event.pointerId);
    });
    edge.addEventListener("pointermove", (event) => {
      if (!edge.hasPointerCapture(event.pointerId)) return;
      const direction = edge.dataset.column === "inverse" ? -1 : 1;
      setLeftColumnWidth(dragStartWidth + (event.clientX - dragStartX) * direction);
    });
    edge.addEventListener("pointerup", (event) => {
      edge.classList.remove("dragging");
      if (edge.hasPointerCapture(event.pointerId)) edge.releasePointerCapture(event.pointerId);
    });
    edge.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const direction = edge.dataset.column === "inverse" ? -1 : 1;
      setLeftColumnWidth(elements.correctionCard.getBoundingClientRect().width + (event.key === "ArrowLeft" ? -10 : 10) * direction);
    });
  });
  function setRowHeight(row, height) {
    const variable = row === "top"
      ? "--top-editor-height"
      : row === "final"
        ? "--final-editor-height"
        : row === "committed"
          ? "--committed-editor-height"
          : "--result-editor-height";
    const clamped = Math.max(54, Math.min(height, 1600));
    elements.workspace.style.setProperty(variable, `${clamped}px`);
    saveLayout();
    positionSettingsPanel();
  }
  function setAuxiliaryPanelHeight(panelName, height) {
    const panel = panelName === "display"
      ? elements.displaySettingsShell
      : panelName === "settings"
        ? elements.settingsShell
        : elements.correctionGuide;
    const minimum = panelName === "display" ? 96 : panelName === "settings" ? 44 : 72;
    panel.style.height = `${Math.max(minimum, Math.min(height, 1600))}px`;
    saveLayout();
    positionSettingsPanel();
  }
  document.querySelectorAll(".frame-resize-corner").forEach((handle) => {
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;
    const columnMode = handle.dataset.column || "none";
    const panelName = handle.dataset.panel || "";
    const row = handle.dataset.row || "";
    const verticalTarget = panelName === "display"
      ? elements.displaySettingsShell
      : panelName === "guide"
        ? elements.correctionGuide
        : row === "top"
          ? elements.inputShell
          : row === "final"
            ? elements.finalOutputShell
            : row === "committed"
              ? elements.committedOutputShell
              : elements.outputShell;
    handle.addEventListener("pointerdown", (event) => {
      startX = event.clientX;
      startY = event.clientY;
      startWidth = elements.correctionCard.getBoundingClientRect().width;
      startHeight = verticalTarget.getBoundingClientRect().height;
      handle.classList.add("dragging");
      handle.setPointerCapture(event.pointerId);
    });
    handle.addEventListener("pointermove", (event) => {
      if (!handle.hasPointerCapture(event.pointerId)) return;
      const horizontalDelta = event.clientX - startX;
      const allowColumnResize = !window.matchMedia("(max-width: 699px)").matches;
      if (allowColumnResize && columnMode === "direct") setLeftColumnWidth(startWidth + horizontalDelta);
      if (allowColumnResize && columnMode === "inverse") setLeftColumnWidth(startWidth - horizontalDelta);
      if (panelName) setAuxiliaryPanelHeight(panelName, startHeight + event.clientY - startY);
      else setRowHeight(row, startHeight + event.clientY - startY);
    });
    handle.addEventListener("pointerup", (event) => {
      handle.classList.remove("dragging");
      if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
    });
    handle.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      if (["ArrowLeft", "ArrowRight"].includes(event.key) && columnMode !== "none" && !window.matchMedia("(max-width: 699px)").matches) {
        let delta = event.key === "ArrowLeft" ? -10 : 10;
        if (columnMode === "inverse") delta *= -1;
        setLeftColumnWidth(elements.correctionCard.getBoundingClientRect().width + delta);
      }
      if (["ArrowUp", "ArrowDown"].includes(event.key)) {
        const height = verticalTarget.getBoundingClientRect().height + (event.key === "ArrowUp" ? -10 : 10);
        if (panelName) setAuxiliaryPanelHeight(panelName, height);
        else setRowHeight(row, height);
      }
    });
  });
  document.querySelectorAll(".frame-resize-edge").forEach((edge) => {
    let startY = 0;
    let startHeight = 0;
    const row = edge.dataset.row || "";
    const panelName = edge.dataset.panel || "";
    const verticalTarget = panelName === "settings"
      ? elements.settingsShell
      : row === "top"
        ? elements.inputShell
        : row === "final"
          ? elements.finalOutputShell
          : elements.outputShell;
    const direction = edge.dataset.edge === "top" ? -1 : 1;
    const endDrag = (event) => {
      edge.classList.remove("dragging");
      if (edge.hasPointerCapture(event.pointerId)) edge.releasePointerCapture(event.pointerId);
    };
    edge.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      startY = event.clientY;
      startHeight = verticalTarget.getBoundingClientRect().height;
      edge.classList.add("dragging");
      edge.setPointerCapture(event.pointerId);
    });
    edge.addEventListener("pointermove", (event) => {
      if (!edge.hasPointerCapture(event.pointerId)) return;
      const height = startHeight + (event.clientY - startY) * direction;
      if (panelName) setAuxiliaryPanelHeight(panelName, height);
      else setRowHeight(row, height);
    });
    edge.addEventListener("pointerup", endDrag);
    edge.addEventListener("pointercancel", endDrag);
    edge.addEventListener("keydown", (event) => {
      if (!["ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      const height = verticalTarget.getBoundingClientRect().height + (event.key === "ArrowUp" ? -10 : 10) * direction;
      if (panelName) setAuxiliaryPanelHeight(panelName, height);
      else setRowHeight(row, height);
    });
  });

  const savedInput = localStorage.getItem(INPUT_STORAGE_KEY);
  let savedCorrection = localStorage.getItem(CORRECTION_STORAGE_KEY);
  try {
    const savedIds = JSON.parse(localStorage.getItem(SOURCE_LINE_IDS_STORAGE_KEY) || "[]");
    sourceLineIds = Array.isArray(savedIds) ? savedIds : [];
  } catch (_error) { sourceLineIds = []; }
  try {
    outputOverrides = CBFOutputOverrides.sanitize(JSON.parse(localStorage.getItem(OUTPUT_OVERRIDES_STORAGE_KEY) || "{}"));
  } catch (_error) { outputOverrides = {}; }
  try {
    const savedRowModes = JSON.parse(localStorage.getItem(ROW_ADOPTION_MODES_STORAGE_KEY) || "[]");
    rowAdoptionModes = Array.isArray(savedRowModes) ? savedRowModes.map((mode) => ROW_MODE_LABELS[mode] ? mode : "") : [];
  } catch (_error) { rowAdoptionModes = []; }
  if (savedCorrection !== null && localStorage.getItem(CORRECTION_SYNTAX_VERSION_KEY) !== "2") {
    savedCorrection = CBFCorrectionInput.migrateLegacyText(savedCorrection);
    localStorage.setItem(CORRECTION_STORAGE_KEY, savedCorrection);
  }
  localStorage.setItem(CORRECTION_SYNTAX_VERSION_KEY, "2");
  let migratedLegacyNoEditRows = false;
  if (savedCorrection !== null) {
    const savedRows = savedCorrection.split(/\r\n|\r|\n/);
    savedRows.forEach((line, index) => {
      if (line.trim().toLowerCase() !== "n") return;
      rowAdoptionModes[index] = "source";
      savedRows[index] = "";
      migratedLegacyNoEditRows = true;
    });
    if (migratedLegacyNoEditRows) {
      savedCorrection = savedRows.join("\n");
      localStorage.setItem(CORRECTION_STORAGE_KEY, savedCorrection);
      persistRowAdoptionModes();
    }
  }
  const loadedSettings = CBFSettings.load();
  if (window.ChordWikiTranspose) {
    window.ChordWikiTranspose.fillTransposeSelect(elements.previewTranspose);
    window.ChordWikiTranspose.fillTransposeSelect(elements.previewTransposeMain);
  }
  const migratedInput = savedInput === null ? INITIAL_INPUT : savedInput.replace("{comment Bar Formatterの機能確認用ダミー歌詞です}", "{comment:ChordWiki Bar Formatterの機能確認用ダミー歌詞です}");
  elements.input.value = migratedInput;
  normalizeSourceLineIds();
  syncManualOutputLinesFromOverrides();
  persistOutputLayer();
  lastConvertedInputLines = elements.input.value.split(/\r\n|\r|\n/);
  elements.committedOutput.value = localStorage.getItem(COMMITTED_OUTPUT_STORAGE_KEY) || "";
  setCommittedOutputOpen(false);
  if (savedInput !== null && migratedInput !== savedInput) localStorage.setItem(INPUT_STORAGE_KEY, migratedInput);
  elements.correction.value = savedCorrection === null ? INITIAL_CORRECTION : savedCorrection;
  resetCorrectionHistory();
  correctionSlotCounts = elements.correction.value.split(/\r\n|\r|\n/).map((line) => CBFCorrectionInput.groups(line).length);
  applyTheme(localStorage.getItem(THEME_STORAGE_KEY) || "light", false);
  const savedFont = localStorage.getItem(FONT_STORAGE_KEY) || "meiryo";
  elements.fontSelect.value = editorFonts.some((font) => font.value === savedFont) ? savedFont : "meiryo";
  applyEditorFont(elements.fontSelect.value);
  updateFontCycleButtons();
  applyEditorFontSize(localStorage.getItem(FONT_SIZE_STORAGE_KEY) || 14);
  scrollSyncEnabled = localStorage.getItem(SCROLL_SYNC_STORAGE_KEY) !== "false";
  elements.scrollSync.checked = scrollSyncEnabled;
  elements.textColoring.checked = localStorage.getItem(TEXT_COLORING_STORAGE_KEY) !== "false";
  document.documentElement.classList.toggle("colorized-editors", elements.textColoring.checked);
  elements.boldCode.checked = localStorage.getItem(BOLD_CODE_STORAGE_KEY) !== "false";
  document.documentElement.classList.toggle("bold-chords", elements.boldCode.checked);
  elements.addedBackground.checked = localStorage.getItem(ADDED_BACKGROUND_STORAGE_KEY) !== "false";
  elements.plainEditBars.checked = localStorage.getItem(PLAIN_EDIT_BARS_STORAGE_KEY) === "true";
  elements.finalBarsThrough.checked = localStorage.getItem(FINAL_BARS_THROUGH_STORAGE_KEY) === "true";
  elements.previewTranspose.value = String(Math.max(-12, Math.min(12, Number(localStorage.getItem(PREVIEW_TRANSPOSE_STORAGE_KEY)) || 0)));
  const savedPreviewSpelling = localStorage.getItem(PREVIEW_SPELLING_STORAGE_KEY) || "preserve";
  elements.previewSpelling.value = ["preserve", "sharp", "flat"].includes(savedPreviewSpelling) ? savedPreviewSpelling : "preserve";
  syncPreviewControlMirrors();
  updatePreviewTransposeButtons();
  const savedTheoretical = localStorage.getItem(PREVIEW_THEORETICAL_STORAGE_KEY);
  elements.previewTheoretical.checked = savedTheoretical === null ? true : savedTheoretical === "true";
  try {
    const savedKeySections = JSON.parse(localStorage.getItem(PREVIEW_KEY_SECTIONS_STORAGE_KEY) || "[]");
    keySectionSettings = Array.isArray(savedKeySections) ? savedKeySections : [];
  } catch (_error) { keySectionSettings = []; }
  removalLinked = localStorage.getItem(REMOVAL_LINKED_STORAGE_KEY) !== "false";
  elements.removalLinked.checked = removalLinked;
  elements.removalTargets.value = removalLinked
    ? String(loadedSettings.hyphenUnit)
    : (localStorage.getItem(REMOVAL_STORAGE_KEY) ?? String(loadedSettings.hyphenUnit));
  {
    const savedLyricHyphenMode = localStorage.getItem(LYRIC_HYPHEN_MODE_STORAGE_KEY);
    elements.lyricHyphenMode.value = ["show", "target", "minimize", "all"].includes(savedLyricHyphenMode)
      ? savedLyricHyphenMode
      : (localStorage.getItem(LEGACY_HIDE_LYRIC_HYPHENS_STORAGE_KEY) === "true" ? "minimize" : "target");
    updateLyricHyphenControls();
  }
  showScorePreview();
  {
    const savedDisplayPanel = localStorage.getItem(DISPLAY_PANEL_STORAGE_KEY);
    setDisplaySettingsOpen(savedDisplayPanel === "true", false);
  }
  restoreLayout();
  renderSettings(loadedSettings);
  updateSettingsProfileUI();
  updateCount(elements.input, elements.inputCount);
  updateCount(elements.output, elements.outputCount);
  updateCount(elements.committedOutput, elements.committedOutputCount);
  let syncingScroll = false;
  const scrollEditors = [elements.correction, elements.input, elements.output, elements.finalOutput];
  window.addEventListener("resize", syncCorrectionScrollbarWidth);
  [
    [elements.correction, elements.correctionLines],
    [elements.input, elements.inputLines],
    [elements.output, elements.outputLines],
    [elements.finalOutput, elements.finalOutputLines]
  ].forEach(([editor, gutter]) => {
    const positionEvents = editor === elements.correction ? ["click", "keyup", "focus"] : ["click", "keyup", "select", "focus"];
    positionEvents.forEach((eventName) => editor.addEventListener(eventName, () => updateActivePosition(editor, gutter, true, eventName)));
    editor.addEventListener("focus", () => editor.parentElement.classList.add("editing-active"));
    editor.addEventListener("blur", () => {
      editor.parentElement.classList.remove("editing-active");
      updateEditorHighlight(editor);
    });
    editor.addEventListener("scroll", () => {
      gutter.scrollTop = editor.scrollTop;
      if (editor === elements.correction) syncCorrectionModeScroll(editor.scrollTop);
      if (editor === elements.correction && elements.correctionGrid) elements.correctionGrid.scrollTop = editor.scrollTop;
      syncHighlightScroll(editor);
      if ([elements.correction, elements.output].includes(editor) && !mobileProgrammaticScroll && !syncingScroll && !restoringPasteScroll && window.matchMedia("(max-width: 699px)").matches) mobileLinkedScrollPaused = true;
      if (syncingScroll || restoringPasteScroll) return;
      const correctionResultPair = [elements.correction, elements.output];
      const syncTargets = scrollSyncEnabled
        ? editor === elements.input
          ? [elements.input, elements.output, elements.finalOutput]
          : scrollEditors
        : correctionResultPair.includes(editor) ? correctionResultPair : [editor];
      if (syncTargets.length === 1) return;
      syncingScroll = true;
      syncTargets.forEach((other) => {
        other.scrollTop = editor.scrollTop;
        other.scrollLeft = editor.scrollLeft;
        gutterByEditor.get(other).scrollTop = editor.scrollTop;
        if (other === elements.correction) syncCorrectionModeScroll(editor.scrollTop);
        syncHighlightScroll(other);
      });
      if (scrollSyncEnabled && elements.finalOutputShell.classList.contains("preview-mode")) {
        elements.finalPreview.scrollTop = editor.scrollTop;
        elements.finalPreview.scrollLeft = editor.scrollLeft;
      }
      requestAnimationFrame(() => { syncingScroll = false; });
    });
  });
  ["click", "keyup", "select", "focus"].forEach((eventName) => elements.committedOutput.addEventListener(eventName, () => updateActivePosition(elements.committedOutput, elements.committedOutputLines, true)));
  elements.committedOutput.addEventListener("focus", () => elements.committedOutput.parentElement.classList.add("editing-active"));
  elements.committedOutput.addEventListener("blur", () => {
    elements.committedOutput.parentElement.classList.remove("editing-active");
    updateEditorHighlight(elements.committedOutput);
  });
  elements.finalPreview.addEventListener("scroll", () => {
    if (syncingScroll || restoringPasteScroll || !scrollSyncEnabled || !elements.finalOutputShell.classList.contains("preview-mode")) return;
    syncingScroll = true;
    scrollEditors.forEach((editor) => {
      editor.scrollTop = elements.finalPreview.scrollTop;
      editor.scrollLeft = elements.finalPreview.scrollLeft;
      gutterByEditor.get(editor).scrollTop = elements.finalPreview.scrollTop;
      if (editor === elements.correction) syncCorrectionModeScroll(elements.finalPreview.scrollTop);
      syncHighlightScroll(editor);
    });
    requestAnimationFrame(() => { syncingScroll = false; });
  });
  updateLineNumbers(elements.correction, elements.correctionLines);
  updateCorrectionModes();
  const narrowLayout = window.matchMedia("(max-width: 699px)");
  const closeCorrectionGuideOnNarrowLayout = () => {
    if (!narrowLayout.matches) return;
    correctionGuideItems.forEach((item) => { item.open = false; });
    updateGuideToggleAll();
  };
  const setMobileOutputSettingsOpen = (open) => {
    elements.outputSettingsMobile.open = open;
    elements.outputSettingsToggle.setAttribute("aria-expanded", String(open));
    elements.outputSettingsToggle.textContent = open ? "表示設定▲" : "表示設定▼";
  };
  const setMobilePreviewSettingsOpen = (open) => {
    elements.previewSettingsMobile.open = open;
    elements.previewSettingsToggle.setAttribute("aria-expanded", String(open));
    elements.previewSettingsToggle.textContent = open ? "表示設定▲" : "表示設定▼";
  };
  const applyMobileSectionCollapse = () => {
    if (narrowLayout.matches) {
      setMobileOutputSettingsOpen(true);
      setMobilePreviewSettingsOpen(true);
    } else {
      setMobileOutputSettingsOpen(true);
      setMobilePreviewSettingsOpen(true);
    }
  };
  elements.outputSettingsToggle.addEventListener("click", () => {
    setMobileOutputSettingsOpen(!elements.outputSettingsMobile.open);
  });
  elements.previewSettingsToggle.addEventListener("click", () => {
    setMobilePreviewSettingsOpen(!elements.previewSettingsMobile.open);
  });
  narrowLayout.addEventListener("change", closeCorrectionGuideOnNarrowLayout);
  narrowLayout.addEventListener("change", applyMobileSectionCollapse);
  closeCorrectionGuideOnNarrowLayout();
  applyMobileSectionCollapse();
  updateLineNumbers(elements.input, elements.inputLines);
  updateLineNumbers(elements.output, elements.outputLines);
  updateLineNumbers(elements.finalOutput, elements.finalOutputLines);
  updateLineNumbers(elements.committedOutput, elements.committedOutputLines);
  convert({ refreshCorrections: migratedLegacyNoEditRows });
  syncResultRowAlignment();
  if ("ResizeObserver" in window) {
    const resultAlignmentObserver = new ResizeObserver(syncResultRowAlignment);
    [elements.correctionHeading, elements.correctionContext, elements.outputHeading, elements.measureCapacityWarning, elements.removalControls].forEach((element) => resultAlignmentObserver.observe(element));
    const settingsLayoutObserver = new ResizeObserver(positionSettingsPanel);
    [elements.inputShell, elements.fontPanel, elements.settingsShell].forEach((element) => settingsLayoutObserver.observe(element));
  }
  positionSettingsPanel();
  window.addEventListener("resize", () => { positionSettingsPanel(); syncResultRowAlignment(); });
  const crashRecovery = historyStore.getCrash();
  if (crashRecovery) {
    const currentUpdatedAt = Number(localStorage.getItem(CURRENT_STATE_UPDATED_AT_KEY) || 0);
    if (CBFHistoryStore.shouldRestoreCrash(crashRecovery, collectSnapshot(), currentUpdatedAt)) {
      restoreSnapshot(crashRecovery);
      notify("前回の作業を自動復元しました。");
    }
    historyStore.clearCrash();
  }
}());
