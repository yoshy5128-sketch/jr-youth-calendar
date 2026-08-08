Jrユース・スケジュール v15
OCR 安全起動版
=========================================

今回の目的:
「画像ファイルを選択してもプレビューされない」
という初期化問題を完全に切り離して確認します。

変更:
- 全DOM取得をDOMContentLoaded後へ移動
- 画像プレビューをURL.createObjectURLからFileReaderへ変更
- 旧Service Workerを自動解除
- Cache Storageも自動削除
- v15ではService Workerを使わない
- OCRはTesseract.js
- Gemini APIは一切使用しない

正常時:
1. 画像ファイルを選択
2. すぐ画像プレビューが表示
3. 「画像を読み込みました。OCR解析できます。」
   と表示
4. 「画像をOCR解析する」ボタンが押せる

この段階まではTesseract.jsのOCR処理を使っていません。
したがって画像プレビューが出れば、
ファイル選択とアプリ起動は正常です。

GitHub:
ZIP一式を上書きしてください。

Cloudflare Worker:
変更不要。

公開ページ:
?v=15
