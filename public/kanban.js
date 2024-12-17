//カンバンボード方式のタスク管理アプリ

// リクエスト管理用のオブジェクトを追加   以下２行追加
let requestIDCounter = 0;
const requestTracker = new Map(); // リクエスト管理

// DOM要素の取得
const boardForm = document.getElementById('board-form'); // ボード名入力フォーム
const boardNameInput = document.getElementById('board-name'); // ボード名入力フィールド
const kanbanContainer = document.getElementById('kanban'); // カンバンボード全体のコンテナ

// ボードとタスクのデータを保存する配列
let boards = []; // ローカルストレージからボードデータを取得、ない場合は空配列
let tasks = []; // ローカルストレージからタスクデータを取得、ない場合は空配列

// ローカルストレージの更新
function saveToLocalStorage() {
  // データをローカルストレージに保存する
  localStorage.setItem('boards', JSON.stringify(boards));
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// サーバーからボードデータを取得
async function fetchBoardsFromServer() {
  try {
    const response = await fetch('http://localhost:3000/boards');
    if (!response.ok) throw new Error(`Failed to fetch boards: ${response.status}`);
    const boardsFromServer = await response.json();
    
    // サーバーのデータ形式に合わせて変換
    return boardsFromServer.map(board => ({
      id: board.boardID, // サーバーの `boardID` をクライアントの `id` に対応
      name: board.title, // `title` を `name` に対応
    }));
  } catch (error) {
    console.error('Error fetching boards:', error);
    alert('ボードデータの取得に失敗しました。サーバーを確認してください。');
    return [];
  }
}

// ボードを追加する関数
async function addBoard(name) {
  const boardTitle = name.trim(); // 入力をトリムして不要な空白を削除
  if (!boardTitle) {
    alert('ボード名を入力してください。');
    return;
  }

  // 同じ名前のボードが既に存在する場合は処理を中断
  if (boards.some(existingBoard => existingBoard.name === boardTitle)) {
    alert(`Board with name "${boardTitle}" already exists.`);
    return;
  }

  const board = { title: boardTitle }; // ボード名だけを送信
  const requestID = ++requestIDCounter; // ユニークなリクエストIDを生成 追加
  requestTracker.set(requestID, boardTitle); // リクエストを管理  追加

  try {
    // サーバーにボードを送信
    console.log(`Sending request with ID: ${requestID}`); // リクエスト送信ログ
    const response = await fetch('http://localhost:3000/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(board),
    });

    if (!response.ok) {
      const errorData = await response.json(); // サーバーからのエラーメッセージを取得
      throw new Error(
        `Failed to create board on server: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const createdBoard = await response.json(); // サーバーから返却されたボードデータ

    // サーバーで成功した場合のみローカルデータに追加
    boards.push({ id: createdBoard.boardID, name: boardTitle });  // `name` を保存
    saveToLocalStorage();
    renderBoard({ id: createdBoard.boardID, name: boardTitle });
    // 入力フィールドをクリア
    //document.getElementById("board-name").value = ""; 修正前
    boardNameInput.value = '';  //修正後
    console.log(`Request completed successfully: ID=${requestID}`); //リクエスト回数
  } catch (error) {
    console.error('Error creating board:', error);
    alert('ボードの作成に失敗しました。サーバーを確認してください。');
  } finally {
    requestTracker.delete(requestID); //リクエスト管理から削除
    boardForm.querySelector('button[type="submit"]').disabled = false; 
  }
}

// ボード追加イベントリスナー
boardForm.addEventListener('submit', (e) => {
  e.preventDefault(); // フォーム送信時のページリロードを防止
  const boardName = boardNameInput.value; // 入力フィールドの値を取得
  console.log(`Submitted board name: "${boardName}"`); // デバッグ用ログ
  if (boards.length >= 5) {
    alert('ボードは最大５つまで作成できます。');
    return;
  }
  addBoard(boardName);  // 新しいボードを追加
});

// ボードを画面に描画する関数
function renderBoard(board) {
  const column = document.createElement('div');
  column.className = 'kanban-column'; // ボード用のクラスを設定
  column.id = board.id; // ボードIDを設定
  column.setAttribute('data-board-id', board.id); // data属性を設定
  column.innerHTML = `
    <h2 class="board-name-style">${board.name}
    <button class="delete-board">削除</button>
    </h2>
    <div class="add-board-button">
      <button class="add-task">+ タスク追加</button>
    </div>
  `;
  kanbanContainer.appendChild(column);  // カンバンボードに追加

  column.querySelector('.delete-board').addEventListener('click', () => deleteBoard(board.id));
  column.querySelector('.add-task').addEventListener('click', () => showTaskModal(board.id));
}

// ボードを削除する関数
function deleteBoard(boardID) {
  boards = boards.filter(board => board.id !== boardID);  // 対象のボードをリストから削除
  tasks = tasks.filter(task => task.boardID !== boardID); // 関連するタスクも削除
  saveToLocalStorage();   // ローカルストレージを更新
  document.getElementById(boardID).remove();  // ボードを画面から削除

  // サーバーに削除リクエストを送信
  fetch(`http://localhost:3000/boards/${boardID}`, { method: 'DELETE' })
    .catch(error => console.error('Error deleting board on server:', error)); // エラーハンドリング
}

// タスク追加用モーダルを表示する関数
function showTaskModal(boardID) {
  const modal = document.createElement('div');  // モーダルを作成
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>新規タスク</h3>
      <form id="task-form" class="modal-form">
        <div>
          <label>
            タスク名（20字以内）
            <input type="text" class="modal-items" id="task-name" maxlength="20" required>
            <span id="task-name-counter" class="counter">残り20文字</span>
          </label>
          <label>
            開始時間
            <input type="datetime-local" class="modal-items" id="task-start" required>
          </label>
          <label>
            終了時間
            <input type="datetime-local" class="modal-items" id="task-end" required>
            <span id="task-error" style="color: red; display: none;">終了日時は開始日時より後に設定してください</span>
          </label>
          <label>
            メモ（100字以内）
            <textarea id="task-memo" class="modal-items" rows=4 maxlength="100"></textarea>
            <span id="task-memo-counter" class="counter">残り100文字</span>
          </label>
        </div>
        <div>
          <button type="submit" id="add-task-button">追加</button>
          <button type="button" id="close-modal">キャンセル</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal); // モーダルを画面に追加

  const taskForm = document.getElementById('task-form');  // タスク入力フォーム
  const closeButton = document.getElementById('close-modal');   // キャンセルボタン
  const taskNameInput = document.getElementById('task-name');
  const taskMemoInput = document.getElementById('task-memo');
  const taskStartInput = document.getElementById('task-start');
  const taskEndInput = document.getElementById('task-end');
  const taskError = document.getElementById('task-error');    // エラーメッセージ表示用
  const taskNameCounter = document.getElementById('task-name-counter');
  const taskMemoCounter = document.getElementById('task-memo-counter');
  const addTaskButton = document.getElementById('add-task-button');   // タスク追加ボタン

  // 入力カウンター更新関数
  const updateCounter = (input, counter, maxLength) => {
    const remaining = maxLength - input.value.length;
    counter.textContent = `残り${remaining}文字`;
  };

  // 終了日時のバリデーション関数
  const validateEndDate = () => {
    const startTime = new Date(taskStartInput.value);
    const endTime = new Date(taskEndInput.value);
    if (taskEndInput.value && startTime > endTime) {
      taskError.style.display = 'block';  // エラー表示
      addTaskButton.disabled = true;    // ボタンを無効化
    } else {
      taskError.style.display = 'none';   // エラー非表示
      addTaskButton.disabled = false;     // ボタンを有効化
    }
  };

  taskNameInput.addEventListener('input', () => updateCounter(taskNameInput, taskNameCounter, 20));
  taskMemoInput.addEventListener('input', () => updateCounter(taskMemoInput, taskMemoCounter, 100));
  taskStartInput.addEventListener('input', validateEndDate);
  taskEndInput.addEventListener('input', validateEndDate);

  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();   // フォーム送信時のリロードを防止
    addTask(boardID);     // タスクを追加
    modal.remove();       // モーダルを閉じる
  });

  closeButton.addEventListener('click', () => modal.remove());    // キャンセル時モーダルを閉じる
}

