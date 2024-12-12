// const express = require('express');
// const bodyParser = require('body-parser');
// const mysql = require('mysql');
// const path = require('path');

// const app = express();
// const port = 3000;

// // MySQL接続設定
// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: 'Kotetu1985!',
//     database: 'kanban_app'
// });

// db.connect((err) => {
//     if (err) {
//         console.error('Database connection failed:', err);
//     } else {
//         console.log('Connected to MySQL');
//     }
// });

// // ミドルウェア設定
// app.use(bodyParser.json());
// app.use(express.static('public')); // 静的ファイル（HTML、CSS、JS）を提供する

// // ルートエンドポイント
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'kanban.html')); // フロントエンドのHTMLを返す
// });

// // タスク作成API
// app.post('/tasks', (req, res) => {
//     console.log('Request body:', req.body); // クライアントから送信されるデータをログに出力
//     const { name, start, end, memo, boardId } = req.body;
//     const taskId = Date.now().toString(); // 一意のIDを生成（例: UNIXタイムスタンプ）

//     console.log('Generated taskId:', taskId);
//     console.log('Received data:', { taskId, name, start, end, memo, boardId }); // ログ出力

//     const query = 'INSERT INTO tasks (taskId, name, start, end, memo, boardId) VALUES (?, ?, ?, ?, ?, ?)';
//     db.query(query, [taskId, name, start, end, memo, boardId], (err, result) => {
//         if (err) {
//             console.error('MySQL Error:', err.sqlMessage, err); // エラー詳細を出力
//             res.status(500).send('Failed to save task');
//             return;
//         }
//             res.status(201).json({ message: 'Task saved successfully', taskId }); // taskId を返す
//     });
// });

// // タスク削除API
// app.delete('/tasks/:taskId', (req, res) => {
//     const  taskId  = req.params.taskId;
//     console.log(`Delete request for taskId: ${taskId}`); // 確認用ログ

//     const query = 'DELETE FROM tasks WHERE taskId = ?';
//     db.query(query, [taskId], (err, result) => {
//         if (err) {
//             console.error('Failed to delete task:', err);
//             res.status(500).send('Failed to delete task'); // エラー時にレスポンスを送信
//             return;
//         }

//         // クエリ結果を確認
//         if (result.affectedRows === 0) {
//             console.warn(`No task found with taskId: ${taskId}`);
//             res.status(404).send('Task not found'); // タスクが見つからない場合
//         } else {
//             console.log(`Task with taskId ${taskId} successfully deleted`);
//             res.status(204).send(); // 成功時にレスポンスを送信
//         }
//     });
// });

// // サーバー起動
// app.listen(port, () => {
//     console.log(`Server running on http://localhost:${port}`);
// });



// 2

// const express = require('express');
// const bodyParser = require('body-parser');
// const mysql = require('mysql');
// const path = require('path');

// const app = express();
// const port = 3000;

// // MySQL接続設定
// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: 'Kotetu1985!',
//     database: 'kanban_app'
// });

// db.connect((err) => {
//     if (err) {
//         console.error('Database connection failed:', err);
//     } else {
//         console.log('Connected to MySQL');
//     }
// });

// // ミドルウェア設定
// app.use(bodyParser.json());
// app.use(express.static('public')); // 静的ファイル（HTML、CSS、JS）を提供する

// // ルートエンドポイント
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'kanban.html')); // フロントエンドのHTMLを返す
// });

// // **ボード作成API**
// app.post('/boards', (req, res) => {
//     const { title } = req.body;
//     const boardId = Date.now().toString(); // ボードIDを生成

//     const query = 'INSERT INTO boards (id, title) VALUES (?, ?)';
//     db.query(query, [boardId, title], (err) => {
//         if (err) {
//             console.error('MySQL Error:', err);
//             return res.status(500).send('Failed to create board');
//         }
//         res.status(201).json({ message: 'Board created successfully', boardId });
//     });
// });

// // **タスク作成API**
// app.post('/tasks', (req, res) => {
//     console.log('Request body:', req.body); // 受信データの確認用
//     const { title, start, end, memo, boardId } = req.body;
//     const taskId = Date.now().toString(); // タスクIDを生成
//     const controlId = `${boardId}-${taskId}`; // 管理IDを生成

