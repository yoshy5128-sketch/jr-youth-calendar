Jrユース・スケジュール v10
Quota対策 + Apple標準カレンダー版
==========================================

今回の変更理由:
Gemini API無料枠の短時間レート制限
limit: 20
に到達していました。

v7～v9は1枚の画像を2回解析していたため、
1回の操作でGemini APIを2回消費していました。

v10:
- Gemini呼び出しを1回に削減
- 1回のプロンプト内で
  全行抽出
  漏れ自己チェック
  鍵当番の横一列チェック
  をまとめて実行
- API消費量を約半分に削減

429 Rate Limit:
- 連続再試行しない
- Geminiが返したretry時間を読み取る
- 画面にカウントダウン表示
- カウント終了後に再度解析可能

維持:
- 男/男子のみ最終抽出
- 鍵当番の上下行誤混入防止を強く指示
- 時刻未定→終日
- PC/Android ICS出力
- iPhone/iPad Apple標準カレンダー一括追加
- Google Cloud不要

GitHub:
全ファイルを上書きしてCommit

Cloudflare:
worker.jsを丸ごと貼り替えてDeploy

Worker URLで:
v10-single-pass-quota-safe
と表示されれば更新完了。

iPhone:
?v=10
を付けて開くと新しいキャッシュを確認しやすいです。
