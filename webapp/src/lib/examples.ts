export const EXAMPLES = {
  'tic-tac-toe': {
    name: 'Tic-Tac-Toe Game',
    prose: `Build a tic-tac-toe game for two players.

The game board is a 3x3 grid. Players take turns placing X or O on empty cells. Player X always goes first. A player wins by getting three of their marks in a horizontal, vertical, or diagonal line. If all 9 cells are filled with no winner, the game is a draw.

The game should display whose turn it is, highlight the winning line when someone wins, and offer a "New Game" button to reset the board.`,
  },
  'user-registration': {
    name: 'User Registration',
    prose: `Build a user registration form with the following fields:
- Username (required, 3-20 characters, alphanumeric and underscores only)
- Email (required, valid email format)
- Password (required, minimum 8 characters, must contain at least one uppercase letter, one lowercase letter, one digit, and one special character)
- Confirm Password (must match password)

Show real-time validation errors below each field as the user types. The submit button should be disabled until all fields are valid. On successful submission, show a success message. On server error, show the error message.

Usernames and emails must be unique. Check username availability in real-time with a 500ms debounce.`,
  },
} as const;

export type ExampleKey = keyof typeof EXAMPLES;