//     const taskQuery = 'INSERT INTO tasks (id, title, start, end, memo) VALUES (?, ?, ?, ?, ?)';
//     const controlQuery = 'INSERT INTO control (id, boardId, taskId) VALUES (?, ?, ?)';

//     // トランザクションを使用して処理を確実に
//     db.beginTransaction((err) => {
//         if (err) return res.status(500).send('Transaction error');

//         db.query(taskQuery, [taskId, title, start, end, memo], (err) => {
//             if (err) {
//                 console.error('Error inserting task:', err.message); // エラーメッセージをログに記録
//                 return db.rollback(() => res.status(500).send('Failed to save task'));
//             }

//             db.query(controlQuery, [controlId, boardId, taskId], (err) => {
//                 if (err) {
//                     return db.rollback(() => res.status(500).send('Failed to save control'));
//                 }

//                 db.commit((err) => {
//                     if (err) {
//                         return db.rollback(() => res.status(500).send('Commit failed'));
//                     }
//                     res.status(201).json({ message: 'Task created successfully', taskId });
//                 });
//             });
//         });
//     });
// });

// // **タスク削除API**
// app.delete('/tasks/:taskId', (req, res) => {
//     const { taskId } = req.params;

//     const controlQuery = 'DELETE FROM control WHERE taskId = ?';
//     const taskQuery = 'DELETE FROM tasks WHERE id = ?';

//     db.beginTransaction((err) => {
//         if (err) return res.status(500).send('Transaction error');

//         db.query(controlQuery, [taskId], (err) => {
//             if (err) {
//                 return db.rollback(() => res.status(500).send('Failed to delete control'));
//             }

//             db.query(taskQuery, [taskId], (err) => {
//                 if (err) {
//                     return db.rollback(() => res.status(500).send('Failed to delete task'));
//                 }

//                 db.commit((err) => {
//                     if (err) {
//                         return db.rollback(() => res.status(500).send('Commit failed'));
//                     }
//                     res.status(204).send();
//                 });
//             });
//         });
//     });
// });

// // サーバー起動
// app.listen(port, () => {
//     console.log(`Server running on http://localhost:${port}`);
// });


// 3    修正版


// const express = require('express');
// const bodyParser = require('body-parser');
// const mysql = require('mysql');
// const path = require('path');

// const app = express(); // Expressアプリケーションを作成
// const port = 3000; // サーバーがリッスンするポート番号

// // MySQL接続設定
// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: 'Kotetu1985!', // 使用するMySQLのパスワード
//     database: 'kanban_app' // 使用するデータベース名
// });

// // データベースに接続
// db.connect((err) => {
//     if (err) {
//         console.error('Database connection failed:', err); // 接続失敗時のエラーを表示
//     } else {
//         console.log('Connected to MySQL'); // 接続成功時のメッセージ
//     }
// });

// // ミドルウェア設定
// app.use(bodyParser.json()); // JSONリクエストボディをパースする
// app.use(express.static('public')); // 静的ファイル（HTML、CSS、JS）を提供するためのディレクトリ設定

// // ルートエンドポイント
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'kanban.html')); // フロントエンドのHTMLファイルを返す
// });

// // **ボード作成API**
// app.post('/boards', (req, res) => {
//     const { title } = req.body; // リクエストボディから`title`を取得
//     if (!title) {
//         return res.status(400).json({ error: 'Title is required' }); // `title`がない場合のエラーレスポンス
//     }

//     const boardID = Date.now().toString(); // 一意のボードIDを生成
//     const query = 'INSERT INTO boards (boardID, title) VALUES (?, ?)'; // データベースに挿入するSQLクエリ

//     db.query(query, [boardID, title], (err) => {
//         if (err) {
//             console.error('MySQL Error:', err.message); // クエリエラーを表示
//             return res.status(500).json({ error: 'Failed to create board' }); // サーバーエラーを返す
//         }
//         res.status(201).json({ message: 'Board created successfully', boardID }); // 作成成功レスポンス
//     });
// });

// // **タスク作成API**
// app.post('/tasks', (req, res) => {
//     console.log('Request body:', req.body); // デバッグ用にリクエストボディをログ表示
//     const { taskID, boardID, title, start, end, memo } = req.body; // 必要なフィールドを取得

