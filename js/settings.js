(function () {
  "use strict";

  const STORAGE_KEY = "chordWikiBarFormatter.settings.v1";
  const PROFILE_STORAGE_KEY = "chordWikiBarFormatter.settingsProfiles.v1";
  const ACTIVE_PROFILE_KEY = "chordWikiBarFormatter.settingsProfile.v1";
  const PROFILE_KEYS = ["fourFour", "sixEight", "custom"];
  const definitions = [
    {
      key: "hyphenUnit", label: "コード直後のハイフン数", prompt: "コード直後に補うハイフンの数を設定します。", min: 1, max: 16, defaultValue: 4,
      bounds: "1～16、デフォルト：4",
      examples: ["2 → [Am][--][Em][--]", "4 → [Am][----][Em][----]", "8 → [Am][--------][Em][--------]"]
    },
    {
      key: "measureCapacity", label: "1小節の合計ハイフン数", prompt: "1小節分に相当するハイフンの合計数を設定します。", min: 2, max: 32, defaultValue: 8,
      bounds: "2～32、デフォルト：8",
      examples: ["4 → [|][Am][----][|][Em][----][|][|][F][----][|][G][----][|]", "8 → [|][Am][----][Em][----][|][F][----][G][----][|]", "16 → [|][Am][----][Em][----][F][----][G][----][|]"]
    },
    {
      key: "hyphenSpacing", label: "ハイフンを空白で区切る間隔", prompt: "長く連続するハイフンを、指定した数ごとに空白で区切って読みやすくします。", min: 1, max: 16, defaultValue: 4,
      bounds: "1～16、デフォルト：4",
      examples: ["通常行：", "2 → [|][--][--][--][--][|]", "4 → [|][----][----][|]", "8 → [|][--------][|]", "間奏行：", "2 → |-- -- -- --|", "4 → |---- ----|", "8 → |--------|"]
    },
    {
      key: "shortFractionPrepose", label: "端数の歌詞前置き", prompt: "コード間の長さに端数ができたとき、歌詞を1文字手前へ移動します。", min: 0, max: 1, defaultValue: 1,
      bounds: "する（デフォルト）/ しない",
      examples: ["しない → [|][C][---]あり[F][-][---]がとう[G][-][|][---]あり[C][-][----]がとう[|]", "する → [|][C][---]あり[F][-]が[----]とう[G][-]あ[|][---]り[G][-]が[----]とう[|]"],
      choices: [{ value: 1, label: "する" }, { value: 0, label: "しない" }]
    },
    {
      key: "showContinuationChord", label: "直前コードの引継ぎ", prompt: "コードがない小節へ直前のコードを引き継ぎます。", min: 0, max: 1, defaultValue: 0,
      bounds: "しない（小節線のみ・デフォルト）/ する（前コードも表示）",
      examples: ["しない → [|][C][----][----][|][----][----][|][----][----][|][----][----][|]", "する → [|][C][----][----][|][C][----][----][|][C][----][----][|][C][----][----][|]"],
      choices: [{ value: 1, label: "する" }, { value: 0, label: "しない" }]
    }
  ];

  function defaults() {
    return Object.fromEntries(definitions.map((item) => [item.key, item.defaultValue]));
  }

  function profileDefaults(profile) {
    if (profile === "sixEight") {
      return { ...defaults(), hyphenUnit: 3, measureCapacity: 6, hyphenSpacing: 3 };
    }
    return defaults();
  }

  function readLegacy() {
    try {
      return { ...defaults(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
    } catch (_error) {
      return defaults();
    }
  }

  function readProfiles() {
    let stored = {};
    try {
      const parsed = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) stored = parsed;
    } catch (_error) { /* use migrated/default profiles */ }
    return {
      ...stored,
      fourFour: { ...profileDefaults("fourFour"), ...(stored.fourFour || readLegacy()) },
      sixEight: { ...profileDefaults("sixEight"), ...(stored.sixEight || {}) }
    };
  }

  function writeProfiles(profiles) {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
  }

  function activeProfile() {
    const value = localStorage.getItem(ACTIVE_PROFILE_KEY);
    return PROFILE_KEYS.includes(value) ? value : "fourFour";
  }

  function load(profile = activeProfile()) {
    const profiles = readProfiles();
    return { ...profileDefaults(profile), ...(profiles[profile] || {}) };
  }

  function validate(values) {
    const errors = {};
    const parsed = {};
    definitions.forEach((item) => {
      const raw = String(values[item.key] ?? "").trim();
      const value = Number(raw);
      if (!/^\d+$/.test(raw) || !Number.isInteger(value) || value < item.min || value > item.max) {
        errors[item.key] = `${item.min}～${item.max}の整数で入力してください。`;
      } else {
        parsed[item.key] = value;
      }
    });
    return { valid: Object.keys(errors).length === 0, values: parsed, errors };
  }

  function save(values, profile = activeProfile()) {
    const profiles = readProfiles();
    profiles[profile] = { ...profileDefaults(profile), ...values };
    writeProfiles(profiles);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    return profiles[profile];
  }

  function setActiveProfile(profile, seedValues) {
    const nextProfile = PROFILE_KEYS.includes(profile) ? profile : "fourFour";
    const profiles = readProfiles();
    if (!profiles[nextProfile]) {
      profiles[nextProfile] = nextProfile === "custom"
        ? { ...defaults(), ...(seedValues || {}) }
        : profileDefaults(nextProfile);
      writeProfiles(profiles);
    }
    localStorage.setItem(ACTIVE_PROFILE_KEY, nextProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles[nextProfile]));
    return { ...profiles[nextProfile] };
  }

  function resetActive() {
    const profile = activeProfile();
    const values = profileDefaults(profile);
    return save(values, profile);
  }

  window.CBFSettings = { definitions, defaults, profileDefaults, activeProfile, load, validate, save, setActiveProfile, resetActive, PROFILE_KEYS };
}());
