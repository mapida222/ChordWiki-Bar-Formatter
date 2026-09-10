"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const check = require(path.join(root, "js", "measure-check.js"));
const html = fs.readFileSync(path.join(root, "committed-preview.html"), "utf8");
const entry = fs.readFileSync(path.join(root, "js", "entries", "committed-preview.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style-measure-check.css"), "utf8");

const matching = check.validate("[|][C][>---][G][≧===][|][Am][---][F][---][|]", { defaultMeter: "6/8" });
assert.strictEqual(matching.ok, true, "accent and half-note symbols must contribute to the beat total");
assert.deepStrictEqual(matching.rhythmMeasures.map((measure) => measure.beats), [6, 6]);
assert.strictEqual(check.validate("|[C]---[G]---|", { defaultMeter: "6/8" }).ok, true, "the configured default meter must be used before inline overrides");
assert.strictEqual(check.validate("|[C]---[G]---|", { defaultMeter: "6/8" }).meterCandidates.length, 0, "the configured default meter must not be suggested as an annotation");
const quarterNoteDirective = check.validate("{c:BPM=224　　4/4拍子　-：4分音符　=：8分音符　>：アクセント}\n|(4/4)[Bb]--[Am]--|");
assert.strictEqual(quarterNoteDirective.ok, true, "a comment directive can define - as a quarter note");
assert.strictEqual(quarterNoteDirective.rhythmMeasures[0].beats, 8, "four quarter-note hyphens must fill a 4/4 measure");
assert.strictEqual(check.validate("|(4/4)[Bb]--[Am]--|").ok, false, "the default eighth-note interpretation must remain unchanged without a directive");
const explicitRhythmDefinitions = check.validate("{c:4/4拍子　-：8分音符　=：16分音符　≡：3連符　≧：3連符アクセント　>：8分アクセント}\n|[C]----|", { defaultMeter: "4/4" });
const explicitProfile = explicitRhythmDefinitions.rhythmMeasures[0].rhythmProfile;
assert.strictEqual(explicitProfile.declarations["≡"], "triplet", "a song-level triplet definition must be retained");
assert.strictEqual(explicitProfile.declarations["≧"], "triplet-accent", "a song-level triplet accent definition must be retained");
assert.strictEqual(explicitProfile.declarations[">"], "accent", "an accent definition must be retained even when its width is explicit");
assert.strictEqual(explicitProfile.widths[">"], 2, "8th-note accent definitions must set the accent width");
assert.strictEqual(explicitProfile.widths["≡"], 1, "an explicit = definition must not overwrite a separate ≡ symbol");
const explicitTwoBeatTripletDefinitions = check.validate("{c:2/8拍子　≡：3連符　≧：3連符アクセント}\n|[C][≡≡≡]|[D][≧≧≧]|", { defaultMeter: "4/4" });
assert.strictEqual(explicitTwoBeatTripletDefinitions.ok, true, "explicit triplet definitions must make three-symbol groups count as two-beat triplets");
assert.deepStrictEqual(explicitTwoBeatTripletDefinitions.rhythmMeasures.map((measure) => measure.beats), [2, 2]);
const unannotatedTripletAlias = check.analyzeMeasureRhythm({ measureSource: "≡≡≡" });
assert.strictEqual(unannotatedTripletAlias.totalBeats, 1.5, "an undeclared ≡ run must retain its ordinary 16th-note width");
assert(unannotatedTripletAlias.parts.every((part) => !part.tripletGroup), "triplet grouping must require either an explicit definition or the fallback ＞ rule");
const explicitEighthAccentMeasure = check.validate("{c:4/4拍子　-：8分音符　≧：8分アクセント}\n|[C]≧≧≧≧≧≧≧≧|", { defaultMeter: "4/4" });
assert.strictEqual(explicitEighthAccentMeasure.rhythmMeasures[0].beats, 8, "an explicit eighth-note accent definition must affect the measured beat total");
assert.strictEqual(explicitEighthAccentMeasure.ok, true, "an explicit eighth-note accent definition must make the matching measure valid");
const inheritedSixteenthAccentMeasure = check.validate("{c:4/4拍子　>：16分音符アクセント}\n|[C]>>>>>>>>>>>>>>>>|\n|[D]>>>>>>>>>>>>>>>>|", { defaultMeter: "4/4" });
assert.strictEqual(inheritedSixteenthAccentMeasure.rhythmMeasures[1].beats, 8, "an explicit sixteenth-note accent definition must carry into later measures");
assert.strictEqual(inheritedSixteenthAccentMeasure.ok, true, "a later measure must use the inherited sixteenth-note accent definition");
assert.strictEqual(check.rhythmWidth("＞＝＝"), 4, "full-width ＞＝＝ must represent a two-beat triplet");
const triplet = check.validate("[|][C][＞＝＝][|][G][＞＝＝][|]", { defaultMeter: "2/8" });
assert.strictEqual(triplet.ok, true, "full-width two-beat triplets must match across measures");
assert.deepStrictEqual(triplet.rhythmMeasures.map((measure) => measure.beats), [2, 2]);
const bracketedTwoBeatTriplets = check.validate("|[----]い込んで[N.C.][(Am)][＞＞＞][＞＞＞]|", { defaultMeter: "4/4" });
assert.strictEqual(bracketedTwoBeatTriplets.ok, true, "bracketed ＞＞＞ groups must count as two-beat triplets");
assert.deepStrictEqual(bracketedTwoBeatTriplets.rhythmMeasures.map((measure) => measure.beats), [8]);
assert.deepStrictEqual(
  check.analyzeMeasureRhythm(bracketedTwoBeatTriplets.rhythmMeasures[0]).parts.map((part) => [part.token, part.beats, part.tripletGroup]),
  [["[----]", 4, false], ["[＞＞＞]", 2, true], ["[＞＞＞]", 2, true]],
  "bracketed triplet groups must remain visible in the explanation"
);
const unbracketedTwoBeatTriplets = check.validate("|[----] ＞＞＞ ＞＞＞|", { defaultMeter: "4/4" });
assert.strictEqual(unbracketedTwoBeatTriplets.ok, true, "unbracketed ＞＞＞ groups must count as two-beat triplets");
assert.deepStrictEqual(
  check.analyzeMeasureRhythm(unbracketedTwoBeatTriplets.rhythmMeasures[0]).parts.map((part) => [part.token, part.beats, part.tripletGroup]),
  [["[----]", 4, false], ["＞＞＞", 2, true], ["＞＞＞", 2, true]],
  "unbracketed triplet groups must remain visible in the explanation"
);
const bracketedTripletAccents = check.validate("[|][E][＞]か[B][＞]い)[C#][＞]出[D][＞]来[E][＞]ぬ[D][＞]も[|]");
assert.strictEqual(bracketedTripletAccents.ok, true, "three bracketed full-width accents must count as one two-beat triplet");
assert.strictEqual(bracketedTripletAccents.rhythmMeasures[0].beats, 8, "two bracketed full-width triplet groups must fill a 4/4 measure");
assert.strictEqual(bracketedTripletAccents.beatIssues.length, 0);
const oneBeatTripletPatterns = [
  ["=＞＝", 1],
  ["==＞", 1],
  ["＞＝＝＞＝＝", 2],
  ["＞＝＞＝＞＝", 2],
  ["=＞＝＞＝＞", 2]
];
oneBeatTripletPatterns.forEach(([source, groups]) => {
  const analysis = check.analyzeMeasureRhythm({ measureSource: source });
  assert.strictEqual(analysis.totalBeats, groups, `${source} must be inferred as ${groups} one-beat triplet groups`);
  assert(analysis.parts.every((part) => part.tripletGroup && part.tripletBeats === 1), `${source} must not depend on accent position`);
});
const mixedOneBeatTripletBar = check.analyzeMeasureRhythm({ measureSource: "＞＞＞≡＞＞＞≡≡＞≡≡" });
assert.strictEqual(mixedOneBeatTripletBar.totalBeats, 4, "the mixed full-width triplet example must contain four one-beat triplet groups");
assert(mixedOneBeatTripletBar.parts.every((part) => part.tripletGroup && part.tripletBeats === 1), "mixed triplet groups must remain visible in the explanation");
assert.strictEqual(check.rhythmWidth("≡"), 1, "≡ must be an alias of the 16th-note unit");

