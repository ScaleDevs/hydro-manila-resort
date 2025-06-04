import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { constants } from '../constants';

const s3 = new S3Client({
  region: 'ap-southeast-1', // update based on your bucket
  credentials: {
    accessKeyId: constants.AccessKeyId!,
    secretAccessKey: constants.SecretAccessKey!,
  },
});

class Service {
  public async generateUploadSignedUrl(key: string, contentType: string, expiresInSeconds: number) {
    const command = new PutObjectCommand({
      Bucket: constants.bucket,
      Key: key,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(s3, command, {
      expiresIn: expiresInSeconds,
    });

    return signedUrl;
  }

  public async generateDownloadSignedUrl(key: string, expiresInSeconds: number) {
    const command = new GetObjectCommand({
      Bucket: constants.bucket,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3, command, {
      expiresIn: expiresInSeconds,
    });

    return signedUrl;
  }
}

export const S3Service = new Service();
