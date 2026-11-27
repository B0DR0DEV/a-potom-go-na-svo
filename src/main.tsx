import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { error: string | null }
> {
  state = { error: null as string | null };

  static getDerivedStateFromError(error: Error) {
    return { error: error?.message || 'Неизвестная ошибка приложения' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application failed to render:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{
          minHeight: '100%', padding: 24, display: 'grid', placeContent: 'center',
          gap: 12, background: '#111714', color: '#f2f1e9',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h1 style={{ fontSize: 22 }}>Не удалось запустить игру</h1>
          <p style={{ color: '#c4c9bc', overflowWrap: 'anywhere' }}>{this.state.error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '12px 18px', border: 0, background: '#c2cda8', color: '#182019' }}
          >
            Перезагрузить страницу
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <AppErrorBoundary><App /></AppErrorBoundary>
    </React.StrictMode>
  );
} else {
  document.body.textContent = 'Ошибка запуска: на странице отсутствует корневой элемент #root.';
}
