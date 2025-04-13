# Voice FRE (First Run Experience)

A voice-enabled health dashboard application built with Next.js and ElevenLabs.

## Features

- Voice interaction with AI assistant
- Health metrics visualization
- Medication adherence tracking
- Vital signs monitoring

## Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_ELEVENLABS_API_KEY=your_api_key
   NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id
   ```
4. Run the development server:
   ```
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment to Vercel

### Prerequisites

- A Vercel account
- ElevenLabs API key and Agent ID

### Deployment Steps

1. Push your code to a GitHub repository
2. Import the repository in Vercel
3. Add the following environment variables in Vercel:
   - `NEXT_PUBLIC_ELEVENLABS_API_KEY`
   - `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`
4. Deploy the project

### Environment Variables

The following environment variables are required:

- `NEXT_PUBLIC_ELEVENLABS_API_KEY`: Your ElevenLabs API key
- `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`: Your ElevenLabs Agent ID

## Technologies Used

- Next.js
- React
- ElevenLabs API
- Recharts
- Tailwind CSS
- TypeScript

## License

MIT