// タスクを追加する関数
async function addTask(boardID) {
  
  // モーダル内の入力値を取得
  const taskName = document.getElementById('task-name').value;
  const taskStart = document.getElementById('task-start').value;
  const taskEnd = document.getElementById('task-end').value;
  const taskMemo = document.getElementById('task-memo').value;

  // 新しいタスクオブジェクトを作成
  const task = {
    // taskID: Date.now().toString(), // 一意のタスクID
    boardID: boardID, // このタスクが属するボードのID
    title: taskName,  // タスク名
    start: taskStart, // 開始日時
    end: taskEnd,     // 終了日時
    memo: taskMemo    // タスクのメモ
  };

  // サーバーにタスクを送信（API通信）
  try {
    const response = await fetch('http://localhost:3000/tasks', {
    method: 'POST', // POSTメソッドでリクエストを送信
    headers: { 'Content-Type': 'application/json' }, // JSON形式で送信
    body: JSON.stringify(task) // タスクデータをJSON形式に変換して送信
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      'Failed to create task on server: ${response.status} - ${JSON.stringify(errorData)}'
    );
  }

  const createdTask = await response.json(); // サーバーから返却されたタスクデータ

  // タスクにサーバーから返されたIDを設定しローカルに保存
  const newTask = {
    ...task,
    taskID: createdTask.taskID // サーバーで生成されたIDを使用
  };

  tasks.push(newTask); // タスクリストに追加
  saveToLocalStorage(); // ローカルストレージを更新
  renderTask(newTask); // UIにタスクを描画
} catch (error) {
  console.error('Error creating task:', error);
  alert('タスクの作成に失敗しました。サーバーを確認してください。');
}
}

