鹿児島交通バスロケーション（kagoshimakotsu）
================================================

PHPを使わない静的サイトです。GitHub Pagesで公開できます。

フォルダー構成
- index.html
- css/style.css
- js/app.js
- data/selected-routes.json   取得対象路線（companyIdで会社を区別）
- data/vehicles.json          車両IDごとのナンバー・型式・所属
- data/routes-geometry.json   将来ルート用の経路座標（任意）

経路座標の自動生成
1. data/selected-routes.json に取得したい路線の routeId と routeName を登録します。
2. サイトを開いて「全路線の経路座標を取得して保存」を押します。
3. ダウンロードされた routes-geometry.json を kagoshimakotsu/data/routes-geometry.json に上書きし、GitHubへ反映します。
4. APIが一部の路線で失敗した場合、その路線IDが画面に表示されます。失敗した路線だけ再試行してください。

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


会社別表示チェックボックス
- 画面上部の「鹿児島交通」「南国交通」にチェックを付けた会社だけ車両を取得・表示します。
- チェックを外すと、その会社の車両は地図から非表示になります。
- selected-routes.json の各路線に companyId を設定してください。
- 鹿児島交通：jp_kagoshima_kagoshimakotsu
- 南国交通：jp_kagoshima_nangokukotsu（今回提供されたget_routeリクエストで確認済み）
- 南国交通は今回取得した497路線を登録済みです。
  例：{"routeId":"路線ID","routeName":"路線名","companyId":"jp_kagoshima_nangokukotsu"}
- 南国交通の会社IDは、今回提供されたリクエストの jp_kagoshima_nangokukotsu を使用しています。

注意：南国交通497路線を含むため、南国交通にチェックを入れると路線ごとに位置情報APIを呼び出します。API負荷や応答時間が大きくなる場合があります。
