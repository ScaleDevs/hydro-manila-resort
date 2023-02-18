export const base64Encoding = (str: string) => {
  const bufferObj = Buffer.from(str, 'utf8');
  const result = bufferObj.toString('base64');
  return result;
};
