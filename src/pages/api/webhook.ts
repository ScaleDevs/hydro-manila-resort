import { PayMongoWebHookResponse } from '@/utils/types';

export default function handler(req: any, res: any) {
  console.log('==========INVOKED========');
  console.log(req.body.data.attributes.data);
  const response = req.body as PayMongoWebHookResponse;
  res.status(200).json(response);
}