//     // 必須フィールドが揃っているか確認
//     if (!taskID || !boardID || !title || !start || !end) {
//         return res.status(400).json({ error: 'Missing required fields: title, start, end, or boardID' });
//     }

//     // ボードが存在するかを確認
//     const checkBoardQuery = 'SELECT * FROM boards WHERE boardID = ?';
//     db.query(checkBoardQuery, [boardID], (err, results) => {
//         if (err) {
//             console.error('Error checking board existence:', err.message);
//             return res.status(500).json({ error: 'Failed to check board existence' });
//         }
//         if (results.length === 0) {
//             return res.status(400).json({ error: 'Board does not exist' });
//         }

//         const controlID = `${boardID}-${taskID}`; // タスクとボードの関連を表すID

//         // トランザクションを開始
//         db.beginTransaction((err) => {
//             if (err) {
//                 return res.status(500).json({ error: 'Transaction error' });
//             }

//             // `tasks`テーブルにタスクを挿入
//             const taskQuery = 'INSERT INTO tasks (taskID, title, start, end, memo) VALUES (?, ?, ?, ?, ?)';
//             db.query(taskQuery, [taskID, title, start, end, memo], (err) => {
//                 if (err) {
//                     return db.rollback(() => res.status(500).json({ error: 'Failed to save task' }));
//                 }

//                 // `control`テーブルにボードとタスクの関連を挿入
//                 const controlQuery = 'INSERT INTO control (id, boardID, taskID) VALUES (?, ?, ?)';
//                 db.query(controlQuery, [controlID, boardID, taskID], (err) => {
//                     if (err) {
//                         return db.rollback(() => res.status(500).json({ error: 'Failed to save control' }));
//                     }

//                     // コミットして変更を確定
//                     db.commit((err) => {
//                         if (err) {
//                             return db.rollback(() => res.status(500).json({ error: 'Commit failed' }));
//                         }
//                         res.status(201).json({ message: 'Task created successfully', taskID });
//                     });
//                 });
//             });
//         });
//     });
// });

// // **タスク削除API**
// app.delete('/tasks/:taskID', (req, res) => {
//     const { taskID } = req.params; // URLパラメータから`taskID`を取得

//     if (!taskID) {
//         return res.status(400).json({ error: 'Task ID is required' }); // エラー処理
//     }

//     const controlQuery = 'DELETE FROM control WHERE taskID = ?'; // `control`テーブルからタスク情報を削除
//     const taskQuery = 'DELETE FROM tasks WHERE taskID = ?'; // `tasks`テーブルからタスクを削除

//     // トランザクション開始
//     db.beginTransaction((err) => {
//         if (err) {
//             return res.status(500).json({ error: 'Transaction error' });
//         }

//         db.query(controlQuery, [taskID], (err) => {
//             if (err) {
//                 return db.rollback(() => res.status(500).json({ error: 'Failed to delete control' }));
//             }

//             db.query(taskQuery, [taskID], (err) => {
//                 if (err) {
//                     return db.rollback(() => res.status(500).json({ error: 'Failed to delete task' }));
//                 }

//                 // コミットして変更を確定
//                 db.commit((err) => {
//                     if (err) {
//                         return db.rollback(() => res.status(500).json({ error: 'Commit failed' }));
//                     }
//                     res.status(204).send(); // 成功時に204 No Contentを返す
//                 });
//             });
//         });
//     });
// });

// // **タスクのボードID更新API**
// app.put('/tasks/:taskID/board', (req, res) => {
//     const { taskID } = req.params; // URLパラメータから`taskID`を取得
//     const { newBoardID } = req.body; // リクエストボディから新しい`boardID`を取得

//     if (!taskID || !newBoardID) {
//         return res.status(400).json({ error: 'Task ID and new Board ID are required' }); // エラー処理
//     }

//     // 新しいボードが存在するかを確認
//     const checkBoardQuery = 'SELECT * FROM boards WHERE boardID = ?';
//     db.query(checkBoardQuery, [newBoardID], (err, results) => {
//         if (err) {
//             console.error('Error checking board existence:', err.message);
//             return res.status(500).json({ error: 'Failed to check board existence' });
//         }
//         if (results.length === 0) {
//             return res.status(400).json({ error: 'New Board does not exist' });
//         }

