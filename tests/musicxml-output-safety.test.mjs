import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stateSource = fs.readFileSync(path.join(root, 'js', 'musicxml-output-state.js'), 'utf8');
const { hasManualOutputEdits, confirmManualOutput } = await import(
  `data:text/javascript,${encodeURIComponent(stateSource)}`,
);

test('未編集の生成結果では確認を呼ばずに再生成を許可する', () => {
  let confirmCalls = 0;

  const allowed = confirmManualOutput({
    latest: { title: 'fixture' },
    currentText: '|[C]---- ----|',
    generatedText: '|[C]---- ----|',
    message: 'overwrite',
    confirm: () => {
      confirmCalls += 1;
      return false;
    },
  });

  assert.equal(hasManualOutputEdits({
    latest: { title: 'fixture' },
    currentText: '|[C]---- ----|',
    generatedText: '|[C]---- ----|',
  }), false);
  assert.equal(allowed, true);
  assert.equal(confirmCalls, 0);
});

test('編集済みの出力では確認結果が再生成の許可・取消になる', () => {
  const args = {
    latest: { title: 'fixture' },
    currentText: '|[C]---- ----| 手編集',
    generatedText: '|[C]---- ----|',
    message: 'overwrite',
  };

  assert.equal(hasManualOutputEdits(args), true);
  assert.equal(confirmManualOutput({ ...args, confirm: (message) => message === 'overwrite' }), true);
  assert.equal(confirmManualOutput({ ...args, confirm: () => false }), false);
});

test('変換結果がない空状態は編集済みとして扱わない', () => {
  assert.equal(hasManualOutputEdits({
    latest: null,
    currentText: '',
    generatedText: '',
  }), false);
});
