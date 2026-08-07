Jrユース・スケジュール v5 完全版
===================================

【GitHubへ置くファイル】
index.html
style.css
app.js
manifest.json
service-worker.js
.github/workflows/deploy.yml

【Cloudflare Worker】
worker.js

【今回の重要修正】

1. 時刻あり予定
   日本時間(JST)をUTCへ明示的に変換してICSへ保存します。

   例:
   2026/08/08 14:00 JST
   → ICS内部 20260808T050000Z

   Googleカレンダー等で日本時間表示すると14:00になります。

2. 時刻未定予定
   終日予定として登録します。

3. 一括終日化した予定
   タイトルに
   【時間未定】Jrユース・スケジュール
   と表示します。

4. 同日の通常時刻予定には影響しません。

5. Service Workerキャッシュ
   v5へ更新しているため、以前のapp.jsが残りにくくしています。

6. Worker
   「男」「男子」「男性」などをすべて「男」に統一して扱います。


【更新手順】

A. GitHub
   index.html
   style.css
   app.js
   manifest.json
   service-worker.js
   .github/workflows/deploy.yml
   を上書きしてCommit。

B. Cloudflare
   worker.jsをWorkers & Pagesの
   jr-youth-calendar-api → Edit code
   に丸ごと貼り替えてDeploy。

C. Worker確認
   Worker URLを直接開き、
   version が
   v5-timezone-safe
   になっていれば更新済みです。

D. Pages確認
   GitHub Actionsが緑になったら
   公開ページをCtrl+F5、または ?v=5 を付けて開いてください。
