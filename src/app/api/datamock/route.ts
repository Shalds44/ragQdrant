import { NextApiRequest, NextApiResponse } from 'next';

import fs from 'fs';
import path from 'path';

export async function GET(req: NextApiRequest, res: NextApiResponse) {
  const markdownFilePath = path.join(process.cwd(), 'modelvuejs.md');
  const markdownContent = fs.readFileSync(markdownFilePath, 'utf-8');

  return new Response(markdownContent);
}