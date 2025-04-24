let board = Array(9).fill('');
let currentPlayer = 'X';
let winner = null;

export function makeMove(index) {
  if (!board[index] && !winner) {
    board[index] = currentPlayer;
    checkWinner();
    if (!winner) currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  }
}

export function resetGame() {
  board = Array(9).fill('');
  currentPlayer = 'X';
  winner = null;
}

function checkWinner() {
  const winConditions = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  for (const [a,b,c] of winConditions) {
    if(board[a] && board[a] === board[b] && board[a] === board[c]){
      winner = board[a];
      return;
    }
  }

  if(board.every(cell => cell !== '')) winner = 'Empate';
}

export function getGameState() {
  return { board, currentPlayer, winner };
}
