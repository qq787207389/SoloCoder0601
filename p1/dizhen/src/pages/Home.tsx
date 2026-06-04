import { useEffect } from 'react';
import { useEarthquakeStore } from '../store/useEarthquakeStore';
import Scene from '../components/Scene';
import StatusBar from '../components/ui/StatusBar';
import ControlPanel from '../components/ui/ControlPanel';
import InfoCard from '../components/ui/InfoCard';
import SelectedEarthquakeCard from '../components/ui/SelectedEarthquakeCard';
import Timeline from '../components/ui/Timeline';
import ScatterPlot from '../components/ui/ScatterPlot';

function Home() {
  const { loadFromDB, refreshData, newCount } = useEarthquakeStore();

  useEffect(() => {
    loadFromDB();
    refreshData();

    const interval = setInterval(() => {
      refreshData();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadFromDB, refreshData]);

  return (
    <div className="w-full h-screen overflow-hidden bg-[#050a14]">
      <div className="absolute inset-0">
        <Scene />
      </div>

      <StatusBar />
      <ControlPanel />
      <InfoCard />
      <SelectedEarthquakeCard />
      <ScatterPlot />
      <Timeline />

      <div className="fixed bottom-4 right-4 z-40 text-white/30 text-xs">
        <div>USGS 实时地震数据 · 每30秒更新</div>
      </div>
    </div>
  );
}

export default Home;
