Jrユース・スケジュール v14.1
ブラウザ内OCR 起動修正版
==============================================

v14の不具合:
app.js起動時に initializeIOSAppleCalendar() を呼んでいましたが、
関数本体が欠落していたためJavaScriptがそこで停止していました。

その結果:
- 画像を選択してもプレビューされない
- OCR解析ボタンも有効化されない
- その他のボタンイベントも登録されない

v14.1:
- initializeIOSAppleCalendar を復元
- Appleカレンダー関連ヘルパーも復元
- service-workerキャッシュを v14-1 に更新
- OCR方式はv14のまま
- Gemini APIは使用しない
- Cloudflare Worker変更不要

GitHub:
app.js と service-worker.js を最低限上書き。
確実に揃えるならZIP一式を上書き。

公開後:
?v=14.1
で開いて確認してください。
