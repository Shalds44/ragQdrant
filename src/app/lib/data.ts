import { promises as fs } from 'fs';
import path from 'path';

export async function fetchMd(){
    const markdownFilePath = path.join(process.cwd(), 'modelvuejs.md');
    const markdownContent = fs.readFile(markdownFilePath, 'utf-8');
    return markdownContent
}