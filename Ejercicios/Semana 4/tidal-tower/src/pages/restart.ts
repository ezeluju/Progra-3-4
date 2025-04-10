import { resetGame } from "../lib/gamestate";

export async function post() {
  resetGame();

  return new Response(null, {
    status: 303,
    headers: { Location: "/" },
  });
}