//         // `control`テーブルのボードIDを更新
//         const updateControlQuery = 'UPDATE control SET boardID = ? WHERE taskID = ?';
//         db.query(updateControlQuery, [newBoardID, taskID], (err) => {
//             if (err) {
//                 console.error('Error updating boardID in control table:', err.message);
//                 return res.status(500).json({ error: 'Failed to update boardID in control table' });
//             }

//             res.status(200).json({ message: 'Board ID updated successfully', taskID, newBoardID }); // 更新成功レスポンス
//         });
//     });
// });

// // サーバー起動
// app.listen(port, () => {
//     console.log(`Server running on http://localhost:${port}`); // サーバー起動成功メッセージ
// });


// ４
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const { v4: uuidv4 } = require('uuid'); // UUID生成用
const path = require('path'); // pathモジュールをインポート

const app = express();
const port = 3000;

// MySQL接続設定
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Kotetu1985!',
    database: 'kanban_app',
    timezone: 'Z' // タイムゾーンをUTCに設定
});


// 初期ボードを作成する関数 修正前  UUID
// const initializeDefaultBoards = (callback) => {
//     const defaultBoards = [
//         { title: 'todo', boardID: uuidv4() },
//         { title: 'in-progress', boardID: uuidv4() },
//         { title: 'done', boardID: uuidv4() }
//     ];
//     console.log('Generated default boards:', defaultBoards);    //UUIDの生成結果をログに記録
//     const query = 'SELECT title, boardID FROM boards WHERE title IN (?, ?, ?)'; //  'SELECT title FROM boards WHERE title IN (?, ?, ?)'から変更
//     db.query(query, ['todo', 'in-progress', 'done'], (err, results) => {
//         if (err) {
//             console.error('MySQL Error during default board check:', err.message);
//             return callback(err, null);
//         }

//         const existingBoards = results.map(row => ({ title: row.title, boardID: row.boardID }));
//         const boardsToInsert = defaultBoards.filter(board => !existingBoards.find(existing => existing.title === board.title));

//         if (boardsToInsert.length > 0) {
//             const insertQuery = 'INSERT INTO boards (boardID, title) VALUES ?';
//             const values = boardsToInsert.map(board => [board.boardID, board.title]);
//             console.log('Values to insert:', values);   //  values の内容をログに記録

//             db.query(insertQuery, [values], (err) => {
//                 if (err) {
//                     console.error('MySQL Error during default board insertion:', err.message);
//                     return callback(err, null);
//                 }
//                 console.log('Default boards created:', boardsToInsert.map(board => board.title).join(', '));
//                 callback(null, [...existingBoards, ...boardsToInsert]);
//             });
//         } else {
//             console.log('Default boards already exist.');
//             callback(null, existingBoards);
//         }
//     });
// };

//  修正後  カスタム    順序付き識別子
const initializeDefaultBoards = (callback) => {
    const defaultBoards = [
        { title: 'todo' },
        { title: 'progress' },
        { title: 'done' }
    ];

    const query = 'SELECT title, boardID FROM boards WHERE title IN (?, ?, ?)';
    db.query(query, ['todo', 'progress', 'done'], (err, results) => {
        if (err) {
            console.error('MySQL Error during default board check:', err.message);
            return callback(err, null);
        }

        const existingBoards = results.map(row => ({ title: row.title, boardID: row.boardID }));
        const boardsToInsert = defaultBoards.filter(board => !existingBoards.find(existing => existing.title === board.title));

        if (boardsToInsert.length > 0) {
            const getMaxBoardIDQuery = 'SELECT MAX(CAST(SUBSTRING(boardID, 7) AS UNSIGNED)) AS maxID FROM boards';
            db.query(getMaxBoardIDQuery, (err, results) => {
                if (err) {
                    console.error('MySQL Error:', err.message);
                    return callback(err, null);
                }

                const maxID = results[0].maxID || 0;

                // 新しい識別子を生成
                boardsToInsert.forEach((board, index) => {
                    board.boardID = `BOARD-${String(maxID + index + 1).padStart(3, '0')}`;
                });

                const insertQuery = 'INSERT INTO boards (boardID, title) VALUES ?';
                const values = boardsToInsert.map(board => [board.boardID, board.title]);

                db.query(insertQuery, [values], (err) => {
                    if (err) {
                        console.error('MySQL Error during default board insertion:', err.message);
                        return callback(err, null);
                    }
                    console.log('Default boards created:', boardsToInsert.map(board => board.title).join(', '));
                    callback(null, [...existingBoards, ...boardsToInsert]);
                });
            });
        } else {
            console.log('Default boards already exist.');
            callback(null, existingBoards);
        }
    });
};


