# Jrユース・スケジュール テスト版

## 内容
予定表画像をCloudflare Workerへ送信し、区分が「男」の予定だけを一覧表示します。

## Worker URL
https://jr-youth-calendar-api.yoshy55.workers.dev

## GitHub Pagesへの設置
1. GitHubで新しい公開リポジトリを作成します。
2. このフォルダ内のファイルをすべてアップロードします。
3. リポジトリの Settings → Pages を開きます。
4. Build and deployment の Source を「Deploy from a branch」にします。
5. Branch を「main」、Folder を「/(root)」にして保存します。
6. 数分後に表示される公開URLを開きます。

## ファイル
- index.html
- style.css
- app.js
- manifest.json
- service-worker.js

## 注意
現段階では画像解析と結果表示までです。
Googleカレンダーへの登録機能は、読み取り結果を確認した後に追加します。
