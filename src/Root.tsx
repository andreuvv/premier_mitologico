import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

export default function Root() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  );
}
