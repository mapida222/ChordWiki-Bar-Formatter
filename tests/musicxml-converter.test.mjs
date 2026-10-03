import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'js', 'musicxml-converter.js'), 'utf8');
const converter = await import(`data:text/javascript,${encodeURIComponent(source)}`);

class XmlElement {
  constructor(localName, text = '') {
    this.localName = localName;
    this.nodeName = localName;
    this.children = [];
    this.attributes = new Map();
    this.textContent = String(text);
  }

  append(child) {
    this.children.push(child);
    return this;
  }

  attr(name, value) {
    this.attributes.set(name, String(value));
    return this;
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? '';
  }
}

const element = (name, text = '') => new XmlElement(name, text);
const note = ({ duration, voice, staff, tie = false }) => element('note')
  .append(element('pitch').append(element('step', 'C')).append(element('octave', '4')))
  .append(element('duration', duration))
  .append(tie ? element('tie').attr('type', 'stop') : element('type', 'quarter'))
  .append(element('voice', voice))
  .append(element('staff', staff));
const backup = (duration) => element('backup').append(element('duration', duration));
const forward = (duration) => element('forward').append(element('duration', duration));

const measure = element('measure').attr('number', '1')
  .append(element('attributes')
    .append(element('divisions', '10080'))
    .append(element('time').append(element('beats', '4')).append(element('beat-type', '4'))))
  .append(element('harmony')
    .append(element('root').append(element('root-step', 'G')).append(element('root-alter', '1')))
    .append(element('kind', 'minor-seventh')))
  .append(note({ duration: 40320, voice: 1, staff: 1 }))
  .append(backup(40320))
  .append(note({ duration: 20160, voice: 2, staff: 2 }))
  .append(backup(20160))
  .append(forward(40320))
  .append(note({ duration: 20160, voice: 1, staff: 2, tie: true }))
  .append(backup(60480))
  .append(forward(40320))
  .append(note({ duration: 20160, voice: 2, staff: 2, tie: true }));

const part = element('part').attr('id', 'P1').append(measure);
const score = element('score-partwise')
  .append(element('work').append(element('work-title', 'multi-voice')))
  .append(element('part-list').append(element('score-part').attr('id', 'P1').append(element('part-name', 'Piano'))))
  .append(part);

