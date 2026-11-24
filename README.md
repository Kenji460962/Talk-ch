# talk-ch-mirror


https://talk-ch.com


https://www.talk-ch.com

Talk-ch.com を別URLから開けるようにするリバースプロキシ。
コアは `src/core.js` の1ファイルで、各プラットフォーム用の入口 (`entries/`) が呼び出すだけ。ベリーシンプル　シンプルイズベスト

| 場所 | 方法 | 備考 |
|---|---|---|
| Cloudflare Workers | `wrangler deploy` | 無料・スリープなし・WebSocket可 |
| Deno Deploy | `entries/deno.js` を指定 | 無料枠あり |
| Netlify | リポジトリを接続するだけ | Edge Functions 使用 |
| Render | `render.yaml` (Blueprint) | 無料はスリープあり |
| Railway / Fly.io / Koyeb / VPS | `Dockerfile` または `npm start` | Node 20+ |
| Vercel | `platforms/vercel` をRoot Directoryに | 設定のみ・機能制限あり(下記) |
| GAS | 非対応 | Cookie・ステータス・POST制御ができないため |

## 環境変数
- `UPSTREAM` 転送先（既定 `https://talk-ch.com`）
- `PROXY_SECRET` 本家側が「このプロキシ経由」と判定するための秘密値（任意）

## Vercelについて
`rewrites` だけの構成なので、Set-Cookieの `Domain` 属性やHTML内の絶対URLは書き換えられません。
本家のCookieがホスト限定（Domain指定なし）で、リンクが相対パスなら問題なく動きます。

## 制限
- WebSocket は Cloudflare Workers のみ対応
- 本家のIP判定は `X-Forwarded-For` + `X-Proxy-Secret` の一致時のみ信頼してください
- 基本的にペンギンが信頼した人にしか渡さないため、勝手に第三者への譲渡はやめてください

- made by penguin1024

- みんな頑張ってデプロイしてね