// データベース接続
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to MySQL');

         // initializeDefaultBoards のコールバックを指定
         initializeDefaultBoards((err, boards) => {
            if (err) {
                console.error('Failed to initialize default boards:', err);
            } else {
                console.log('Default boards initialized:', boards);
            }
         });
    }
});

// ミドルウェア設定
app.use(bodyParser.json());
app.use(express.static('public'));

// ルートエンドポイント
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'kanban.html'));
});

// **ボード取得API**
app.get('/boards', (req, res) => {
    const query = 'SELECT * FROM boards'; // boardsテーブルのすべてのデータを取得

    db.query(query, (err, results) => {
        if (err) {
            console.error('MySQL Error during board retrieval:', err.message);
            return res.status(500).json({ error: 'Failed to fetch boards', details: err.message });
        }

        // 結果をクライアントに返す
        res.status(200).json(results);
    });
});

// **ボード作成API**    修正前  UUID
// app.post('/boards', (req, res) => {
//     // console.log('Board creation request:', req.body);   //ボード追加時　リクエストログ
//     const { title, } = req.body;

//     if (!title) {
//         return res.status(400).json({ error: 'Title is required' });
//     }

//     const boardID = uuidv4(); // UUIDを生成

//     // ターミナルに表示
//     console.log(`Creating new board with title: ${title} and ID: ${boardID}`);

//     const query = 'INSERT INTO boards (boardID, title) VALUES (?, ?)';

//     db.query(query, [boardID, title], (err) => {
//         if (err) {
//             console.error('MySQL Error:', err.message);
//             return res.status(500).json({ error: 'Failed to create board', details: err.message });
//         }

//         res.status(201).json({ message: 'Board created successfully', boardID });
//     });
// });


// **ボード作成API**    修正後  順序付き識別子
app.post('/boards', (req, res) => {
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    const getMaxBoardIDQuery = 'SELECT MAX(CAST(SUBSTRING(boardID, 7) AS UNSIGNED)) AS maxID FROM boards';
    db.query(getMaxBoardIDQuery, (err, results) => {
        if (err) {
            console.error('MySQL Error:', err.message);
            return res.status(500).json({ error: 'Failed to retrieve max board ID', details: err.message });
        }

        const maxID = results[0].maxID || 0;
        const newBoardID = `BOARD-${String(maxID + 1).padStart(3, '0')}`;

        console.log(`Creating new board with title: ${title} and ID: ${newBoardID}`);

        const insertQuery = 'INSERT INTO boards (boardID, title) VALUES (?, ?)';
        db.query(insertQuery, [newBoardID, title], (err) => {
            if (err) {
                console.error('MySQL Error:', err.message);
                return res.status(500).json({ error: 'Failed to create board', details: err.message });
            }

            res.status(201).json({ message: 'Board created successfully', boardID: newBoardID });
        });
    });
});

// **ボードごとのタスク取得API**    ガントチャート用
// app.get('/tasks/boards', (req, res) => {
//     const query = `
//         SELECT b.boardID, b.title AS boardTitle, t.taskID, t.title AS taskTitle, t.start, t.end, t.memo
//         FROM boards b
//         LEFT JOIN control c ON b.boardID = c.boardID
//         LEFT JOIN tasks t ON c.taskID = t.taskID
//         ORDER BY b.boardID, t.start;
//     `;

//     db.query(query, (err, results) => {
//         if (err) {
//             console.error('MySQL Error during board tasks retrieval:', err.message);
//             return res.status(500).json({ error: 'Failed to fetch tasks by boards', details: err.message });
//         }

//         // 結果をボードごとにグループ化
//         const groupedData = results.reduce((acc, row) => {
//             const { boardID, boardTitle, taskID, taskTitle, start, end, memo } = row;

//             if (!acc[boardID]) {
//                 acc[boardID] = {
//                     boardID,
//                     boardTitle,
//                     tasks: [],
//                 };
//             }

