(function () {
  "use strict";

  const output = document.querySelector("#committed-window-text");
  const button = document.querySelector("#committed-measure-check");
  const panel = document.querySelector("#committed-measure-check-panel");
  const summary = document.querySelector("#committed-measure-check-summary");
  const results = document.querySelector("#committed-measure-check-results");
  const expandAllButton = document.querySelector("#committed-measure-check-expand-all");
  const applyAllButton = document.querySelector("#committed-measure-check-apply-all");
  const recommendation = document.querySelector("#committed-measure-check-recommendation");
  const recommendationSummary = document.querySelector("#committed-measure-check-recommendation-summary");
  const applyRecommendationButton = document.querySelector("#committed-measure-check-apply");
  const rejectRecommendationButton = document.querySelector("#committed-measure-check-reject");
  const meterSection = document.querySelector("#committed-measure-check-meter");
  const meterSummary = document.querySelector("#committed-measure-check-meter-summary");
  const meterResults = document.querySelector("#committed-measure-check-meter-results");
  let rejectedSource = null;
  let lastOutputValue = String(output.value || "");
  const storedMeterOverrides = new Map();
  const appliedMeterProposals = new Map();
  const DISMISSED_METER_STORAGE_KEY = "CBF_MEASURE_CHECK_DISMISSED_METERS_V1";
  const dismissedMeterCandidates = new Set((() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(DISMISSED_METER_STORAGE_KEY) || "[]");
      return Array.isArray(stored) ? stored : [];
    } catch (_error) {
      return [];
    }
  })());

  if (!output || !button || !panel || !summary || !results) return;

  function issueExplanation(issue) {
    const beatText = (value) => window.CBFMeasureCheck?.beatText?.(value)
      || (value === null || value === undefined ? "拍数なし" : `${Number.isInteger(value) ? value : Number(value).toFixed(1)}拍分`);
    switch (issue.code) {
      case "beat-mismatch":
        const difference = Math.abs(Number(issue.expectedBeats || 0) - Number(issue.actualBeats || 0));
        return {
          current: `この小節は${beatText(issue.actualBeats)}です。`,
          cause: `基準の${beatText(issue.expectedBeats)}より${beatText(difference)}足りません。`,
          measure: `小節線「|」の内側に、足りない${beatText(difference)}をリズム記号として追加します。下の「調整例」を参考にしてください。`,
          result: `調整例のように${beatText(issue.expectedBeats)}になればOKです。入力欄は自動で変更しません。`
        };
      case "empty-bracket":
        return {
          current: `今ここは ${issue.token || "[]"} と入力されています。`,
          cause: "角括弧の中身が空なので、これがエラー原因です。",
          measure: "不要な [] を削除することができます。",
          result: "調整後：空の角括弧がなくなればOKです。"
        };
      case "stray-closing-bracket":
        return {
          current: `今ここは ${issue.token || "]"} だけが単独であります。`,
          cause: "対応する開き括弧 [ がないため、これがエラー原因です。",
          measure: "単独の ] を削除することができます。",
          result: "調整後：対応のない ] がなくなればOKです。"
        };
      case "missing-closing-bracket":
        return {
          current: `今ここは ${issue.token || "[ から行末まで"} で終わっています。`,
          cause: "開き括弧 [ に対応する閉じ括弧 ] がないため、これがエラー原因です。",
          measure: "内容を確認して、正しい位置に ] を追加することができます。",
          result: "調整後：開き括弧と閉じ括弧が1組になればOKです。"
        };
      case "nested-bracket":
        return {
          current: `今ここは ${issue.token || "角括弧の中に [ があります"} となっています。`,
          cause: "角括弧の中に別の [ が入っているため、これがエラー原因です。",
          measure: "角括弧の入れ子を解消し、コードやリズムを別の角括弧に分けることができます。",
          result: "調整後：角括弧が正しく分かれていればOKです。"
        };
      case "invalid-rhythm-token":
        return {
          current: `今ここは ${issue.token || "該当する角括弧"} と入力されています。`,
          cause: "リズム記号以外の文字が混ざっているため、これがエラー原因です。",
          measure: "角括弧内を正しいリズム記号またはコードに修正することができます。",
          result: "調整後：正しいリズム記号またはコードとして読めればOKです。"
        };
      default:
        return {
          current: "今ここは入力を小節として正しく解釈できない状態です。",
          cause: "角括弧または小節線の対応が崩れているため、これがエラー原因です。",
          measure: "該当行の角括弧と小節線の対応を確認することができます。",
          result: "調整後：小節として正しく読めればOKです。"
        };
    }
  }

  function focusIssue(issue) {
    const lines = String(output.value || "").replace(/\r\n?/gu, "\n").split("\n");
    const lineIndex = Math.max(0, Math.min(lines.length - 1, Number(issue.line || 1) - 1));
    const start = lines.slice(0, lineIndex).reduce((total, line) => total + line.length + 1, 0);
    const end = start + lines[lineIndex].length;
    output.focus();
    output.setSelectionRange(start, end);
    const computed = getComputedStyle(output);
    const lineHeight = Number.parseFloat(computed.lineHeight) || 23;
    const paddingTop = Number.parseFloat(computed.paddingTop) || 0;
    const lineTop = paddingTop + lineIndex * lineHeight;
    output.scrollTop = Math.max(0, lineTop - (output.clientHeight - lineHeight) / 2);
  }

  function getBeatSuggestion(checker, issue) {
    try {
      return checker?.proposeBeatAdjustment?.(issue) || null;
    } catch (_error) {
      return null;
    }
  }

  function formatRhythmAnalysis(checker, issue) {
    const analysis = checker?.analyzeMeasureRhythm?.(issue);
    if (!analysis?.parts?.length) return "記号として数えられるリズムがありません。";
    const beatText = (value) => checker?.beatText?.(value)
      || `${Number.isInteger(value) ? value : Number(value).toFixed(1)}拍分`;
    const parts = analysis.parts.map((part) => `記号「${part.token}」は${beatText(part.beats)}`).join("、");
    return `${parts}。合計${beatText(analysis.totalBeats)}。`;
  }

  function appendMarkedLine(container, label, line, start, end) {
    const block = document.createElement("div");
    block.className = "measure-check-code-block";
    const title = document.createElement("div");
    title.className = "measure-check-code-label";
    title.textContent = label;
    const code = document.createElement("pre");
    code.className = "measure-check-code-line";
    const safeStart = Math.max(0, Math.min(String(line || "").length, Number.isInteger(start) ? start : 0));
    const safeEnd = Math.max(safeStart, Math.min(String(line || "").length, Number.isInteger(end) ? end : safeStart));
    code.append(document.createTextNode(String(line || "").slice(0, safeStart)));
    if (safeEnd > safeStart) {
      const mark = document.createElement("mark");
      mark.textContent = String(line || "").slice(safeStart, safeEnd);
      code.append(mark);
    }
    code.append(document.createTextNode(String(line || "").slice(safeEnd)));
    block.append(title, code);
    container.append(block);
  }

  function appendVisualExplanation(body, issue, checker) {
    const measureOnly = issue.type === "beat"
      ? checker?.formatMeasureSource?.(issue) || `|${issue.measureSource || "（リズム記号なし）"}|`
      : "";
    const line = measureOnly || issue.lineText || issue.measureSource || "";
    const lineStart = measureOnly ? 0 : (Number.isInteger(issue.lineStart) ? issue.lineStart : 0);
    const start = measureOnly ? 0 : (issue.type === "beat" ? issue.measureStart : issue.start);
    const end = measureOnly ? 0 : (issue.type === "beat" ? issue.measureEnd : issue.end);
    const comparison = document.createElement("div");
    comparison.className = "measure-check-code-comparison";
    appendMarkedLine(comparison, issue.type === "beat" ? "入力された小節" : "現在", line, (start || 0) - lineStart, (end || 0) - lineStart);

    if (issue.type === "beat") {
      const suggestion = getBeatSuggestion(checker, issue);
      comparison.classList.add("single");
      if (suggestion) appendMarkedLine(comparison, "自動修正案", suggestion.after, 0, 0);
      body.append(comparison);
      return;
    }

    const fix = checker.issueFix?.(issue);
    if (fix && line) {
      const fixedLine = checker.applyFixes(line, [{ start: fix.start - lineStart, end: fix.end - lineStart, replacement: fix.replacement }]);
      appendMarkedLine(comparison, "修正案", fixedLine, 0, 0);
    } else {
      comparison.classList.add("single");
    }
    body.append(comparison);
  }

  function appendDiffLine(container, line, otherLine, variant) {
    const text = String(line || "");
    const other = String(otherLine || "");
    let prefix = 0;
    while (prefix < text.length && prefix < other.length && text[prefix] === other[prefix]) prefix += 1;
    let suffix = 0;
    while (suffix < text.length - prefix && suffix < other.length - prefix && text[text.length - 1 - suffix] === other[other.length - 1 - suffix]) suffix += 1;
    const lineElement = document.createElement("pre");
    lineElement.className = `measure-check-proposal-line measure-check-proposal-line-${variant}`;
    lineElement.append(document.createTextNode(text.slice(0, prefix)));
    const changed = text.slice(prefix, text.length - suffix || undefined);
    if (changed) {
      const mark = document.createElement("mark");
      mark.textContent = changed;
      lineElement.append(mark);
    }
    lineElement.append(document.createTextNode(suffix ? text.slice(text.length - suffix) : ""));
    container.append(lineElement);
  }

  function renderProposalComparison(container, proposal) {
    container.replaceChildren();
    const beforeLines = proposal.before.replace(/\r\n?/gu, "\n").split("\n");
    const afterLines = proposal.after.replace(/\r\n?/gu, "\n").split("\n");
    const columns = [
      { label: "修正前", lines: beforeLines, other: afterLines, variant: "before" },
      { label: "修正後", lines: afterLines, other: beforeLines, variant: "after" }
    ];
    columns.forEach((column) => {
      const block = document.createElement("div");
      block.className = "measure-check-proposal-column";
      const label = document.createElement("div");
      label.className = "measure-check-code-label";
      label.textContent = column.label;
      const lines = document.createElement("div");
      lines.className = "measure-check-proposal-lines";
      const lineCount = Math.max(column.lines.length, column.other.length);
      for (let index = 0; index < lineCount; index += 1) appendDiffLine(lines, column.lines[index], column.other[index], column.variant);
      block.append(label, lines);
      container.append(block);
    });
  }

  function applyText(next) {
    if (next === output.value) return;
    output.value = next;
    rejectedSource = null;
    output.dispatchEvent(new Event("input", { bubbles: true }));
    requestAnimationFrame(() => render(true));
  }

  function meterCandidateKey(candidate) {
    return JSON.stringify([
      candidate.kind || "missing",
      candidate.scope,
      candidate.line,
      candidate.measure || "all",
      candidate.meter?.text || "",
      String(candidate.lineText || "").replace(/\r/gu, "").trim()
    ]);
  }

  function saveDismissedMeterCandidates() {
    try {
      window.localStorage.setItem(DISMISSED_METER_STORAGE_KEY, JSON.stringify([...dismissedMeterCandidates]));
    } catch (_error) {
      // localStorageが使えない環境でも、現在のタブ内の抑制は維持する。
    }
  }

  function rememberAppliedMeterProposal(candidate, proposal) {
    appliedMeterProposals.set(meterCandidateKey(candidate), { after: proposal.after, insertion: proposal.insertion });
  }

  function currentMeterOverrides() {
    return storedMeterOverrides.get(String(output.value || "")) || [];
  }

  function focusMeterCandidate(candidate) {
    focusIssue({ line: candidate.line });
  }

  function renderMeterCandidates(checker, result) {
    if (!meterSection || !meterSummary || !meterResults) return;
    const candidates = (result.meterCandidates || []).filter((candidate) => !storedMeterOverrides.get(String(output.value || ""))?.some((override) => override.key === meterCandidateKey(candidate)) && !dismissedMeterCandidates.has(meterCandidateKey(candidate)));
    meterSection.hidden = candidates.length === 0;
    meterResults.replaceChildren();
    if (!candidates.length) return;
    const hasTransition = candidates.some((candidate) => candidate.kind === "restore" || candidate.kind === "promote");
    meterSummary.textContent = hasTransition
      ? "拍子の切り替え候補があります。区間としてまとめるか、戻りを明示するかを選んでください。入力欄は選択するまで変更しません。"
      : "拍子指定がない箇所があります。書き忘れか変拍子かを選んでください。入力欄は「付加」を選ぶまで変更しません。";
    candidates.forEach((candidate) => {
      const proposal = checker.proposeMeterAnnotation?.(output.value, candidate);
      if (!proposal) return;
      const card = document.createElement("article");
      card.className = "measure-check-meter-card";
      const title = document.createElement("div");
      title.className = "measure-check-meter-card-title";
      const location = candidate.scope === "line"
        ? `${candidate.line}行目・行全体`
        : `${candidate.line}行目・${candidate.measure}小節目`;
      title.textContent = candidate.kind === "restore"
        ? `${location}：${candidate.meter.text}へ戻ることを明示（適用範囲：${candidate.scopeLabel}）`
        : candidate.kind === "promote"
          ? `${location}：${candidate.meter.text}の区間としてまとめる（適用範囲：${candidate.scopeLabel}）`
          : `${location}：推定 ${candidate.meter.text}（適用範囲：${candidate.scopeLabel}）`;
      const comparison = document.createElement("div");
      comparison.className = "measure-check-meter-comparison measure-check-recommendation-comparison";
      renderProposalComparison(comparison, proposal);
      const actions = document.createElement("div");
      actions.className = "measure-check-recommendation-actions";
      const assume = document.createElement("button");
      assume.type = "button";
      assume.textContent = "4/4として保管";
      assume.addEventListener("click", () => {
        const source = String(output.value || "");
        const overrides = storedMeterOverrides.get(source) || [];
        overrides.push({ key: meterCandidateKey(candidate), scope: candidate.scope, line: candidate.line, measure: candidate.measure, meter: "4/4" });
        storedMeterOverrides.set(source, overrides);
        render(true);
      });
      const apply = document.createElement("button");
      apply.type = "button";
      apply.textContent = candidate.kind === "restore"
        ? `${candidate.meter.text}を付加`
        : candidate.kind === "promote"
          ? `{ci:${candidate.meter.text}拍子}を追加`
          : `推定${candidate.meter.text}を付加`;
      apply.addEventListener("click", () => {
        rememberAppliedMeterProposal(candidate, proposal);
        applyText(proposal.after);
      });
      const manual = document.createElement("button");
      manual.type = "button";
      manual.textContent = "手動で確認";
      manual.addEventListener("click", () => focusMeterCandidate(candidate));
      const dismiss = document.createElement("button");
      dismiss.type = "button";
      dismiss.textContent = "追加しない（再提案しない）";
      dismiss.addEventListener("click", () => {
        dismissedMeterCandidates.add(meterCandidateKey(candidate));
        saveDismissedMeterCandidates();
        render(true);
      });
      actions.append(assume, apply, manual, dismiss);
      card.append(title, comparison, actions);
      meterResults.append(card);
    });
  }

  function applyBeatSuggestion(issue) {
    const suggestion = getBeatSuggestion(window.CBFMeasureCheck, issue);
    const start = Number(issue?.measureStart);
    const end = Number(issue?.measureEnd);
    if (!suggestion || !Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || end > output.value.length) return;
    applyText(`${output.value.slice(0, start)}${suggestion.replacement}${output.value.slice(end)}`);
  }

  function renderDetails(item, issue, message, actionElements) {
    const row = document.createElement("div");
    row.className = "measure-check-result-row";
    const detail = document.createElement("details");
    detail.className = "measure-check-detail";
    const detailSummary = document.createElement("summary");
    detailSummary.className = "measure-check-result-summary";
    detailSummary.append(message);
    const actions = document.createElement("span");
    actions.className = "measure-check-result-actions";
    actions.append(...actionElements);
    const body = document.createElement("div");
    body.className = "measure-check-detail-body";
    const explanation = issueExplanation(issue);
    appendVisualExplanation(body, issue, window.CBFMeasureCheck);
    const paragraph = document.createElement("p");
    const labelElement = document.createElement("strong");
    labelElement.className = "measure-check-explanation-label";
    labelElement.textContent = "原因：";
    const expectedBeatText = window.CBFMeasureCheck?.beatText?.(issue.expectedBeats)
      || `${Number.isInteger(issue.expectedBeats) ? issue.expectedBeats : Number(issue.expectedBeats).toFixed(1)}拍分`;
    const explanationText = issue.type === "beat"
      ? `${explanation.cause}下の自動修正案では${expectedBeatText}になります。`
      : explanation.cause;
    paragraph.append(labelElement, document.createTextNode(explanationText));
    body.append(paragraph);
    if (issue.type === "beat") {
      const analysisParagraph = document.createElement("p");
      const analysisLabel = document.createElement("strong");
      analysisLabel.className = "measure-check-explanation-label";
      analysisLabel.textContent = "解析：";
      analysisParagraph.append(analysisLabel, document.createTextNode(formatRhythmAnalysis(window.CBFMeasureCheck, issue)));
      body.append(analysisParagraph);
    }
    detail.append(detailSummary, body);
    row.append(detail, actions);
    item.append(row);
  }

  function render(open = true) {
    const checker = window.CBFMeasureCheck;
    const result = checker?.validate(output.value, { meterOverrides: currentMeterOverrides() });
    const proposal = checker?.proposeSixteenthAccentNotation?.(output.value);
    if (!result) return;

    panel.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
    panel.classList.toggle("has-errors", !result.ok);
    const checked = `${result.checkedMeasureCount}小節を確認`;
    const rhythm = `拍数あり ${result.rhythmMeasureCount}小節`;
    const noBeat = result.noBeatMeasureCount ? `・拍数なし ${result.noBeatMeasureCount}小節` : "";
    if (!result.checkedMeasureCount) {
      summary.textContent = "小節線で区切られた譜面がないため、確認対象がありません。";
    } else if (result.ok && !result.rhythmMeasureCount) {
      summary.textContent = `OK：${checked}（${rhythm}${noBeat}）。拍数なしのため比較不要です。`;
    } else if (result.ok) {
      summary.textContent = `OK：${checked}（${rhythm}${noBeat}）。拍数はすべて${result.beatLabel(result.expectedBeats)}で一致しています。`;
    } else {
      summary.textContent = `要確認：${checked}（${rhythm}${noBeat}）。${result.issues.length}件のエラーがあります。`;
    }

    const fixes = [];
    results.replaceChildren(...result.issues.map((issue) => {
      try {
        const item = document.createElement("li");
        item.className = `measure-check-result measure-check-result-${issue.type}`;
        const message = document.createElement("span");
        message.className = "measure-check-result-message";
        message.textContent = `${issue.line}行目・${issue.measure}小節目：${issue.message}`;
        const action = document.createElement("button");
        action.type = "button";
        const focusButton = document.createElement("button");
        focusButton.type = "button";
        focusButton.className = "measure-check-manual-button";
        focusButton.textContent = "行へ移動";
        focusButton.title = `${issue.line}行目の入力欄へ移動`;
        focusButton.addEventListener("click", () => focusIssue(issue));
        const actionElements = [focusButton];
        const fix = checker.issueFix?.(issue);
        const beatSuggestion = getBeatSuggestion(checker, issue);
        if (fix) {
          action.className = "measure-check-apply-button";
          action.textContent = "この対策を実行";
          fixes.push(fix);
          action.addEventListener("click", () => applyText(checker.applyFixes(output.value, [fix])));
          actionElements.push(action);
        } else if (beatSuggestion) {
          action.className = "measure-check-apply-button";
          action.textContent = "修正を適用";
          action.addEventListener("click", () => applyBeatSuggestion(issue));
          actionElements.push(action);
        }
        renderDetails(item, issue, message, actionElements);
        return item;
      } catch (error) {
        console.error("小節チェックの結果表示に失敗しました。", error);
        const item = document.createElement("li");
        item.className = "measure-check-result measure-check-result-note";
        item.textContent = `${issue.line}行目・${issue.measure}小節目：${issue.message}`;
        return item;
      }
    }));

    renderMeterCandidates(checker, result);

    if (!result.issues.length && result.noBeatMeasureCount) {
      const item = document.createElement("li");
      item.className = "measure-check-result measure-check-result-note";
      item.textContent = `${result.noBeatMeasureCount}小節は拍数なしのため比較対象から除外しました。`;
      results.append(item);
    }
    if (expandAllButton) {
      expandAllButton.textContent = "すべて開く";
      expandAllButton.setAttribute("aria-expanded", "false");
    }

    const showProposal = Boolean(proposal && output.value !== rejectedSource);
    if (recommendation && recommendationSummary) {
      recommendation.hidden = !showProposal;
      if (showProposal) renderProposalComparison(recommendationSummary, proposal);
    }
    if (!showProposal && rejectedSource === output.value) {
      const item = document.createElement("li");
      item.className = "measure-check-result measure-check-result-note";
      item.textContent = "NG：推奨編集は反映しませんでした。";
      results.append(item);
    }

    // 推奨編集は内容を確認してから専用の「OK」ボタンで反映する。
    // 一括適用には、機械的に安全と判定できる構文修正だけを含める。
    const canApplyAll = fixes.length > 0;
    if (applyAllButton) {
      applyAllButton.disabled = !canApplyAll;
      applyAllButton.hidden = !canApplyAll;
    }
  }

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    rejectedSource = null;
    render(panel.hidden);
  });
  output.addEventListener("input", () => {
    rejectedSource = null;
    const nextOutputValue = String(output.value || "");
    let dismissedAfterDeletion = false;
    appliedMeterProposals.forEach((record, key) => {
      if (lastOutputValue === record.after && !nextOutputValue.includes(record.insertion)) {
        dismissedMeterCandidates.add(key);
        dismissedAfterDeletion = true;
      }
    });
    if (dismissedAfterDeletion) saveDismissedMeterCandidates();
    lastOutputValue = nextOutputValue;
    storedMeterOverrides.delete(nextOutputValue);
    if (!panel.hidden) render(true);
  });
  expandAllButton?.addEventListener("click", () => {
    const details = [...results.querySelectorAll("details")];
    const open = details.some((detail) => !detail.open);
    details.forEach((detail) => { detail.open = open; });
    expandAllButton.textContent = open ? "すべて閉じる" : "すべて開く";
    expandAllButton.setAttribute("aria-expanded", String(open));
  });
  applyAllButton?.addEventListener("click", () => {
    const checker = window.CBFMeasureCheck;
    const result = checker?.validate(output.value);
    if (!checker || !result) return;
    const fixes = result.issues.map((issue) => checker.issueFix?.(issue)).filter(Boolean);
    let next = checker.applyFixes(output.value, fixes);
    applyText(next);
  });
  applyRecommendationButton?.addEventListener("click", () => {
    const proposal = window.CBFMeasureCheck?.proposeSixteenthAccentNotation?.(output.value);
    if (proposal) applyText(proposal.after);
  });
  rejectRecommendationButton?.addEventListener("click", () => {
    rejectedSource = output.value;
    render(true);
  });

  window.CBFCommittedMeasureCheckPanel = { refresh: () => render(!panel.hidden) };
}());
