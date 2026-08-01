import { setupServer } from 'msw/node';

// Individual tests register their own handlers via server.use(...); this starts with none.
export const server = setupServer();