const standardRhythmCases = [
  ["8th notes", "|[C][--------]|", "4/4"],
  ["16th notes", "|[C][================]|", "4/4"],
  ["full-width 16th notes", "|[C][＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝]|", "4/4"],
  ["8th accent", "|[C][>-------]|", "4/4"],
  ["16th accent", "|[C][≧===============]|", "4/4"]
];
standardRhythmCases.forEach(([label, source, meter]) => {
  const result = check.validate(source, { defaultMeter: meter });
  assert.strictEqual(result.ok, true, `${label} must remain valid after triplet inference`);
});

assert.deepStrictEqual(check.parseMeterText("{ci:12/8拍子　(Jazz feel)}").text, "12/8", "ci directives must keep arbitrary meters");
assert.deepStrictEqual(check.parseMeterText("{ci:6/8(3+3)}").grouping, [3, 3], "meter grouping must be parsed without changing the meter");
assert.strictEqual(check.parseMeterText("(9/8拍子)").capacity, 9, "meter capacity must include the denominator");
const twelveEight = check.validate("{ci:12/8拍子　(Jazz feel)}\n|[C]--- --- --- ---|[G]--- --- --- ---|");
assert.strictEqual(twelveEight.ok, true, "12/8 must require four three-unit rhythm groups");
assert.strictEqual(check.validate("{ci:12/8拍子　(Jazz feel)}\n|[C]--- --- ---|[G]--- --- ---|").ok, false, "12/8 must reject only three three-unit rhythm groups");
const mixedMeter = check.validate("|[C]---- ----|[C]---[G]---|");
assert.strictEqual(mixedMeter.meterCandidates.length, 1, "a mixed line should propose only the non-default local meter");
assert.strictEqual(mixedMeter.meterCandidates[0].scope, "measure");
assert.strictEqual(mixedMeter.meterCandidates[0].meter.text, "6/8");
assert.strictEqual(check.proposeMeterAnnotation("|[C]---- ----|[C]---[G]---|", mixedMeter.meterCandidates[0]).after, "|[C]---- ----|(6/8)[C]---[G]---|", "local meter proposal must be inserted before the target measure");
const lineMeter = check.validate("|[C]---[G]---|[C]---[G]---|");
assert.strictEqual(lineMeter.meterCandidates[0].scope, "line");
assert.strictEqual(check.proposeMeterAnnotation("|[C]---[G]---|[C]---[G]---|", lineMeter.meterCandidates[0]).after, "{ci:6/8拍子}\n|[C]---[G]---|[C]---[G]---|", "line meter proposal must use a directive");
const directiveMeter = check.validate("{ci:6/8拍子}\n|[C]---[G]---|[C]---[G]---|");
assert.strictEqual(directiveMeter.rhythmMeasures.every((measure) => measure.meter?.text === "6/8"), true, "ci directives must apply to the following line");
const inlineMeter = check.validate("|(9/8拍子)[C]---[G]---[Am]---|");
assert.strictEqual(inlineMeter.rhythmMeasures[0].meter.text, "9/8");
assert.strictEqual(inlineMeter.ok, true, "an inline arbitrary meter must determine the expected capacity");
const inlineMeterWinsForOneBeatTriplet = check.validate("{ci:4/4拍子}\n|(1/8)[C]=＞＝|", { defaultMeter: "6/8" });
assert.strictEqual(inlineMeterWinsForOneBeatTriplet.rhythmMeasures[0].meter.text, "1/8", "a measure-local meter must override both the line directive and the configured default");
assert.strictEqual(inlineMeterWinsForOneBeatTriplet.rhythmMeasures[0].beats, 1, "the one-beat triplet must retain its measured duration");
assert.strictEqual(inlineMeterWinsForOneBeatTriplet.ok, true, "a one-beat triplet must be accepted when the local measure meter matches it");
const oneBeatTripletWithoutLocalMeter = check.validate("{ci:4/4拍子}\n|[C]=＞＝|", { defaultMeter: "6/8" });
assert.strictEqual(oneBeatTripletWithoutLocalMeter.ok, false, "the same one-beat triplet must not silently redefine a 4/4 line");
const inlineMeterWinsForTwoBeatTriplet = check.validate("{ci:4/4拍子}\n|(2/8)[C][＞＝＝]|", { defaultMeter: "6/8" });
assert.strictEqual(inlineMeterWinsForTwoBeatTriplet.rhythmMeasures[0].meter.text, "2/8", "a measure-local 2/8 meter must override the line meter for a two-beat triplet");
assert.strictEqual(inlineMeterWinsForTwoBeatTriplet.rhythmMeasures[0].beats, 2, "the explicit two-beat triplet must retain its measured duration");
assert.strictEqual(inlineMeterWinsForTwoBeatTriplet.ok, true, "a two-beat triplet must be accepted in a matching local 2/8 measure");
const twoBeatTripletInWrongLocalMeter = check.validate("{ci:4/4拍子}\n|(1/8)[C][＞＝＝]|", { defaultMeter: "6/8" });
assert.strictEqual(twoBeatTripletInWrongLocalMeter.ok, false, "a two-beat triplet must not override a conflicting local 1/8 meter");
const restoredLine = "{ci:6/8拍子}\n|[C]---[G]---|(9/8)[Am]--- --- ---|\n|[C]---[G]---|[C]---[G]---|";
const restoredLineResult = check.validate(restoredLine);
const restoredLineCandidate = restoredLineResult.meterCandidates.find((candidate) => candidate.kind === "restore");
assert(restoredLineCandidate, "returning to the directive meter on the next line must create a restoration candidate");
assert.strictEqual(check.proposeMeterAnnotation(restoredLine, restoredLineCandidate).after, "{ci:6/8拍子}\n|[C]---[G]---|(9/8)[Am]--- --- ---|\n|(6/8)[C]---[G]---|[C]---[G]---|", "restoration should be added at the first measure after the local override");
const restoredInline = "{ci:6/8拍子}\n|[C]---[G]---|(9/8)[Am]--- --- ---|[C]---[G]---|[C]---[G]---|";
const restoredInlineResult = check.validate(restoredInline);
assert.strictEqual(check.proposeMeterAnnotation(restoredInline, restoredInlineResult.meterCandidates.find((candidate) => candidate.kind === "restore")).after, "{ci:6/8拍子}\n|[C]---[G]---|(9/8)[Am]--- --- ---|(6/8)[C]---[G]---|[C]---[G]---|", "restoration should also work within one line");
const promotedSource = "{ci:6/8拍子}\n|[C]---[G]---|(9/8)[Am]--- --- ---|\n\n|[Am]--- --- ---|[G]--- --- ---|\n|[C]---[G]---|[C]---[G]---|";
const promotedResult = check.validate(promotedSource);
const promotedCandidate = promotedResult.meterCandidates.find((candidate) => candidate.kind === "promote");
assert(promotedCandidate, "a repeated inline meter across lines must offer a directive promotion");
assert.strictEqual(check.proposeMeterAnnotation(promotedSource, promotedCandidate).after, "{ci:6/8拍子}\n|[C]---[G]---|(9/8)[Am]--- --- ---|\n\n{ci:9/8拍子}\n|[Am]--- --- ---|[G]--- --- ---|\n|(6/8)[C]---[G]---|[C]---[G]---|", "a repeated meter should be promoted after the blank-line boundary and restore the base meter");

