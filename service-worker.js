/*
v15 OCR安定確認版ではService Workerを使用しません。
古いPWAキャッシュによるファイル混在を防ぐため、
index.html起動時に既存Service WorkerとCache Storageを解除します。
*/
