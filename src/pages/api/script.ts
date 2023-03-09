import { NextApiRequest, NextApiResponse } from 'next';
// import { ScriptService } from '@/server/services/script.service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('========== RUNNING SCRIPT ========');

  res.json({ script: true });
  res.end();
}
