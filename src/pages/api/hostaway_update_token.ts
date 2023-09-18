import { NextApiRequest, NextApiResponse } from 'next';
// import { ScriptService } from '@/server/services/script.service';
import { generateToken } from '@/server/repository/hostaway.repo';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('========== EXECUTING CRON JOB UPDATE ACCESS TOKEN (HOSTAWAY) :: INITATED ========');
  console.log(req.query.secretId);

  await generateToken(req.query.secretId as string);

  console.log('========== EXECUTING CRON JOB UPDATE ACCESS TOKEN (HOSTAWAY) :: SUCCESS ========');
  res.json({ status: 'success' });
  res.end();
}