const mismatch = check.validate("[|][C][----][G][----][|][Am][----][F][----][|][Dm][----][|]");
assert.strictEqual(mismatch.ok, false);
assert.strictEqual(mismatch.beatIssues.length, 1);
assert.strictEqual(mismatch.beatIssues[0].measure, 3);
assert.match(mismatch.beatIssues[0].message, /拍の長さが違います/);
assert.strictEqual(check.formatMeasureSource(mismatch.beatIssues[0]), "|[Dm][----]|", "beat explanations must show the measure bars");
const beatAdjustment = check.proposeBeatAdjustment(mismatch.beatIssues[0]);
assert.strictEqual(beatAdjustment.token, "----", "beat adjustment should use a readable rhythm token");
assert.strictEqual(beatAdjustment.after, "|[Dm][----][----]|", "beat adjustment should show a concrete corrected measure");
assert.strictEqual(beatAdjustment.replacement, "[Dm][----][----]", "applying a beat adjustment must preserve the surrounding bars");
const tooLong = check.validate("|---- ----[Em]---- ---[Em]-|").beatIssues[0];
assert.strictEqual(tooLong.actualBeats, 16);
assert.strictEqual(tooLong.expectedBeats, 8);
const halfBeatAdjustment = check.proposeBeatAdjustment(check.validate("[|][C][--------][|][Dm][=][|]").beatIssues[0]);
assert.strictEqual(halfBeatAdjustment.token, "-------=", "odd half-beat gaps must use a final half-beat symbol");
assert.strictEqual(check.validate(halfBeatAdjustment.after).rhythmMeasures[0].beats, 8, "odd half-beat adjustments must reach the target beat count");
assert.strictEqual(check.validate(beatAdjustment.after).rhythmMeasures[0].beats, mismatch.beatIssues[0].expectedBeats, "the concrete beat adjustment must reach the target beat count");
const analyzed = check.analyzeMeasureRhythm({ measureSource: "[F][---=]編集[G][=]お[----]疲れ" });
assert.deepStrictEqual(analyzed.parts.map((part) => [part.token, part.beats]), [["[---=]", 3.5], ["[=]", 0.5], ["[----]", 4]]);
assert.strictEqual(analyzed.totalBeats, 8, "rhythm analysis must sum only the rhythm tokens in the measure");
const continuedMeasure = check.validate("[|][F][---]入力[G][-]で[----]きま[|][C][○][----]す\n[F][----]細かい部分は[|]");
assert.strictEqual(continuedMeasure.ok, true, "an unclosed measure must continue across a line break until the next bar");
assert.deepStrictEqual(continuedMeasure.rhythmMeasures.map((measure) => measure.beats), [8, 8]);
assert.strictEqual(continuedMeasure.rhythmMeasures[1].line, 1, "a continued measure keeps the line where it started");
assert.strictEqual(continuedMeasure.rhythmMeasures[1].measure, 2, "a continued measure keeps its starting line measure number");
const pickupSource = "|---- ---[(Bbm7)]-|\n[Bbm7][-]逃[|][---]げる事(こ[Eb7(9)][-]と)[---]も多[Abm7][-]く[|]";
const pickupResult = check.validate(pickupSource);
assert.strictEqual(pickupResult.ok, true, "a short line-start segment with the matching pre-display chord is an anacrusis");
assert.deepStrictEqual(pickupResult.rhythmMeasures.map((measure) => measure.beats), [8, 8]);
assert.strictEqual(pickupResult.pickupMeasures.length, 1, "the anacrusis should be retained as metadata without beat validation");
assert.strictEqual(pickupResult.pickupMeasures[0].source, "\n[Bbm7][-]逃");
const lyricLeadingPickup = check.validate("[|][F#m][----]you,[---][(G)][-][|]\nこの[G][-]恋[|][----]の魔[---]法が[E][-]解[|][----]けない[----]ようにし[|]");
assert.strictEqual(lyricLeadingPickup.ok, true, "an anacrusis may have lyrics before its matching leading chord");
assert.strictEqual(lyricLeadingPickup.pickupMeasures[0].source, "\nこの[G][-]恋");
assert.strictEqual(check.validate("[|][Bbm7][-]逃[|]").beatIssues.length, 1, "an unrelated short measure must still be reported");
assert.strictEqual(check.beatText(0.5), "0.5拍分");
assert.ok(check.validate("[|][C][][|]").syntaxIssues.some((issue) => /空の角括弧/.test(issue.message)));