//             if (taskID) {
//                 acc[boardID].tasks.push({ taskID, taskTitle, start, end, memo });
//             }

//             return acc;
//         }, {});

//         // オブジェクトを配列形式に変換
//         const response = Object.values(groupedData);

//         res.status(200).json(response);
//     });
// });

//修正後
app.get('/tasks/boards', async (req, res) => {
    try {
      const query = `
        SELECT 
          b.name AS board_name, 
          t.name AS task_name, 
          t.start_date, 
          t.end_date
        FROM boards b
        LEFT JOIN control c ON b.id = c.board_id
        LEFT JOIN tasks t ON c.task_id = t.id
        ORDER BY b.name, t.start_date;
      `;
      const [rows] = await db.query(query);
  
      const result = rows.reduce((acc, row) => {
        if (!acc[row.board_name]) {
          acc[row.board_name] = [];
        }
        acc[row.board_name].push({
          task_name: row.task_name,
          start_date: row.start_date,
          end_date: row.end_date,
        });
        return acc;
      }, {});
  
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  });

// **タスク作成API**    修正前
// app.post('/tasks', (req, res) => {
//     console.log('Task creation request:', req.body); // リクエスト内容をログ出力
//     const { boardID, title, start, end, memo } = req.body;

//     if (!boardID || !title || !start || !end) {
//         return res.status(400).json({ error: 'Missing required fields' });
//     }

//     // boardIDの存在確認
//     const checkBoardQuery = 'SELECT COUNT(*) AS count FROM boards WHERE boardID = ?';
//     db.query(checkBoardQuery, [boardID], (err, results) => {
//         if (err) {
//             console.error('MySQL Error:', err.message);
//             return res.status(500).json({ error: 'Failed to verify board existence', details: err.message });
//         }

//         if (results[0].count === 0) {
//             return res.status(400).json({ error: 'Invalid boardID' });
//         }

//         const taskID = uuidv4(); // UUIDを生成

//         const taskQuery = 'INSERT INTO tasks (taskID, title, start, end, memo) VALUES (?, ?, ?, ?, ?)';
//         db.query(taskQuery, [taskID, title, start, end, memo], (err) => {
//             if (err) {
//                 console.error('MySQL Error:', err.message);
//                 return res.status(500).json({ error: 'Failed to create task', details: err.message });
//             }

//             const controlID = uuidv4();
//             const controlQuery = 'INSERT INTO control (id, boardID, taskID) VALUES (?, ?, ?)';

//             db.query(controlQuery, [controlID, boardID, taskID], (err) => {
//                 if (err) {
//                     console.error('MySQL Error:', err.message);
//                     return res.status(500).json({ error: 'Failed to register control entry', details: err.message });
//                 }
//                 res.status(201).json({ message: 'Task created successfully', taskID });
//             });
//         });
//     });
// });

//  タスク作成API   修正後  順序付き識別子ver
app.post('/tasks', (req, res) => {
    console.log('Task creation request:', req.body); // リクエスト内容をログ出力
    const { boardID, title, start, end, memo } = req.body;

    if (!boardID || !title || !start || !end) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // boardIDの存在確認
    const checkBoardQuery = 'SELECT COUNT(*) AS count FROM boards WHERE boardID = ?';
    db.query(checkBoardQuery, [boardID], (err, results) => {
        if (err) {
            console.error('MySQL Error:', err.message);
            return res.status(500).json({ error: 'Failed to verify board existence', details: err.message });
        }

        if (results[0].count === 0) {
            return res.status(400).json({ error: 'Invalid boardID' });
        }

        // タスクIDの最大値を取得
        const getMaxTaskIDQuery = 'SELECT MAX(CAST(SUBSTRING(taskID, 6) AS UNSIGNED)) AS maxID FROM tasks';
        db.query(getMaxTaskIDQuery, (err, results) => {
            if (err) {
                console.error('MySQL Error:', err.message);
                return res.status(500).json({ error: 'Failed to retrieve max task ID', details: err.message });
            }

            const maxID = results[0].maxID || 0;
            const newTaskID = `TASK-${String(maxID + 1).padStart(4, '0')}`; // 新しいタスクIDを生成

            console.log(`Creating new task with title: ${title} and ID: ${newTaskID}`);

            const taskQuery = 'INSERT INTO tasks (taskID, title, start, end, memo) VALUES (?, ?, ?, ?, ?)';
            db.query(taskQuery, [newTaskID, title, start, end, memo], (err) => {
                if (err) {
                    console.error('MySQL Error:', err.message);
                    return res.status(500).json({ error: 'Failed to create task', details: err.message });
                }

                const controlID = uuidv4(); // UUIDでコントロールIDを生成
                const controlQuery = 'INSERT INTO control (id, boardID, taskID) VALUES (?, ?, ?)';

                db.query(controlQuery, [controlID, boardID, newTaskID], (err) => {
                    if (err) {
                        console.error('MySQL Error:', err.message);
                        return res.status(500).json({ error: 'Failed to register control entry', details: err.message });
                    }
                    res.status(201).json({ message: 'Task created successfully', taskID: newTaskID });
                });
            });
        });
    });
});

// **タスク削除API**
app.delete('/tasks/:taskID', (req, res) => {
    const { taskID } = req.params;

    if (!taskID) {
        return res.status(400).json({ error: 'Task ID is required' });
    }

    db.beginTransaction((err) => {
        if (err) {
            console.error('Transaction Error:', err.message);
            return res.status(500).json({ error: 'Transaction error', details: err.message });
        }

        const controlQuery = 'DELETE FROM control WHERE taskID = ?';
        const taskQuery = 'DELETE FROM tasks WHERE taskID = ?';

        // Step 1: Delete from control table
        db.query(controlQuery, [taskID], (err, controlResult) => {
            if (err) {
                console.error('Error deleting from control:', err.message);
                return db.rollback(() => 
                res.status(500).json({ error: 'Failed to delete control entry', details: err.message })
                );
            }

            // Step 2: Delete from tasks table
            db.query(taskQuery, [taskID], (err, taskResult) => {
                if (err) {
                    console.error('Error deleting task:', err.message);
                    return db.rollback(() => res.status(500).json({ error: 'Failed to delete task', details: err.message }));
                }

                if (taskResult.affectedRows === 0) {
                    console.warn(`No task found for taskID: ${taskID}`);
                    return db.rollback(() =>
                        res.status(404).json({ error: 'Task not found for the specified taskID' })
                    );
                }

                // Step 3: Commit the transaction
                db.commit((err) => {
                    if (err) {
                        console.error('Transaction commit error:', err.message);
                        return db.rollback(() => res.status(500).json({ error: 'Transaction commit failed', details: err.message }));
                    }

                    console.log(`Successfully deleted task and control entry for taskID: ${taskID}`);
                    res.status(204).send();
                });
            });
        });
    });
});

// **ボード削除API**修正前
// app.delete('/boards/:boardID', (req, res) => {
//     const { boardID } = req.params;
//     console.log('Executing Query: ', deleteControlQuery, [boardID]);

//     //  修正前
//     if (!boardID) {
//         return res.status(400).json({ error: 'Board ID is required' });
//     }

//     // 削除ロジック
//     const deleteControlQuery = 'DELETE FROM control WHERE boardID = ?';
//     const deleteTaskQuery = 'DELETE FROM tasks WHERE taskID IN (SELECT taskID FROM control WHERE boardID = ?)';
//     const deleteBoardQuery = 'DELETE FROM boards WHERE boardID = ?';

//     db.beginTransaction((err) => {
//         if (err) {
//             console.error('Transaction Error:', err.message);
//             return res.status(500).json({ error: 'Transaction error', details: err.message });
//         }
//         console.log('Transaction started for boardID:', boardID);

//         // Step 1: controlテーブルから削除
//         db.query(deleteControlQuery, [boardID], (err) => {
//             if (err) {
//                 console.error('MySQL Error:', err.message);
//                 return db.rollback(() => res.status(500).json({ error: 'Failed to delete tasks', details: err.message }));
//             }
//             console.log('Control deletion result:', controlResults);

//             // Step 2: tasksテーブルから削除
//             db.query(deleteTaskQuery, [boardID], (err) => {
//                 if (err) {
//                     console.error('MySQL Error:', err.message);
//                     return db.rollback(() => res.status(500).json({ error: 'Failed to delete control entries', details: err.message }));
//                 }
//                 console.log('Task deletion result:', taskResults);

//                 // Step 3: boardsテーブルから削除
//                 db.query(deleteBoardQuery, [boardID], (err) => {
//                     if (err) {
//                         console.error('MySQL Error:', err.message);
//                         return db.rollback(() => res.status(500).json({ error: 'Failed to delete board', details: err.message }));
//                     }
//                     console.log('Board deletion result:', boardResults);

//                     // Commit transaction
//                     db.commit((err) => {
//                         if (err) {
//                             console.error('Commit Error:', err.message);
//                             return db.rollback(() => res.status(500).json({ error: 'Commit failed', details: err.message }));
//                         }
//                         res.status(204).send();
//                     });
//                 });
//             });
//         });
//     });
// });


// **ボード削除API**修正後
app.delete('/boards/:boardID', (req, res) => {
    const { boardID } = req.params;
    console.log('Received DELETE request for boardID:', boardID);

    if (!boardID) {
        return res.status(400).json({ error: 'Board ID is required' });
    }

    const deleteControlQuery = 'DELETE FROM control WHERE boardID = ?';
    const deleteTaskQuery = 'DELETE FROM tasks WHERE taskID IN (SELECT taskID FROM control WHERE boardID = ?)';
    const deleteBoardQuery = 'DELETE FROM boards WHERE boardID = ?';


    db.beginTransaction((err) => {
        if (err) {
            console.error('Transaction Error:', err.message);
            return res.status(500).json({ error: 'Transaction error', details: err.message });
        }

        console.log(`Starting transaction for boardID: ${boardID}`);

        // Step 1: Delete from control
        db.query(deleteControlQuery, [boardID], (err, controlResults) => {
            if (err) {
                console.error('Control table deletion error:', err.message);
                return db.rollback(() => res.status(500).json({ error: 'Failed to delete from control', details: err.message }));
            }

            console.log(`Control table deletion results:`, controlResults);

            // Step 2: Delete from tasks
            db.query(deleteTaskQuery, [boardID], (err, taskResults) => {
                if (err) {
                    console.error('Tasks table deletion error:', err.message);
                    return db.rollback(() => res.status(500).json({ error: 'Failed to delete tasks', details: err.message }));
                }

                console.log(`Tasks table deletion results:`, taskResults);

                // Step 3: Delete from boards
                db.query(deleteBoardQuery, [boardID], (err, boardResults) => {
                    if (err) {
                        console.error('Boards table deletion error:', err.message);
                        return db.rollback(() => res.status(500).json({ error: 'Failed to delete board', details: err.message }));
                    }

                    console.log(`Boards table deletion results:`, boardResults);

                    // Commit transaction
                    db.commit((err) => {
                        if (err) {
                            console.error('Transaction commit error:', err.message);
                            return db.rollback(() => res.status(500).json({ error: 'Transaction commit failed', details: err.message }));
                        }

                        console.log(`Transaction committed successfully for boardID: ${boardID}`);
                        res.status(204).send();
                    });
                });
            });
        });
    });
});

// **タスク移動API**
app.put('/tasks/:taskID/board', (req, res) => {
    console.log('Request params:', req.params); // taskID
    console.log('Request body:', req.body);     // newBoardID
    const { taskID } = req.params;
    const { newBoardID } = req.body;

    // taskIDの形式を確認
    if (!/^TASK-\d{4}$/.test(taskID)) {
        console.error('Invalid taskID format:', taskID);
        return res.status(400).json({ error: 'Invalid taskID format' });
    }

    if (!newBoardID) {
        return res.status(400).json({ error: 'New Board ID is required' });
    }

    // タスク存在確認と移動処理
    db.query('SELECT boardID FROM control WHERE taskID = ?', [taskID], (err, results) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({ error: 'Failed to verify task', details: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const currentBoardID = results[0].boardID;
        if (currentBoardID === newBoardID) {
            return res.status(400).json({ error: 'Task is already in the specified board' });
        }

        const updateQuery = 'UPDATE control SET boardID = ? WHERE taskID = ?';
        db.query(updateQuery, [newBoardID, taskID], (err, results) => {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(500).json({ error: 'Failed to move task', details: err.message });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Task not found or already in the specified board' });
            }

            res.status(200).json({ message: 'Task moved successfully', taskID, newBoardID });
        });
    });
});

// サーバー起動
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
