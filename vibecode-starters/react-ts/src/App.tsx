import ReactDOM from 'react-dom/client';
import './index.css';

function App() {
  return (
    <div className='App'>
      <header className='App-header'>
        <h1>Welcome to React with TypeScript!</h1>
        <p>Start coding your amazing React application.</p>
      </header>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);
