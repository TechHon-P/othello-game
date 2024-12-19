import { useState } from 'react';

const OthelloGame = () => {
  // ボードの初期状態を設定 (0: 空, 1: 黒, 2: 白)
  const initialBoard = Array(8).fill().map(() => Array(8).fill(0));
  initialBoard[3][3] = 2;
  initialBoard[3][4] = 1;
  initialBoard[4][3] = 1;
  initialBoard[4][4] = 2;

  const [board, setBoard] = useState(initialBoard);
  const [currentPlayer, setCurrentPlayer] = useState(1); // 1: 黒, 2: 白
  const [gameOver, setGameOver] = useState(false);

  // 指定された位置に駒を置けるかチェック
  const isValidMove = (row, col) => {
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
        if (board[x][y] === currentPlayer) {
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
    if (!isValidMove(row, col)) return;

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
    
    // 次のプレイヤーに有効な手があるかチェック
    const nextPlayer = currentPlayer === 1 ? 2 : 1;
    const hasValidMove = board.some((row, i) => 
      row.some((cell, j) => cell === 0 && isValidMove(i, j))
    );

    if (hasValidMove) {
      setCurrentPlayer(nextPlayer);
    } else {
      setGameOver(true);
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

  return (
    <div className="flex flex-col items-center p-4">
      <div className="mb-4 text-xl font-bold">
        {gameOver ? "ゲーム終了！" : `現在の手番: ${currentPlayer === 1 ? "黒" : "白"}`}
      </div>
      
      <div className="grid grid-cols-8 gap-1 bg-green-700 p-2">
        {board.map((row, i) => (
          row.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              className="w-12 h-12 bg-green-600 flex items-center justify-center cursor-pointer"
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
          ))
        ))}
      </div>

      <div className="mt-4 text-lg">
        {`黒: ${countPieces().black} | 白: ${countPieces().white}`}
      </div>
    </div>
  );
};

export default OthelloGame;