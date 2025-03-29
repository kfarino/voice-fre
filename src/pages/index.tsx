import type { NextPage } from 'next';
import WebSocketTest from '../components/WebSocketTest';

const Home: NextPage = () => {
  return (
    <main className="min-h-screen p-4">
      <WebSocketTest />
    </main>
  );
};

export default Home;
