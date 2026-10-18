# Windows コード担当引継ぎ — NightOfficeAuditor

GitHub正本：`https://github.com/shihuiarenjinba-png/NightOfficeAuditor/tree/feature/night-audit-gameplay-20261018`

本タブはGitHubの実装を担当します。Windowsローカルの取得・実GUI検証・MSIX生成・インストール検査はコード担当が受け持ちます。ダウンロード用ZIPは作らず、リポジトリから直接取得してください。

## 操作と安全性
1. 新しい作業フォルダに上記ブランチをcloneし、SHAを記録。main、セーブ、ほかのゲームを編集しない。
2. Node 20以降で `npm test` を実行し、実際の出力と終了コードを保存する。Actionsの失敗原因も切り分ける。
3. Windows 11のEdgeで `index.html` を実操作し、3ステップ、証拠最大2件、12案件の最後まで、保存・再読み込み・書き出し・インポートを確認する。
4. 壊れたJSON・不正な得点・改ざんした調査時間・ストレージ拒否・更新後のセーブを別テスト用プロファイルで検査。実ユーザーのデータを上書きしない。
5. 1366×768、1920×1080、DPI 100/125/150/200%、キーボード、表示切れ、保存ファイルの日本語名、Defenderを検証。
6. Storeの正式Identity/Publisherと承認素材を確認してから、安全なElectronホスト等と本物のMSIXパッケージを専用作業ブランチへ実装。Node integrationを切り、sandbox/contextIsolationを有効にする。
7. WACK、MSIX署名・Manifest・インストール/更新/アンインストール・オフライン起動を実機で確かめ、商用品質の合否を記録する。

## このタブへ返す証跡
- リポジトリ、作業ブランチ、Git SHA
- 全Nodeテストログ、CI run ID/失敗原因
- Windows GUIの結果とスクリーンショット
- MSIX名・SHA256・Identity/Publisher/Version・WACK XML
- 保留事項と再現手順。未実施テストをPASSにしない

正式MSIX完成までは販売HOLDのままとする。