const noBeat = check.validate("[|][C][○][|][Am][----][F][----][|]");
assert.strictEqual(noBeat.ok, true, "a measure with no beat markers is allowed and excluded from comparison");
assert.strictEqual(noBeat.noBeatMeasureCount, 1);

const syntax = check.validate("[|][C][---x][|][G][----]");
assert.strictEqual(syntax.ok, false);
assert.ok(syntax.syntaxIssues.some((issue) => /リズム記号/.test(issue.message)));
const fullWidthSyntax = check.validate("[|][C][＞x][|][G][≡x][|]");
assert.strictEqual(fullWidthSyntax.ok, false);
assert.strictEqual(fullWidthSyntax.syntaxIssues.filter((issue) => issue.code === "invalid-rhythm-token").length, 2, "full-width rhythm symbols must reject malformed bracketed tokens");
assert.ok(check.validate("[|][C][----").syntaxIssues.some((issue) => /閉じ括弧/.test(issue.message)));

const recommendation = check.proposeSixteenthAccentNotation("[|][C][>====][|]\n[|][G][＞＝＝][|]");
assert.strictEqual(recommendation.changes, 1);
assert.strictEqual(recommendation.after, "[|][C][≧====][|]\n[|][G][＞＝＝][|]");
assert.match(recommendation.summary, /変更前：\[\|\]\[C\]\[>====\]/);
assert.strictEqual(check.proposeSixteenthAccentNotation("[|][G][＞＝＝][|]"), null, "full-width triplets must not be rewritten as sixteenth accents");
assert.strictEqual(check.rhythmWidth(">="), 2, "a > followed by = is one plus one fine-width unit");
assert.strictEqual(check.rhythmWidth("---="), 7, "three hyphens plus one half-beat symbol must equal 3.5 beats");

