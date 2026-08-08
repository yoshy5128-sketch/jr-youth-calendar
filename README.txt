Jrユース・スケジュール v12
安定版（v7解析復元 + Appleカレンダー）
===========================================

今回の方針:
画像解析部分は、PC/Androidで正常動作していた
v7の2回解析ロジックへ完全に戻しました。

Appleカレンダー機能は
Cloudflare Workerの /apple-calendar
という別ルートだけで動作します。

つまり:
POST /             → 従来の画像解析
POST /apple-calendar → ICSをAppleカレンダーへ渡す

両者のコード経路は独立しています。

GitHub:
- index.html
- style.css
- app.js
- manifest.json
- service-worker.js
- .github/workflows/deploy.yml
を上書き。

Cloudflare:
worker.jsを丸ごと上書きしてDeploy。

Worker URLを直接開いて
version:
v12-stable-v7-parser-apple
と表示されれば更新済み。

公開ページ:
https://yoshy5128-sketch.github.io/jr-youth-calendar/?v=12

注意:
Gemini無料枠の429が出る場合は、
コード故障ではなくAPI側の利用上限です。
