(function () {
  "use strict";

  const STORAGE_KEY = "chordWikiBarFormatter.settings.v1";
  const PROFILE_STORAGE_KEY = "chordWikiBarFormatter.settingsProfiles.v1";
  const ACTIVE_PROFILE_KEY = "chordWikiBarFormatter.settingsProfile.v1";
  const PROFILE_KEYS = ["fourFour", "sixEight", "custom"];
  const LYRIC_PLACEMENT_VALUES = new Set([2, 3]);
  const normalizeValues = (values = {}) => {
    const normalized = { ...values };
    if (!LYRIC_PLACEMENT_VALUES.has(Number(normalized.longBeatLyricPlacement))) normalized.longBeatLyricPlacement = 2;
    return normalized;
  };
  const definitions = [
    {
      key: "measureCapacity", label: "1小節の合計ハイフン数", prompt: "1小節分に相当するハイフンの合計数を設定します。", min: 2, max: 32, defaultValue: 8,
      bounds: "2～32、デフォルト：8",
      examples: ["4 → [|][A][----][|][B][----][|][C#m7][----][|]", "6 → [|][A][---][---][|][B][---][C#m7][---][|]", "8 → [|][A][----][----][|][B][----][C#m7][----][|]（デフォルト）"]
    },
    {
      key: "hyphenUnit", label: "コード直後のハイフン数", prompt: "コード直後に補うハイフンの数を設定します。", min: 1, max: 16, defaultValue: 4,
      bounds: "1～16、デフォルト：4",
      examples: ["2 → [A][--][B][--][C#m7][--]", "3 → [A][---][B][---][C#m7][---]", "4 → [A][----][B][----][C#m7][----]（デフォルト）"]
    },
    {
      key: "hyphenSpacing", label: "ハイフンを空白で区切る間隔", prompt: "長く連続するハイフンを、指定した数ごとに空白で区切って読みやすくします。0では空白で区切りません。", min: 0, max: 16, defaultValue: 4,
      bounds: "0～16（0：区切らない）、デフォルト：4",
      examples: ["4/4拍子：0 → |[A]--------|[B]---- ----|", "4/4拍子：4 → |[A]---- ----|[B]---- ----|（デフォルト）", "6/8拍子：0 → |[A]------|[B]------|", "6/8拍子：3 → |[A]--- ---|[B]--- ---|（デフォルト）"]
    },
    {
      key: "showContinuationChord", label: "コードなし小節に前コード", prompt: "コードがない小節に、前のコードを表示するかを選びます。", min: 0, max: 1, defaultValue: 0,
      bounds: "小節線だけ表示（デフォルト）/ 前のコードを表示",
      examples: ["小節線だけ表示 → |[A]----|----|[B]----|----|（デフォルト）", "前のコードを表示 → |[A]----|[A]----|[B]----|[B]----|"],
      choices: [{ value: 0, label: "小節線だけ表示" }, { value: 1, label: "前のコードを表示" }]
    },
    {
      key: "longBeatLyricPlacement", label: "長い拍の歌詞配置", prompt: "通常は歌詞を小節内で均等に配置します。ゆったりは歌詞をコードの近くにまとめて配置します。", min: 2, max: 3, defaultValue: 2,
      bounds: "通常（デフォルト）/ ゆったり",
      examples: [
        "【推奨】通常：",
        "速く、文字数が多い歌詞 → [|][C][----]ヘッドライト[----]追い越して[|][G][----]夜のバイパス[----]駆け抜ける[|]",
        "【推奨】ゆったり：",
        "短く、間がある歌詞 → [|][C][----]そっと[----][|][G][----][----][|]",
        "【非推奨】通常：",
        "短く、間がある歌詞 → [|][C][----]そっ[----]と[|][G][----][----][|]",
        "【非推奨】ゆったり：",
        "速く、文字数が多い歌詞 → [|][C][----]ヘッドライト追い越して[----][|][G][----]夜のバイパス駆け抜ける[----][|]"
      ],
      choices: [{ value: 2, label: "通常" }, { value: 3, label: "ゆったり" }]
    },
    {
      key: "shortFractionPrepose", label: "端数があるときの歌詞位置", prompt: "コード間の長さに端数があるときの、歌詞の位置を選びます。", min: 0, max: 1, defaultValue: 1,
      bounds: "前の拍に寄せる（デフォルト）/ そのまま",
      examples: ["前の拍に寄せる → [|][A][----]あ[B][---][C#m7][-]い[|][----][----]う[|]", "そのまま → [|][A][----]あ[B][---][C#m7][-][|][----]い[----]う[|]"],
      choices: [{ value: 1, label: "前の拍に寄せる" }, { value: 0, label: "そのまま" }]
    },
    {
      key: "singleCharacterHyphens", label: "1文字小節にハイフン追記", prompt: "1文字だけで完結する小節に、ハイフンを追記するかどうかを選びます。", min: 0, max: 1, defaultValue: 0,
      bounds: "ハイフン追記なし（デフォルト）/ あり",
      examples: ["ハイフン追記なし → [|][A]あい[B]うえ[|][C#m7]お　[|]（デフォルト）", "ハイフン追記あり → [|][A]あい[B]うえ[|][C#m7][----]お[----][|]"],
      choices: [{ value: 0, label: "ハイフン追記なし" }, { value: 1, label: "ハイフン追記あり" }]
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
      return normalizeValues({ ...defaults(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") });
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
    const normalizedStored = Object.fromEntries(
      Object.entries(stored).map(([profile, values]) => [profile, normalizeValues(values)])
    );
    return {
      ...normalizedStored,
      fourFour: normalizeValues({ ...profileDefaults("fourFour"), ...(normalizedStored.fourFour || readLegacy()) }),
      sixEight: normalizeValues({ ...profileDefaults("sixEight"), ...(normalizedStored.sixEight || {}) })
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
    return normalizeValues({ ...profileDefaults(profile), ...(profiles[profile] || {}) });
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
    profiles[profile] = normalizeValues({ ...profileDefaults(profile), ...values });
    writeProfiles(profiles);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    return profiles[profile];
  }

  function setActiveProfile(profile, seedValues) {
    const nextProfile = PROFILE_KEYS.includes(profile) ? profile : "fourFour";
    const profiles = readProfiles();
    if (!profiles[nextProfile]) {
      profiles[nextProfile] = nextProfile === "custom"
        ? normalizeValues({ ...defaults(), ...(seedValues || {}) })
        : profileDefaults(nextProfile);
      writeProfiles(profiles);
    }
    localStorage.setItem(ACTIVE_PROFILE_KEY, nextProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles[nextProfile]));
    return normalizeValues(profiles[nextProfile]);
  }

  function resetActive() {
    const profile = activeProfile();
    const values = profileDefaults(profile);
    return save(values, profile);
  }

  function inferProfileFromValues(values = {}) {
    const measureCapacity = Number(values.measureCapacity);
    const hyphenUnit = Number(values.hyphenUnit);
    const hyphenSpacing = Number(values.hyphenSpacing);
    if (measureCapacity === 6 && hyphenUnit === 3 && hyphenSpacing === 3) return "sixEight";
    if (measureCapacity === 8 && hyphenUnit === 4 && hyphenSpacing === 4) return "fourFour";
    if (measureCapacity === 6) return "sixEight";
    if (measureCapacity === 8) return "fourFour";
    return activeProfile();
  }

  function resetForValues(values) {
    const profile = inferProfileFromValues(values);
    localStorage.setItem(ACTIVE_PROFILE_KEY, profile);
    return resetActive();
  }

  window.CBFSettings = { definitions, defaults, profileDefaults, activeProfile, inferProfileFromValues, load, validate, save, setActiveProfile, resetActive, resetForValues, PROFILE_KEYS };
}());