const fixSource = "[|][C][][|]\n[|][G]----][|]";
const fixResult = check.validate(fixSource);
const emptyFix = fixResult.syntaxIssues.find((issue) => issue.code === "empty-bracket");
const strayFix = fixResult.syntaxIssues.find((issue) => issue.code === "stray-closing-bracket");
assert(emptyFix && strayFix, "safe syntax fixes must expose source positions");
assert.strictEqual(check.applyFixes(fixSource, [check.issueFix(emptyFix), check.issueFix(strayFix)]), "[|][C][|]\n[|][G]----[|]");

assert(html.includes('id="committed-measure-check"'));
assert(html.includes('id="committed-measure-check-panel"'));
assert(!html.includes('id="committed-measure-check-meter"'), "the realtime editor must not show the meter-length suggestion panel");
assert(html.includes('id="committed-measure-check-expand-all"'));
assert(html.includes('id="committed-measure-check-apply-all"'));
assert(html.includes("安全な対策をすべて適用"), "bulk apply must be clearly limited to safe automatic fixes");
assert(css.includes('.committed-measure-check-button::before { content: "▼";') && css.includes('.committed-measure-check-button[aria-expanded="true"]::before { content: "▲"; }'), "the check button must show its open/closed state");
assert(entry.includes('import "../measure-check.js?v=20260910-001"'));
assert(entry.includes('import "../committed-measure-check-panel.js?v=20260910-001"'));
assert(entry.includes('import "../settings.js";'), "committed preview must load the shared initial meter settings");
const panel = fs.readFileSync(path.join(root, "js", "committed-measure-check-panel.js"), "utf8");
assert(panel.includes("defaultMeter: currentDefaultMeter()"), "the committed checker must use the active initial meter setting");
assert(panel.includes("part.tripletBeats || 2"), "triplet explanations must distinguish one-beat and two-beat groups");
assert(panel.includes('button.addEventListener("click"'));
assert(panel.includes("event.preventDefault();") && panel.includes("event.stopPropagation();"), "the check button must keep its click behavior isolated");
assert(panel.includes("render(panel.hidden);"), "the check button must toggle the result panel");
assert(panel.includes('applyAllButton?.addEventListener("click"'));
assert(panel.includes('expandAllButton?.addEventListener("click"'));
assert(panel.includes('applyRecommendationButton?.addEventListener("click"'));
assert(panel.includes('rejectRecommendationButton?.addEventListener("click"'));
assert(!panel.includes("原因と対策"));
assert(panel.includes("measure-check-explanation-label"));
assert(panel.includes("小節線「|」の内側"));
assert(panel.includes("自動修正案"));
assert(panel.includes("解析："));
assert(panel.includes("formatRhythmAnalysis"));
assert(panel.includes("記号「${part.token}」は${beatText(part.beats)}"));
assert(panel.includes("合計${beatText(analysis.totalBeats)}"));
assert(panel.includes("修正を適用"));
assert(panel.includes("行へ移動"));
assert(panel.includes("focusIssue(issue)"));
assert(panel.includes("applyBeatSuggestion"));
assert(panel.includes("getBeatSuggestion"));
assert(panel.includes("expectedBeatText"));
assert(panel.includes("小節チェックの結果表示に失敗しました。"));
assert(panel.includes('comparison.classList.add("single")'));
assert(panel.includes("proposeBeatAdjustment"));
assert(panel.includes("調整例"));
assert(panel.includes("formatMeasureSource"));
assert(panel.includes("行へ移動"));
assert(panel.includes("actual < expected") && panel.includes("actual > expected"), "beat explanations must distinguish missing and excessive beats");
assert(panel.includes("この対策を実行"));
assert(panel.includes("appendVisualExplanation"));
assert(css.includes(".measure-check-code-comparison"));
assert(css.includes(".measure-check-code-line mark"));
assert(css.includes("font-size: .8rem; line-height: 1.5"), "measure-check explanations must be readable at the default size");
assert(css.includes(".measure-check-detail-body { padding: 2px 0 5px; color: var(--text); font-size: .78rem; }"), "measure-check details must be larger than the compact helper labels");
assert(css.includes(".committed-measure-check-panel { margin: 0 5px 6px; padding: 5px 8px; overflow: auto; max-height: min(42vh, 360px); }"), "the realtime check panel should stay compact");
assert(html.includes('id="committed-measure-check-recommendation"'));
assert(html.includes("OK：修正を反映"));
assert(html.includes("NG：変更しない"));
assert(css.includes(".measure-check-panel.has-errors"));
assert(css.includes(".measure-check-recommendation"));

console.log("PASS: realtime editor checks measure syntax, beat consistency, accents, and no-beat measures");
