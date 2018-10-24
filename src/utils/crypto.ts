import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto';
import { outputFile, readFile } from 'fs-extra';

const { machineId } = require('node-machine-id');

const algorithm = 'aes-256-cbc';
const hash = 'sha256';
const ivLength = 16;

export class Crypto {
  private constructor() {}

  public static async save<T>(filepath: string, object: T): Promise<void> {
    const iv = randomBytes(ivLength);
    const cipher = createCipheriv(algorithm, await Crypto.getKey(), iv);
    const content = JSON.stringify(object);

    const encrypted = cipher.update(content);
    const buffer = `${iv.toString('hex')}:${Buffer.concat([
      encrypted,
      cipher.final(),
    ]).toString('hex')}`;

    await outputFile(filepath, buffer, { encoding: 'utf8' });
  }

  public static async load<T>(filepath: string): Promise<T> {
    const content = (await readFile(filepath, { encoding: 'utf8' })).split(':');
    const iv = Buffer.from(content.shift()!, 'hex');
    const encrypted = Buffer.from(content.join(':'), 'hex');

    const cipher = createDecipheriv(algorithm, await Crypto.getKey(), iv);

    let decrypted = cipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, cipher.final()]);

    return JSON.parse(decrypted.toString());
  }

  private static async getKey(): Promise<Buffer> {
    const machineKey = await machineId();
    return createHmac(hash, machineKey)
      .update(machineKey)
      .digest();
  }
}
