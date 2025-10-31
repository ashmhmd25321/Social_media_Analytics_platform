import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate a random token for email verification or password reset
 */
export const generateToken = (): string => {
  return require('crypto').randomBytes(32).toString('hex');
};

