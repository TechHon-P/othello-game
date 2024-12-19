import { useState, useEffect } from 'react';

const OthelloGame = () => {
  const initialBoard = Array(8).fill().map(() => Array(8).fill(0));
  initialBoard[3][3] = 2;
  initialBoard[3][4] = 1;
  initialBoard[4][3] = 1;
  initialBoard[4][4] = 2;

  const [board, setBoard] = useState(initialBoard);
  const [currentPlayer, setCurrentPlayer] = useState(1); // 1: 黒, 2: 白
  const [gameOver, setGameOver] = useState(false);
  const [history, setHistory] = useState([initialBoard]); // 盤面の履歴
  const [showHints, setShowHints] = useState(true); // ヒントの表示
  const [isAIEnabled, setIsAIEnabled] = useState(false); // AI機能の有効/無効
  const [aiLevel, setAILevel] = useState(5); // AIの強さ (1-10)
  const [lastPass, setLastPass] = useState(false); // 直前のプレイヤーがパスしたか

  // 有効な手の判定
  const isValidMove = (board, player, row, col) => {
    if (board[row][col] !== 0) return false;

    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    return directions.some(([dx, dy]) => {
      let x = row + dx;
      let y = col + dy;
      let flips = [];

      while (x >= 0 && x < 8 && y >= 0 && y < 8) {
        if (board[x][y] === 0) return false;
        if (board[x][y] === player) {
          return flips.length > 0;
        }
        flips.push([x, y]);
        x += dx;
        y += dy;
      }
      return false;
    });
  };

  // 駒を置いて、挟まれた駒をひっくり返す
  const makeMove = (row, col) => {
    if (!isValidMove(board, currentPlayer, row, col)) return;

    const newBoard = board.map(row => [...row]);
    newBoard[row][col] = currentPlayer;

    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    directions.forEach(([dx, dy]) => {
      let x = row + dx;
      let y = col + dy;
      let flips = [];

      while (x >= 0 && x < 8 && y >= 0 && y < 8) {
        if (board[x][y] === 0) break;
        if (board[x][y] === currentPlayer) {
          flips.forEach(([fx, fy]) => {
            newBoard[fx][fy] = currentPlayer;
          });
          break;
        }
        flips.push([x, y]);
        x += dx;
        y += dy;
      }
    });

    setBoard(newBoard);
    setHistory([...history, newBoard]);
    setLastPass(false);
    
    switchPlayer();
  };

  // 手番を切り替える
  const switchPlayer = () => {
    const nextPlayer = currentPlayer === 1 ? 2 : 1;
    if (hasValidMoves(board, nextPlayer)) {
      setCurrentPlayer(nextPlayer);
      if (nextPlayer === 2 && isAIEnabled) {
        setTimeout(() => makeAIMove(), 1000);
      }
    } else if (!lastPass) {
      // パスの処理
      setLastPass(true);
      setCurrentPlayer(nextPlayer);
    } else {
      // ゲーム終了
      setGameOver(true);
    }
  };

  // 有効な手があるかチェック
  const hasValidMoves = (board, player) => {
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (isValidMove(board, player, i, j)) {
          return true;
        }
      }
    }
    return false;
  };

  // 手を戻す
  const undoMove = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      setBoard(newHistory[newHistory.length - 1]);
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
      setGameOver(false);
      setLastPass(false);
    }
  };

  // ゲームをリセット
  const resetGame = () => {
    setBoard(initialBoard);
    setCurrentPlayer(1);
    setGameOver(false);
    setHistory([initialBoard]);
    setLastPass(false);
  };

  // パスする
  const pass = () => {
    if (!hasValidMoves(board, currentPlayer)) {
      setLastPass(true);
      switchPlayer();
    }
  };

  // AIの手を評価する
  const evaluateMove = (board, player) => {
    let score = 0;
    const weights = [
      [100, -20, 10, 5, 5, 10, -20, 100],
      [-20, -50, -2, -2, -2, -2, -50, -20],
      [10, -2, 1, 1, 1, 1, -2, 10],
      [5, -2, 1, 1, 1, 1, -2, 5],
      [5, -2, 1, 1, 1, 1, -2, 5],
      [10, -2, 1, 1, 1, 1, -2, 10],
      [-20, -50, -2, -2, -2, -2, -50, -20],
      [100, -20, 10, 5, 5, 10, -20, 100]
    ];

    // 局面の評価
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (board[i][j] === player) {
          score += weights[i][j] * (aiLevel / 5); // AIレベルによって重みを調整
        } else if (board[i][j] === (player === 1 ? 2 : 1)) {
          score -= weights[i][j] * (aiLevel / 5);
        }
      }
    }

    // 有効手の数を評価に加える
    const mobility = hasValidMoves(board, player) ? 1 : -1;
    score += mobility * (aiLevel * 2);

    return score;
  };

  // AIの手を決定
  const makeAIMove = () => {
    if (currentPlayer !== 2 || !isAIEnabled) return;

    let bestScore = -Infinity;
    let bestMove = null;

    // すべての有効な手を評価
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (isValidMove(board, 2, i, j)) {
          const newBoard = board.map(row => [...row]);
          // 仮の手を打つ
          makeMove(i, j);
          const score = evaluateMove(newBoard, 2);
          if (score > bestScore) {
            bestScore = score;
            bestMove = [i, j];
          }
        }
      }
    }

    // 最善手を実行
    if (bestMove) {
      makeMove(bestMove[0], bestMove[1]);
    } else {
      pass();
    }
  };

  // 駒の数を数える
  const countPieces = () => {
    let black = 0;
    let white = 0;
    board.forEach(row => {
      row.forEach(cell => {
        if (cell === 1) black++;
        if (cell === 2) white++;
      });
    });
    return { black, white };
  };

  // 有効な手の位置を取得
  const getValidMoves = () => {
    const moves = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (isValidMove(board, currentPlayer, i, j)) {
          moves.push([i, j]);
        }
      }
    }
    return moves;
  };

  return (
    <div className="flex flex-col items-center p-4">
      <div className="mb-4 space-y-2">
        <div className="text-xl font-bold">
          {gameOver ? "ゲーム終了！" : `現在の手番: ${currentPlayer === 1 ? "黒" : "白"}`}
        </div>
        <div className="flex space-x-4">
          <button
            onClick={resetGame}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            リセット
          </button>
          <button
            onClick={undoMove}
            disabled={history.length <= 1}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            元に戻す
          </button>
          <button
            onClick={pass}
            disabled={hasValidMoves(board, currentPlayer)}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
          >
            パス
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showHints}
              onChange={(e) => setShowHints(e.target.checked)}
              className="mr-2"
            />
            ヒントを表示
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isAIEnabled}
              onChange={(e) => setIsAIEnabled(e.target.checked)}
              className="mr-2"
            />
            AI対戦
          </label>
          {isAIEnabled && (
            <div className="flex items-center">
              <span className="mr-2">AIレベル:</span>
              <input
                type="range"
                min="1"
                max="10"
                value={aiLevel}
                onChange={(e) => setAILevel(parseInt(e.target.value))}
                className="w-32"
              />
              <span className="ml-2">{aiLevel}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-8 gap-1 bg-green-700 p-2">
        {board.map((row, i) => (
          row.map((cell, j) => {
            const isValidMoveCell = showHints && isValidMove(board, currentPlayer, i, j);
            return (
              <div
                key={`${i}-${j}`}
                className={`w-12 h-12 flex items-center justify-center cursor-pointer ${
                  isValidMoveCell ? 'bg-green-400' : 'bg-green-600'
                }`}
                onClick={() => makeMove(i, j)}
              >
                {cell !== 0 && (
                  <div
                    className={`w-10 h-10 rounded-full ${
                      cell === 1 ? 'bg-black' : 'bg-white'
                    }`}
                  />
                )}
              </div>
            );
          })
        ))}
      </div>

      <div className="mt-4 text-lg">
        {`黒: ${countPieces().black} | 白: ${countPieces().white}`}
      </div>
    </div>
  );
};

export default OthelloGame;