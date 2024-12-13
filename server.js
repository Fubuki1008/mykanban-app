// 修正版
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
