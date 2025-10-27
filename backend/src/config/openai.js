import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Only check for API key during runtime, not during build
if (process.env.NODE_ENV === 'production' && !process.env.OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY is not set in environment variables');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
});

export default openai;
