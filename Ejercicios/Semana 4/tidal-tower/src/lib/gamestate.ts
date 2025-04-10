let board: (string | null)[] = Array(9).fill(null);
let currentPlayer = "X";

export function getBoardState() {
  return board;
}

export function getCurrentPlayer() {
  return currentPlayer;
}

export function playMove(index: number) {
  if (board[index] || checkWinner()) return;
  
  board[index] = currentPlayer;
  currentPlayer = currentPlayer === "X" ? "O" : "X";
}

export function checkWinner() {
  const winningCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  
  for (const [a, b, c] of winningCombos) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return board.includes(null) ? null : "Empate";
}

export function resetGame() {
  board = Array(9).fill(null);
  currentPlayer = "X";
}
