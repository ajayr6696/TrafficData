import Dashboard from './components/dashboard/Dashboard';
import { TrafficFiltersProvider } from './context/TrafficFiltersContext';

function App() {
  return (
    <TrafficFiltersProvider>
      <Dashboard />
    </TrafficFiltersProvider>
  );
}

export default App;
