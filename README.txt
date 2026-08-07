Jrユース・スケジュール v6 完全版
===================================

今回の修正:
Googleカレンダー画面が GMT+00 になっている環境でも、
予定表に書かれた時刻をそのまま表示させる方式へ変更しました。

例:
予定表 14:00～18:00
ICS:
DTSTART:20260808T140000
DTEND:20260808T180000

Z（UTC指定）も TZID=Asia/Tokyo も付けません。
これを「floating time（固定時刻）」として扱います。

これにより、
14:00～18:00 → 05:00～09:00
のような変換を防ぎます。

時刻未定:
終日予定として登録されます。
一括で終日化した予定は
【時間未定】Jrユース・スケジュール
というタイトルになります。

GitHubへ上書き:
- index.html
- style.css
- app.js
- manifest.json
- service-worker.js
- .github/workflows/deploy.yml

Cloudflare:
- worker.js
  読み取りロジック自体はv5と同等です。
  version表示のみ v6-floating-time に更新しています。

更新後はGitHub Actionsが成功したことを確認し、
公開ページを Ctrl+F5 または ?v=6 で開いてください。

重要:
すでにGoogleカレンダーへインポート済みの誤った予定は、
新しいICSを再インポートしても自動修正されません。
いったん誤った予定を削除してから、v6で作成したICSを再インポートしてください。
