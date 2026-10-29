鹿児島交通バスロケーション（kagoshimakotsu）
================================================

PHPを使わない静的サイトです。GitHub Pagesで公開できます。

フォルダー構成
- index.html
- css/style.css
- js/app.js
- data/selected-routes.json   取得対象路線
- data/vehicles.json          車両IDごとのナンバー・型式・所属
- data/routes-geometry.json   将来ルート用の経路座標（任意）

起動・公開
1. kagoshimakotsu フォルダー内のファイルをGitHubリポジトリに配置します。
2. GitHub Pagesを設定して index.html を公開します。
3. ブラウザでサイトを開き、F12のConsoleでエラーがないか確認します。

重要
- PINA APIの直接アクセスはテストでHTTP 200のJSON応答が確認できています。ただし、API側のCORS設定や仕様が変われば直接取得できなくなる場合があります。
- selected-routes.jsonには、取得したい路線のrouteIdと任意のrouteNameを配列で登録してください。
- vehicles.jsonのキーはAPIの車両IDです。例：
  {
    "00000014126710": {
      "plateNo": "4321",
      "model": "いすゞ エルガ",
      "office": "鹿児島営業所",
      "fleetNo": "123"
    }
  }
  上記は形式例です。実際の情報に置き換えてください。
- 過去ルートは、ページを開いているブラウザのlocalStorageに保存します。別の端末・ブラウザとは共有されません。また、最初の位置記録が蓄積するまで線は表示されません。
- 将来ルートは、data/routes-geometry.jsonにrouteIdをキーとして緯度・経度配列を登録すると表示します。APIから経路データを取得する機能はまだ含めていません。
- APIの負荷を抑えるため、路線を8件ずつ並列取得し、60秒ごとに更新します。
- 地図はLeaflet、背景地図はOpenStreetMapを使用します。
