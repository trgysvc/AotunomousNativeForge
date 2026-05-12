# Yerel monorepo içinde paketi eklemek
npm install @aurapos/branch-server
# veya Yarn
yarn add @aurapos/branch-server


// src/index.ts
import { createServer } from 'http';
import { PORT } from './config';

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('AuroraPOS Branch Server is running\n');
});

server.listen(PORT, () => {
  console.log(`Branch server listening on http://localhost:${PORT}`);
});


// src/config.ts
export const PORT = process.env.BRANCH_PORT ?? 3000;


npm run build   # dist/ klasörü oluşturulur
npm run start   # Sunucu http://localhost:3000 üzerinde dinler


  npm run test
  

  npm run lint