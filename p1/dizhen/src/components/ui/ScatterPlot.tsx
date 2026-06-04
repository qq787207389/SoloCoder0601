import { useRef, useEffect, useState, useCallback } from 'react';
import { useEarthquakeStore } from '../../store/useEarthquakeStore';
import { computeRegionLabel } from '../../data/earthquakeService';
import { ScatterSelection } from '../../types/earthquake';
import { cn } from '../../lib/utils';
import { BarChart2, ScatterChart, Maximize2 } from 'lucide-react';

const regionColors: Record<string, [number, number, number]> = {
  '环太平洋西带': [0, 200, 255],
  '环太平洋东带': [255, 100, 100],
  '喜马拉雅-地中海带': [255, 200, 0],
  '非洲-大西洋中脊': [100, 255, 150],
  '环太平洋西南带': [200, 100, 255],
  '其他区域': [150, 150, 150],
};

function ScatterPlot() {
  const { filteredEarthquakes, chartViewMode, setChartViewMode, scatterSelection, setScatterSelection, setSelectedEarthquake } = useEarthquakeStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const maxDepth = 700;
  const maxMag = 10;
  const padding = { top: 10, right: 10, bottom: 30, left: 50 };

  const dataToCanvas = useCallback(
    (depth: number, mag: number, width: number, height: number) => {
      const x = padding.left + (depth / maxDepth) * (width - padding.left - padding.right);
      const y = height - padding.bottom - ((mag - 0) / maxMag) * (height - padding.top - padding.bottom);
      return { x, y };
    },
    []
  );

  const canvasToData = useCallback(
    (x: number, y: number, width: number, height: number) => {
      const depth = ((x - padding.left) / (width - padding.left - padding.right)) * maxDepth;
      const mag = maxMag - ((y - padding.top) / (height - padding.top - padding.bottom)) * maxMag;
      return { depth: Math.max(0, Math.min(maxDepth, depth)), mag: Math.max(0, Math.min(maxMag, mag)) };
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.fillStyle = 'rgba(10, 14, 26, 0.8)';
    ctx.fillRect(0, 0, width, height);

    if (chartViewMode === 'scatter') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;

      for (let d = 0; d <= maxDepth; d += 100) {
        const { x } = dataToCanvas(d, 0, width, height);
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, height - padding.bottom);
        ctx.stroke();
      }

      for (let m = 0; m <= maxMag; m += 2) {
        const { y } = dataToCanvas(0, m, width, height);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';

      for (let d = 0; d <= maxDepth; d += 200) {
        const { x } = dataToCanvas(d, 0, width, height);
        ctx.fillText(`${d}`, x, height - 8);
      }

      ctx.textAlign = 'right';
      for (let m = 0; m <= maxMag; m += 2) {
        const { y } = dataToCanvas(0, m, width, height);
        ctx.fillText(`M${m}`, padding.left - 5, y + 4);
      }

      ctx.save();
      ctx.translate(12, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText('震级', 0, 0);
      ctx.restore();

      ctx.textAlign = 'center';
      ctx.fillText('深度 (km)', width / 2, height - 2);

      filteredEarthquakes.forEach((eq) => {
        const region = computeRegionLabel(eq.latitude, eq.longitude);
        const color = regionColors[region] || regionColors['其他区域'];
        const { x, y } = dataToCanvas(eq.depth, eq.magnitude, width, height);
        const radius = Math.max(1.5, eq.magnitude * 0.8);

        ctx.beginPath();
        ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.2)`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        ctx.fill();
      });

      if (scatterSelection && selectionStart && selectionEnd) {
        const minX = Math.min(selectionStart.x, selectionEnd.x);
        const maxX = Math.max(selectionStart.x, selectionEnd.x);
        const minY = Math.min(selectionStart.y, selectionEnd.y);
        const maxY = Math.max(selectionStart.y, selectionEnd.y);

        ctx.fillStyle = 'rgba(0, 212, 170, 0.15)';
        ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
        ctx.strokeStyle = 'rgba(0, 212, 170, 0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
      }
    } else {
      const bins: number[] = new Array(20).fill(0);
      const binWidth = maxMag / 20;

      filteredEarthquakes.forEach((eq) => {
        const binIdx = Math.min(19, Math.floor(eq.magnitude / binWidth));
        bins[binIdx]++;
      });

      const maxCount = Math.max(...bins, 1);
      const barWidth = (width - padding.left - padding.right) / 20 - 2;

      bins.forEach((count, i) => {
        const x = padding.left + i * (barWidth + 2);
        const barHeight = (count / maxCount) * (height - padding.top - padding.bottom);
        const y = height - padding.bottom - barHeight;

        const mag = (i + 0.5) * binWidth;
        const hue = Math.max(0, 120 - mag * 20);
        ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
        ctx.fillRect(x, y, barWidth, barHeight);
      });

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';

      for (let m = 0; m <= maxMag; m += 2) {
        const x = padding.left + (m / maxMag) * (width - padding.left - padding.right);
        ctx.fillText(`M${m}`, x, height - 8);
      }

      ctx.save();
      ctx.translate(12, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText('数量', 0, 0);
      ctx.restore();
    }
  }, [filteredEarthquakes, chartViewMode, scatterSelection, selectionStart, selectionEnd, dataToCanvas]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (chartViewMode !== 'scatter') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setIsSelecting(true);
    setSelectionStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setSelectionEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSelectionEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isSelecting || !selectionStart || !selectionEnd) {
      setIsSelecting(false);
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      setIsSelecting(false);
      return;
    }

    const startData = canvasToData(selectionStart.x, selectionStart.y, rect.width, rect.height);
    const endData = canvasToData(selectionEnd.x, selectionEnd.y, rect.width, rect.height);

    const selection: ScatterSelection = {
      minDepth: Math.min(startData.depth, endData.depth),
      maxDepth: Math.max(startData.depth, endData.depth),
      minMag: Math.min(startData.mag, endData.mag),
      maxMag: Math.max(startData.mag, endData.mag),
    };

    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);

    if (width > 10 && height > 10) {
      setScatterSelection(selection);
    } else {
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const eq = filteredEarthquakes.find((earthquake) => {
        const { x, y } = dataToCanvas(earthquake.depth, earthquake.magnitude, rect.width, rect.height);
        return Math.abs(clickX - x) < 8 && Math.abs(clickY - y) < 8;
      });
      if (eq) {
        setSelectedEarthquake(eq);
      }
    }

    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  return (
    <div
      className={cn(
        'fixed right-4 z-50 bg-black/70 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl transition-all duration-300',
        isExpanded ? 'top-24 w-80 h-80' : 'top-24 w-64 h-52'
      )}
    >
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <span className="text-white/80 text-sm font-medium">震级-深度分析</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setChartViewMode('scatter')}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              chartViewMode === 'scatter'
                ? 'bg-cyan-500/30 text-cyan-300'
                : 'text-white/50 hover:bg-white/10'
            )}
          >
            <ScatterChart className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setChartViewMode('histogram')}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              chartViewMode === 'histogram'
                ? 'bg-cyan-500/30 text-cyan-300'
                : 'text-white/50 hover:bg-white/10'
            )}
          >
            <BarChart2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-white/50 hover:bg-white/10 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative p-3" style={{ height: 'calc(100% - 48px)' }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />

        {scatterSelection && (
          <button
            onClick={() => setScatterSelection(null)}
            className="absolute top-4 left-4 px-2 py-1 bg-cyan-500/30 text-cyan-300 text-xs rounded-lg"
          >
            已选择区域 ✓
          </button>
        )}
      </div>
    </div>
  );
}

export default ScatterPlot;
