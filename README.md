# ConoHa VPS - Safari Addon

[ConoHa by GMO](https://www.conoha.jp/referral/?token=oEt6WY5Paa5Gt4jzSpNXJKF7ymfHG3efV6uRUAW502ZUQMMq2Bc-6L3)  

VPSサービス、ConoHaで利用中のサーバーを一覧表示するプラグインです。VPSの状態表示、コンソール起動、コントロールパネルのVPS設定画面へのリンクが表示されます。

![safari-conoha.png](https://qiita-image-store.s3.amazonaws.com/0/14768/cd9d233b-233d-c864-77f3-81abec4cb7b8.png "safari-conoha.png")

あらかじめConoHaコントロールパネルのAPIメニューからAPIユーザーを作成しておいてください。  
  
## Safari機能拡張のビルド方法

Safari機能拡張のビルドの方法

+ GitHubより一式落とします
+ Safariの開発メニューから「機能拡張ビルダー」を開きます
+ 左下の「＋」を押し「機能拡張を追加」を選択しエクスポートしたフォルダーを指定します。
+ パッケージをビルドをクリックすると機能拡張が作られます。

※パッケージをビルドするにはAppleから取得するSafariの開発署名が必要です

## 署名済みのインストール

当方で署名済みのSafari AddonはConoha.safariextzになります。ダウンロードしてクリックするとSafariにインストールされます。

また、以下の場所からもダウンロード可能です。
https://www.xdig.net/safari/
    
## 設定

Safariの環境設定→機能拡張にConohaがインストールされていますので
+ APIユーザーID
+ APIユーザーパスワード

を入力してください。また、Conohaモードの設定が可能です。
  
## 使い方

ツールバーの「C」のマークをクリックするだけです。

## 参考

以下の記事を参考にして、Firefox版をSafari版に書き換えています。

[APIを使ってFirefoxアドオンを作ってみた](https://www.conoha.jp/conoben/archives/10061)
