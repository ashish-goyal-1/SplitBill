// theme
import ThemeProvider from './theme';
import Router from './routes'
import { SocketProvider } from './utils/SocketContext';
import { AuthProvider } from './contexts/AuthContext';


function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ThemeProvider>
          <Router />
        </ThemeProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