let result;
try {
  result = converter.convertMusicXmlDocument({ documentElement: score });
} catch (error) {
  console.error(`${error.name}: ${error.message}`);
  throw error;
}
assert.equal(result.measures[0].cells, 8, 'multi-voice 4/4 measures must remain eight eighth-note cells');
assert.match(result.chordWiki, /\[G#m7\]---- ----/, 'the chord output must use the nominal 4/4 bar length');

const meterMeasure = (number, beats, beatType, rootStep, attributesAfterNotes = false) => {
  const divisions = 2;
  const duration = divisions * beats * (4 / beatType);
  const measureNode = element('measure').attr('number', number);
  const attributes = element('attributes')
      .append(element('divisions', divisions))
      .append(element('time').append(element('beats', beats)).append(element('beat-type', beatType)));
  const harmony = element('harmony')
      .append(element('root').append(element('root-step', rootStep)))
      .append(element('kind', 'major'));
  if (attributesAfterNotes) measureNode.append(harmony).append(note({ duration, voice: 1, staff: 1 })).append(attributes);
  else measureNode.append(attributes).append(harmony).append(note({ duration, voice: 1, staff: 1 }));
  return measureNode;
};
const changingPart = element('part').attr('id', 'P2')
  .append(meterMeasure('1', 4, 4, 'C'))
  .append(meterMeasure('2', 3, 4, 'D', true))
  .append(meterMeasure('3', 3, 4, 'E', true))
  .append(meterMeasure('4', 4, 4, 'F', true));
const changingScore = element('score-partwise')
  .append(element('work').append(element('work-title', 'meter-change')))
  .append(element('part-list').append(element('score-part').attr('id', 'P2').append(element('part-name', 'Piano'))))
  .append(changingPart);
const changingResult = converter.convertMusicXmlDocument({ documentElement: changingScore });
assert.match(changingResult.chordWiki, /\|\[C\]---- ----\|\(3\/4\)\[D\]--- ---\|\[E\]--- ---\|\(4\/4\)\[F\]---- ----\|/, 'mid-song meter changes must be written immediately after the opening barline');
assert.equal((changingResult.chordWiki.match(/\(3\/4\)/g) || []).length, 1, 'the same meter must not repeat its change marker on the next measure');
assert.equal((changingResult.chordWiki.match(/\(4\/4\)/g) || []).length, 1, 'returning to the previous meter must emit a new change marker');
assert.equal(
  converter.applyMusicXmlTimeChangeMarkers('|[C]---- ----|[D]--- ---|[E]--- ---|[F]---- ----|', changingResult.measures.map(({ time }) => ({ time }))),
  '|[C]---- ----|(3/4)[D]--- ---|[E]--- ---|(4/4)[F]---- ----|',
  'restored browser results must gain meter-change markers from their saved measure metadata',
);
assert.equal(
  converter.scaleMusicXmlTempoMarkers(
    '|[BM7]---- ----|[BM7]---- ----|[BM7]---- ----|[BM7]---- ----|\n|[A#m]---- ----|----[F#/A#]----|[D#m]---- ----|[D#m]---- ----|',
    0.5,
  ),
  '|[BM7]---- ----|[BM7]---- ----|[A#m]---- --[F#/A#]--|[D#m]---- ----|',
  'half BPM must merge source bars at the barline and preserve eight eighth-note cells per output bar',
);
assert.equal(
  converter.scaleMusicXmlTempoMarkers(
    '|[BM7]---- ----|[BM7]---- ----|[BM7]---- ----|[BM7]---- ----|\n|[A#m]---- ----|----[F#/A#]----|[D#m]---- ----|[D#m]---- ----|',
    0.25,
  ),
  '|[BM7]---- ----|[A#m]---[F#/A#]-[D#m]----|',
  'quarter BPM must merge four source bars and reposition chord changes inside one output bar',
);
assert.equal(
  converter.scaleMusicXmlTempoMarkers(
    '|[BM7]---- ----|[BM7]---- ----|[BM7]---- ----|[BM7]---- ----|\n|[A#m]---- ----|----[F#/A#]----|[D#m]---- ----|[D#m]---- ----|',
    0.125,
  ),
  '|[BM7]----[A#m]===[F#/A#]=[D#m]====|',
  'eighth BPM must keep the barline while using sixteenth markers for fractional chord positions',
);
assert.equal(
  converter.scaleMusicXmlTempoMarkers('|[C]---- ----|[D]--- ---|', 1),
  '|[C]---- ----|[D]--- ---|',
  'unchanged BPM must preserve the original output exactly',
);
assert.equal(
  converter.scaleMusicXmlTempoMarkers(
    '{c:【A】}\n|[C]---- ----|[C]---- ----|[D]---- ----|[D]---- ----|\n{c:【B】}\n|[E]---- ----|[F]---- ----|[G]---- ----|[A]---- ----|',
    0.5,
  ),
  '{c:【A】}\n|[C]---- ----|[D]---- ----|\n{c:【B】}\n|[E]----[F]----|[G]----[A]----|',
  'tempo reflow must keep rehearsal marks before the corresponding output bar',
);

const boundaryMeasure = (number, includeBoundaryHarmony) => {
  const measureNode = element('measure').attr('number', number)
    .append(element('attributes')
      .append(element('divisions', 2))
      .append(element('time').append(element('beats', 3)).append(element('beat-type', 4))));
  if (includeBoundaryHarmony) {
    measureNode
      .append(element('harmony')
        .append(element('root').append(element('root-step', 'C')))
        .append(element('kind', 'major')))
      .append(note({ duration: 6, voice: 1, staff: 1 }))
      .append(backup(6))
      .append(note({ duration: 6, voice: 2, staff: 2 }))
      .append(element('harmony')
        .append(element('root').append(element('root-step', 'D')))
        .append(element('kind', 'major')));
  } else {
    measureNode.append(note({ duration: 6, voice: 1, staff: 1 }));
  }
  return measureNode;
};
const boundaryPart = element('part').attr('id', 'P3')
  .append(boundaryMeasure('1', true))
  .append(boundaryMeasure('2', false));
const boundaryScore = element('score-partwise')
  .append(element('work').append(element('work-title', 'meter-boundary')))
  .append(element('part-list').append(element('score-part').attr('id', 'P3').append(element('part-name', 'Piano'))))
  .append(boundaryPart);
const boundaryResult = converter.convertMusicXmlDocument({ documentElement: boundaryScore });
assert.deepEqual(boundaryResult.warnings, [], 'a harmony exactly at a 3/4 barline must not be reported as out of range');
assert.match(boundaryResult.chordWiki, /\|\[C\]--- ---\|\[D\]--- ---\|/, 'a barline harmony must become the next 3/4 measure start');

const splitAttributeMeasure = element('measure').attr('number', '3')
  .append(element('attributes').append(element('key').append(element('fifths', '0'))))
  .append(element('harmony')
    .append(element('root').append(element('root-step', 'E')))
    .append(element('kind', 'major')))
  .append(note({ duration: 8, voice: 1, staff: 1 }))
  .append(element('attributes')
    .append(element('time').append(element('beats', '4')).append(element('beat-type', '4'))));
const splitAttributePart = element('part').attr('id', 'P4')
  .append(meterMeasure('1', 3, 4, 'C'))
  .append(splitAttributeMeasure);
const splitAttributeScore = element('score-partwise')
  .append(element('work').append(element('work-title', 'split-attributes')))
  .append(element('part-list').append(element('score-part').attr('id', 'P4').append(element('part-name', 'Piano'))))
  .append(splitAttributePart);
const splitAttributeResult = converter.convertMusicXmlDocument({ documentElement: splitAttributeScore });
assert.equal(splitAttributeResult.measures[1].time, '4/4', 'a later attributes element must update the current measure meter');
assert.equal(splitAttributeResult.measures[1].cells, 8, 'the later 4/4 meter must restore eight eighth-note cells');
assert.match(splitAttributeResult.chordWiki, /\|\(4\/4\)\[E\]---- ----\|/, 'the later 4/4 change must be emitted at the measure barline');

console.log('PASS: MusicXML multi-voice measure duration stays within the declared meter');
