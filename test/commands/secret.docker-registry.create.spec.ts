import { clearGlobalMocks } from '../helpers';

describe('commands / secret / docker-registry / create', () => {
  beforeAll(() => {
    process.exit = jest.fn() as any;
  });

  afterEach(() => {
    clearGlobalMocks();
  });

  it.skip('should ', async () => {});
});
