import { playMove } from "../lib/gamestate";

export async function post({ request }) {
  const formData = await request.formData();
  const index = parseInt(formData.get("index") as string, 10);
  
  playMove(index);

  return new Response(null, {
    status: 303,
    headers: { Location: "/" },
  });
}
