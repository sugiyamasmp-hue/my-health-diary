# My Health Diary — セットアップ手順

## 1. Cloudinary の設定

1. [cloudinary.com](https://cloudinary.com) でアカウント作成
2. Dashboard で **Cloud Name** を確認
3. Settings → Upload → **Upload presets** で unsigned preset を作成
4. `.env` ファイルを編集:

```
VITE_CLOUDINARY_CLOUD_NAME=あなたのCloudName
VITE_CLOUDINARY_UPLOAD_PRESET=あなたのUploadPreset
```

## 2. Firebase の設定

`firebase.json` / `.firebaserc` を同梱しているので、Firebase CLI でルールをデプロイできます。

```bash
npx firebase login
npx firebase deploy --only firestore:rules
# インデックスも更新する場合
npx firebase deploy --only firestore:indexes
```

CLI が使えない場合は Firebase Console から手動反映してください:

1. [Firebase Console](https://console.firebase.google.com) → my-health-diary-e8085
2. Firestore Database → **ルール** タブ → `firestore.rules` の内容を貼り付けて「公開」

⚠️ Firebase Console で「テストモード」を選んでデータベースを作成すると、
`allow read, write: if request.time < timestamp.date(...)` のような
**30日で失効するルール**が自動生成されます。期限が切れると
「Missing or insufficient permissions」で保存が失敗するようになるため、
本リポジトリの `firestore.rules`（期限なし）を必ずデプロイしてください。

## 3. ローカル開発

```bash
npm install
npm run dev
```

## 4. Vercel デプロイ

1. [vercel.com](https://vercel.com) でリポジトリを連携
2. Framework: **Vite**
3. 環境変数を追加:
   - `VITE_CLOUDINARY_CLOUD_NAME`
   - `VITE_CLOUDINARY_UPLOAD_PRESET`
4. Deploy ボタンを押す

`vercel.json` により HashRouter のルーティングが正しく動作します。

## データ構造

```
Firestore:
  dates/{YYYY-MM-DD}
    date: string
    bloodPressures: [{id, systolic, diastolic, pulse, location, memo, recordedAt}]
    temperatures:   [{id, value, memo, recordedAt}]
    weights:        [{id, value, memo, recordedAt}]
    injections:     [{id, drugName, scheduleId, scheduledDate, actualDate, memo, recordedAt}]
    events:         [{id, category, location, content, memo, imageUrls, recordedAt}]

  injectionSchedules/{id}
    drugName: string
    active: boolean
    periodHistory: [{period: number, startDate: string}]
    createdAt: timestamp
```
