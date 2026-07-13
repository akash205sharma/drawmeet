import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function generateDiagram({
  token,
  boardId,
  prompt,
}: {
  token: string | null;
  boardId: string | undefined;
  prompt: string;
}) {
  const { data } = await axios.post(
    `${API_URL}/ai/diagram`,
    {
      boardId,
      prompt,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return data;
}

export async function summarizeBoard({
  token,
  boardId,
}: {
  token: string | null;
  boardId: string | undefined;
}) {
  const { data } = await axios.post(
    `${API_URL}/ai/summarize`,
    {
      boardId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return data;
}