// タスクを描画する関数
function renderTask(task) {
  const boardElement = document.getElementById(task.boardID); // タスクの属するボードを取得
  if (!boardElement) return; // ボードが存在しない場合は処理を中断

  // 日時のフォーマット
  const startFormatted = formatDateTime(task.start);
  const endFormatted = formatDateTime(task.end);

  // タスク要素を作成
  const taskElement = document.createElement('div');
  taskElement.className = 'task'; // CSSクラスを適用
  taskElement.draggable = true; // ドラッグ可能に設定
  taskElement.id = task.taskID; // タスクIDを設定

  taskElement.innerHTML = `
    <h3 class="task-style">${task.title}</h3>
    <div class="time-style">
      <p class="border">開始: ${startFormatted}</p>
      <p class="border-2">終了: ${endFormatted}</p>
    </div>
    <div>
      <div class="memo-title-style">詳細情報</div>
      <p class="memo-style">${task.memo || '<span class="placeholder">詳細情報</span>'}</p>
    </div>
    <button class="edit-task">編集</button>
    <button class="delete-task">削除</button>
  `;

  boardElement.appendChild(taskElement); // ボードにタスクを追加
  taskElement.querySelector('.edit-task').addEventListener('click', () => openEditTaskModal(task.taskID));  // 編集ボタンイベント追加
  taskElement.querySelector('.delete-task').addEventListener('click', () => deleteTask(task.taskID)); // 削除ボタンイベント追加
  taskElement.addEventListener('dragstart', dragStart); // ドラッグ開始イベント
  taskElement.addEventListener('dragend', dragEnd);     // ドラッグ終了イベント
}

