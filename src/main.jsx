import { createRoot } from 'react-dom/client';
import React, { Component } from 'react';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("React ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '40px', 
          color: '#ff4e4e', 
          background: '#0a0a0f', 
          minHeight: '100vh', 
          fontFamily: 'monospace',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '20px', borderBottom: '1px solid #ff4e4e33', pb: '10px' }}>SYSTEM FAILED TO INITIALIZE</h2>
          <div style={{ background: 'rgba(255,100,100,0.1)', padding: '20px', borderRadius: '8px', maxWidth: '600px' }}>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{this.state.error && this.state.error.toString()}</pre>
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: '30px', padding: '12px 24px', background: '#ff4e4e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            REBOOT SYSTEM
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
