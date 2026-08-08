Jrユース・スケジュール v9
Apple標準カレンダー一括追加版
==========================================

Google Cloud / Google Calendar APIは使いません。
クレジットカード登録も不要です。

【iPhone / iPad】
結果確認後に
「Apple標準カレンダーへ一括追加」
ボタンを表示します。

押すと:
1. 選択予定からICSを生成
2. Cloudflare WorkerへICSをPOST
3. Workerが text/calendar として即時返却
4. Safari / iOSへカレンダーファイルとして渡す
5. iPhone側の予定一覧で「すべて追加」

ICSをサーバーに保存する処理はありません。
Workerは受け取ったICSをその場でレスポンスとして返すだけです。

【PC / Android】
従来のICSファイル出力はそのままです。

【時刻】
v7の固定時刻方式を維持しています。

【時刻未定】
終日予定として扱えます。
一括終日化した予定は
【時間未定】Jrユース・スケジュール
となります。

【鍵当番】
v7の厳格な行位置チェックを維持します。

------------------------------------------------
GitHub
------------------------------------------------

以下を上書き:
- index.html
- style.css
- app.js
- manifest.json
- service-worker.js
- .github/workflows/deploy.yml

------------------------------------------------
Cloudflare Worker
------------------------------------------------

worker.jsを丸ごと貼り替えてDeployしてください。

Worker URLを直接開き、
version が

v9-apple-calendar-direct

になれば更新済みです。

------------------------------------------------
確認
------------------------------------------------

GitHub Actionsが緑になったあと、
iPhoneでは

https://yoshy5128-sketch.github.io/jr-youth-calendar/?v=9

で開いてください。

「Apple標準カレンダーへ一括追加」が
iPhone/iPadだけに表示されます。
