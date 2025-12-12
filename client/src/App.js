// theme
import ThemeProvider from './theme';
import Router from './routes'
import { SocketProvider } from './utils/SocketContext';


function App() {
  return (
    <SocketProvider>
      <ThemeProvider>
        <Router />
      </ThemeProvider>
    </SocketProvider>
  );
}

export default App;
