export abstract class PasswordHasher {
  abstract hash(plain: string): Promise<string>;

  /**
   * Must take the same time whether or not `hash` exists, so the login
   * endpoint does not leak which emails are registered (timing attack).
   */
  abstract verify(plain: string, hash: string | undefined): Promise<boolean>;
}
