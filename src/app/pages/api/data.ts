import { NextApiRequest, NextApiResponse } from 'next';

import fs from 'fs';
import path from 'path';

export async function GET(req: NextApiRequest, res: NextApiResponse) {
    console.log("dddddddddddddddddddddddddddddddddddddddddddddddddddd")
  const markdownFilePath = path.join(process.cwd(), 'modelvuejs.md');
  const markdownContent = fs.readFileSync(markdownFilePath, 'utf-8');

  return res.status(200).json({ content: markdownContent });
}