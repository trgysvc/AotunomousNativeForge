import { sign as jwtSign, SignOptions } from 'jsonwebtoken';
import { promisify } from 'util';

const signAsync = promisify(jwtSign);

export async function signJwt(
  payload: object | string | Buffer,
  secretOrPrivateKey: string | Buffer,
  options: SignOptions = {}
): Promise<string> {
  return signAsync(payload, secretOrPrivateKey, options);
}