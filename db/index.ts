import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// LLM·DB 접근은 전부 서버에서만. 이 모듈을 클라이언트 컴포넌트에서 import하지 말 것.
export const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
