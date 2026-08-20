# テストfixtureの使い分け

- `converter-common.json`：複数のconverterテストで共有する標準設定、基本変換、白玉位置の代表ケース。入力・期待値・守る仕様が分かる名前を付ける。
- `v45-regressions.json`：v45時点の変換回帰を固定した既存fixture。過去回帰の記録として維持する。
- `temptation-regressions.json`：複雑な拍・小節またぎの回帰fixture。手入力リズムの境界も`manualOnly`へ記録する。

新しい変換系バグは、複数ケースで再利用できる入力と期待出力なら`converter-common.json`、特定バージョンや公開前に固有の回帰なら既存の回帰fixtureへ追加する。履歴・override・UI状態・parser統合のように入力→出力だけで意味が決まらないケースは、対応する専用テストへ直接追加する。
