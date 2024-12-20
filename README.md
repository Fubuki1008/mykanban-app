# プロジェクト名  カンバン方式のタスク管理アプリです。

  使用
  
    ・JavaScript
    ・Node.js  v20.18.0
    ・Express.js
    ・D3.js
    ・MySQL Ver 8.0.40


  機能
  
    ・ボードの追加、削除
    ・タスクの追加、削除、移動（ドラック＆ドロップ）
    ・追加したタスクのタイムチャート

  追加
  
    ・タスクの編集機能  追加日　2024年12月17日
    
  開発途中です。
#  追加予定機能
      更新機能
    ・ログイン機能
    ・フィルタリング、検索機能
        ・タスク名、メモ、優先度、日付範囲などでタスクの検索・フィルタリングする機能
        ・検索バーを追加し、タスク一覧をフィルタリング
        ・優先度やステータスごとのフィルターオプションを設置
    ・期日アラート・リマインダー機能
        （デスクトップ通知）
    ・優先度設定機能
        （高、中、低などで優先度を設定）
        ・タスク作成/編集モーダルに「優先度」のドロップダウンを追加
        ・各タスクの優先度に応じたスタイル（色付け）を適用
    ・タスクの進捗管理
        ・「未着手」「進行中」「完了」などのステータスをタスクに付与し、ドラック＆ドロップでステータス変更
        ・カンバンボードの列ごとにステータスを分類（例：未着手ボード、進行中ボードなど）
        ・タスクをドラック＆ドロップで移動させるとステータスが変更される
    ・ダッシュボード、統計機能
        ・ボードやタスクの状況を統計データとして可視化
        ・完了済みタスク数、未完了タスク数、タスクのステータスごとの割合をグラフ表示
        ・ボードごとの進捗率も算出
    ・タスクの期日超過をハイライト
        ・期日を超過したタスクを自動的に強調表示
        ・終了日時と現在時刻を比較し、期日超過タスクにスタイルを適用（赤背景、アイコン表示など）
        

    ・タスクのサブタスク機能
        ・大きなタスクを細分化してサブタスクとして管理できる機能
        ・各タスクにサブタスクを追加するオプション
        ・サブタスクの進捗