// タスク編集用モーダルを表示する関数
function openEditTaskModal(taskID) {
  const task = tasks.find(t => t.taskID === taskID); // タスクIDからタスクを取得
  if (!task) return;

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>タスクを編集</h3>
      <form id="edit-task-form" class="modal-form">
        <div>
          <label>
            タスク名（20字以内）
            <input type="text" class="modal-items" id="edit-task-name" maxlength="20" value="${task.title}" required>
            <span id="edit-task-name-counter" class="counter">残り${20 - task.title.length}文字</span>
          </label>
          <label>
            開始時間
            <input type="datetime-local" class="modal-items" id="edit-task-start" value="${task.start}" required>
          </label>
          <label>
            終了時間
            <input type="datetime-local" class="modal-items" id="edit-task-end" value="${task.end}" required>
            <span id="edit-task-error" style="color: red; display: none;">終了日時は開始日時より後に設定してください</span>
          </label>
          <label>
            メモ（100字以内）
            <textarea id="edit-task-memo" class="modal-items" rows=4 maxlength="100">${task.memo}</textarea>
            <span id="edit-task-memo-counter" class="counter">残り${100 - task.memo.length}文字</span>
          </label>
        </div>
        <div>
          <button type="submit" id="save-edit-task-button">保存</button>
          <button type="button" id="close-edit-modal">キャンセル</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  const taskNameInput = document.getElementById('edit-task-name');
  const taskMemoInput = document.getElementById('edit-task-memo');
  const taskStartInput = document.getElementById('edit-task-start');
  const taskEndInput = document.getElementById('edit-task-end');
  const taskError = document.getElementById('edit-task-error');
  const taskNameCounter = document.getElementById('edit-task-name-counter');
  const taskMemoCounter = document.getElementById('edit-task-memo-counter');

  const updateCounter = (input, counter, maxLength) => {
    const remaining = maxLength - input.value.length;
    counter.textContent = `残り${remaining}文字`;
  };

  const validateEndDate = () => {
    const startTime = new Date(taskStartInput.value);
    const endTime = new Date(taskEndInput.value);
    if (startTime > endTime) {
      taskError.style.display = 'block';
      document.getElementById('save-edit-task-button').disabled = true;
    } else {
      taskError.style.display = 'none';
      document.getElementById('save-edit-task-button').disabled = false;
    }
  };

  taskNameInput.addEventListener('input', () => updateCounter(taskNameInput, taskNameCounter, 20));
  taskMemoInput.addEventListener('input', () => updateCounter(taskMemoInput, taskMemoCounter, 100));
  taskStartInput.addEventListener('input', validateEndDate);
  taskEndInput.addEventListener('input', validateEndDate);

  document.getElementById('edit-task-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // 更新データの取得
    const updatedTask = {
      ...task,
      title: taskNameInput.value,
      start: taskStartInput.value,
      end: taskEndInput.value,
      memo: taskMemoInput.value,
    };

    // サーバーへの更新リクエスト送信
    try {
      const response = await fetch(`http://localhost:3000/tasks/${taskID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask),
      });

      if (!response.ok) throw new Error(`Failed to update task on server`);

      // ローカルデータの更新
      tasks = tasks.map(t => (t.taskID === taskID ? updatedTask : t));
      saveToLocalStorage();

      // UI更新
      document.getElementById(taskID).remove();
      renderTask(updatedTask);

      modal.remove();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('タスクの更新に失敗しました。サーバーを確認してください。');
    }
  });

  document.getElementById('close-edit-modal').addEventListener('click', () => modal.remove());
}

// タスクを削除する関数
function deleteTask(taskId) {
  tasks = tasks.filter(t => t.taskID !== taskId); // 指定のタスクをリストから削除
  saveToLocalStorage(); // ローカルストレージを更新
  document.getElementById(taskId).remove(); // タスクを画面から削除

  // サーバーからもタスクを削除
  fetch(`http://localhost:3000/tasks/${taskId}`, { method: 'DELETE' })
    .catch(error => console.error('Network error:', error)); // エラーハンドリング
}

// 日時をフォーマットする関数
function formatDateTime(dateTimeString) {
  const date = new Date(dateTimeString); // 入力文字列をDateオブジェクトに変換
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 月は0から始まるため+1
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0'); // 分を2桁表示に揃える
  return `${year}年${month}月${day}日${hours}時${minutes}分`; // フォーマットされた文字列を返す
}

// ドラッグ開始イベント
function dragStart(e) {
  e.dataTransfer.setData('text/plain', e.target.id); // ドラッグ対象のIDをセット
  setTimeout(() => (e.target.style.display = 'none'), 0); // ドラッグ中は非表示
}

// ドラッグ終了イベント
function dragEnd(e) {
  e.target.style.display = 'block'; // ドラッグ終了後に再表示
}

// ドロップ可能エリアの設定
kanbanContainer.addEventListener('dragover', (e) => e.preventDefault()); // ドロップ可能に設定

//  ドロップイベントの処理  修正後
kanbanContainer.addEventListener('drop', (e) => {
  e.preventDefault();
  
  const taskId = e.dataTransfer.getData('text'); // ドラッグ対象のIDを取得
  const task = document.getElementById(taskId); // タスク要素を取得
  const targetColumn = e.target.closest('.kanban-column'); // 移動先のカンバンボード
  console.log('Drop target:', targetColumn);
  console.log('Drop target ID:', targetColumn ? targetColumn.id : 'null');

  if (!targetColumn) {
    console.error('Drop target is not a valid kanban column.');
    return; // ボード要素でない場合は処理を中断
  }

  const newBoardID = targetColumn.id; // 新しいボードIDを取得
  targetColumn.appendChild(task); // タスクを新しいボードに移動

  // タスクの所属ボードIDを更新
  tasks = tasks.map(t => t.taskID === taskId ? { ...t, boardID: newBoardID } : t);
  saveToLocalStorage(); // ローカルストレージを更新

  // サーバーに更新を通知
  fetch(`http://localhost:3000/tasks/${taskId}/board`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newBoardID }) // 更新するボードIDを送信
  }).catch(error => console.error('Error updating task board:', error));
});


// 初期化関数
async function initialize() {
  try {
    boards = await fetchBoardsFromServer(); // サーバーからボードを取得
    if (boards.length === 0) {
      console.log("No boards retrieved from the server.");
    }
    tasks = JSON.parse(localStorage.getItem('tasks')) || []; // ローカルストレージからタスクを取得

    // ボードを描画
    boards.forEach(board => renderBoard(board));

    // タスクを描画
    tasks.forEach(task => {
      const boardElement = document.getElementById(task.boardID);
      if (boardElement) {
        renderTask(task);
      }
    });

    saveToLocalStorage(); // 初期化後にローカルストレージを更新
  } catch (error) {
    console.error('Error during initialization:', error);
  }
}

initialize(); // アプリを初期化