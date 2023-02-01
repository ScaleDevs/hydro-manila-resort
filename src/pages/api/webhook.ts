export default function handler(req: any, res: any) {
  console.log('==========INVOKED========');
  console.log(req.body);
  res.status(200).json({ name: 'John Doe' });
}
