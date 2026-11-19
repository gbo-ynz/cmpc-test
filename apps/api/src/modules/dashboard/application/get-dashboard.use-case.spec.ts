import { FakeDashboardRepository } from '../../../test-utils/fake-dashboard.repository';
import { GetDashboardUseCase } from './get-dashboard.use-case';

let repository: FakeDashboardRepository;
let useCase: GetDashboardUseCase;

beforeEach(() => {
  repository = new FakeDashboardRepository();
  useCase = new GetDashboardUseCase(repository);
});

describe('GetDashboardUseCase', () => {
  it('gives a regular user the operation only and never queries the administration data', async () => {
    const dashboard = await useCase.execute('USER');

    expect(dashboard).toEqual({
      books: { active: 5, available: 3, unavailable: 2 },
      booksByGenre: [{ genre: 'Novela', books: 4 }],
      sales: { pending: 2, completed: 7, completedAmount: 123500 },
    });
    expect(dashboard).not.toHaveProperty('administration');
    expect(repository.calls.sort()).toEqual(['bookStats', 'booksByGenre', 'salesStats']);
  });

  it('gives an administrator the same figures plus the administration section', async () => {
    const dashboard = await useCase.execute('ADMIN');

    expect(dashboard.books.active).toBe(5);
    expect(dashboard.administration).toEqual({
      inventoryValue: 987650,
      catalog: { authors: 8, publishers: 6, genres: 4, users: 3 },
      recentActivity: [expect.objectContaining({ action: 'CREATE', label: 'Rayuela' })],
    });
  });

  it('asks for exactly the last 10 audit operations', async () => {
    await useCase.execute('ADMIN');

    expect(repository.calls).toContain('recentActivity:10');
  });
});
