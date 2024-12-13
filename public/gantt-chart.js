fetch('/tasks/boards')
  .then(response => {
    // サーバーからのレスポンスが正常かどうかを確認
    if (!response.ok) {
      throw new Error(`HTTPエラー: ${response.status}`);
    }
    // レスポンスをJSON形式に変換して返す
    return response.json();
  })
  .then(boards => {
    // ボードが存在しない場合はメッセージを表示して終了
    if (boards.length === 0) {
      document.getElementById('chart').innerHTML = '<p>タスクが登録されているボードがありません。</p>';
      return;
    }

    // 表示期間の変更
    const viewRangeSelector = document.getElementById('view-range');
    let currentRange = 'week'; // デフォルトの表示期間（1週間）
    
    // 表示期間が変更された際にグラフを更新
    viewRangeSelector.addEventListener('change', () => {
      currentRange = viewRangeSelector.value;
      updateCharts(boards, currentRange);
    });

    // 初期表示でグラフを描画
    updateCharts(boards, currentRange);
  })
  .catch(error => {
    // エラーが発生した場合の処理
    console.error('タスクデータの取得中にエラーが発生しました:', error);
    document.getElementById('chart').innerHTML = '<p>データの取得に失敗しました。</p>';
  });

// チャートを更新する関数
function updateCharts(boards, range) {
  // 現在のグラフをクリア
  document.getElementById('chart').innerHTML = '';

  const parseDate = d3.timeParse('%Y-%m-%dT%H:%M'); // ISO8601形式の日付をパース
  const now = new Date(); // 現在時刻を取得
  let rangeStart, rangeEnd, tickFormat; // 表示範囲とX軸のフォーマットを格納

  // 表示範囲とX軸フォーマットを設定
  switch (range) {
    case 'day': // 1日の場合
      rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      rangeEnd = new Date(rangeStart);
      rangeEnd.setDate(rangeStart.getDate() + 1); // 翌日
      tickFormat = d3.timeFormat('%H:%M'); // 時間・分
      break;
    case 'week': // 1週間の場合
      rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      rangeEnd = new Date(rangeStart);
      rangeEnd.setDate(rangeStart.getDate() + 7); // 7日後
      tickFormat = d3.timeFormat('%m/%d %H:%M'); // 日にち・時間
      break;
    case 'month': // 1か月の場合
      rangeStart = new Date(now.getFullYear(), now.getMonth(), 1); // 今月の1日
      rangeEnd = new Date(rangeStart.getFullYear(), rangeStart.getMonth() + 1, 1); // 翌月の1日
      tickFormat = d3.timeFormat('%m/%d'); // 日にち
      break;
    default: // デフォルトは1週間
      rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      rangeEnd = new Date(rangeStart);
      rangeEnd.setDate(rangeStart.getDate() + 7);
      tickFormat = d3.timeFormat('%m/%d %H:%M');
  }

  // 各ボードに対してチャートを作成
  boards.forEach(board => {
    if (!board.tasks || board.tasks.length === 0) {
      // タスクが存在しない場合のメッセージ
      const noTaskMessage = `<p>ボード「${board.boardTitle}」にはタスクがありません。</p>`;
      document.getElementById('chart').innerHTML += noTaskMessage;
      return;
    }

    // タスクデータをフィルタリングし、適切な形式に変換
    const tasks = board.tasks
      .map(task => {
        const startDate = parseDate(task.start) || new Date(task.start); // 開始日時をパース
        const endDate = parseDate(task.end) || new Date(task.end); // 終了日時をパース
        if (startDate > endDate) {
          console.error('タスクの開始日時が終了日時より後です:', task);
          return null; // 不正データを無視
        }
        return {
          name: task.taskTitle, // タスク名
          startDate,
          endDate,
        };
      })
      .filter(task => task !== null) // 不正データを除外
      .filter(task => task.endDate >= rangeStart && task.startDate <= rangeEnd); // 表示範囲内のタスクのみ

    if (tasks.length === 0) {
      // 表示範囲内にタスクがない場合のメッセージ
      const noValidTaskMessage = `<p>ボード「${board.boardTitle}」に有効なタスクがありません。</p>`;
      document.getElementById('chart').innerHTML += noValidTaskMessage;
      return;
    }

    // ボードごとのコンテナを作成
    const container = document.createElement('div');
    container.className = 'board-container';
    container.id = `board-container-${board.boardID}`;

    // ボードタイトルを追加
    const titleDiv = document.createElement('div');
    titleDiv.className = 'board-title';
    titleDiv.innerHTML = `<h2>${board.boardTitle}</h2>`;
    container.appendChild(titleDiv);

    // チャート描画エリアを追加
    const chartDiv = document.createElement('div');
    chartDiv.className = 'board-chart';
    chartDiv.id = `chart-board-${board.boardID}`;
    container.appendChild(chartDiv);

    // チャートエリアを親要素に追加
    document.getElementById('chart').appendChild(container);

    // SVGの設定
    const margin = { top: 20, right: 30, bottom: 80, left: 100 };
    const width = 1000 - margin.left - margin.right;
    const height = tasks.length * 30;

    const svg = d3
      .select(`#chart-board-${board.boardID}`)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X軸スケールの設定
    const xScale = d3
      .scaleTime()
      .domain([rangeStart, rangeEnd]) // 表示範囲を設定
      .range([0, width]);

    // Y軸スケールの設定
    const yScale = d3
      .scaleBand()
      .domain(tasks.map(task => task.name)) // タスク名をY軸に配置
      .range([0, height])
      .padding(0.1);

    // X軸の描画
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(tickFormat)) // 期間に応じたフォーマットを適用
      .selectAll('text') // ラベルを取得
      .style('text-anchor', 'end') // ラベルの基準位置を変更
      .attr('dx', '-0.8em') // ラベルを左にシフト
      .attr('dy', '0.15em') // ラベルを微調整
      .attr('transform', 'rotate(-45)'); // ラベルを45度回転

    // Y軸の描画
    svg.append('g').call(d3.axisLeft(yScale));

    // ガントチャートバーの描画（表示範囲外の部分をクリップ）
    svg
      .selectAll('.bar')
      .data(tasks)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => Math.max(0, xScale(d.startDate))) // 開始日時が範囲内に収まるよう調整
      .attr('y', d => yScale(d.name))
      .attr('width', d => Math.max(0, xScale(d.endDate) - Math.max(0, xScale(d.startDate)))) // 表示範囲内の長さを計算
      .attr('height', yScale.bandwidth());
  });
}
