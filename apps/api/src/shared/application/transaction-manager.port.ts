/**
 * Unit-of-work port. Every repository call made inside `run` joins the same
 * database transaction, without the use case knowing which ORM is behind it.
 */
export abstract class TransactionManager {
  abstract run<T>(work: () => Promise<T>): Promise<T>;
}
