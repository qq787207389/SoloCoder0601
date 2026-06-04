import { useRef, useEffect, useState, useCallback } from 'react';
import { useEarthquakeStore } from '../../store/useEarthquakeStore';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '../../lib/utils';

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

function Timeline() {
  const { earthquakes, timeWindow, setTimeWindow, filteredEarthquakes } = useEarthquakeStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState<'left' | 'right' | null>(null);
  const [draggingWindow, setDraggingWindow] = useState(false);
  const dragStartX = useRef(0);
  const dragStartWindow = useRef({ start: 0, end: 0 });

  const now = Date.now();
  const minTime = now - THIRTY_DAYS;
  const maxTime = now;

  const timeToX = useCallback(
    (time: number, width: number) => {
      return ((time - minTime) / (maxTime - minTime)) * width;
    },
    [minTime, maxTime]
  );

  const xToTime = useCallback(
    (x: number, width: number) => {
      return minTime + (x / width) * (maxTime - minTime);
    },
    [minTime, maxTime]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || earthquakes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.fillRect(0, 0, width, height);

    const barWidth = Math.max(0.5, width / (earthquakes.length / 10));

    earthquakes.forEach((eq) => {
      const x = timeToX(eq.time, width);
      const barHeight = Math.min(eq.magnitude * 4, height - 4);
      const y = height - barHeight - 2;

      const depthRatio = Math.min(eq.depth / 700, 1);
      const r = Math.floor(34 + depthRatio * 221);
      const g = Math.floor(255 - depthRatio * 155);
      const b = Math.floor(102 - depthRatio * 102);

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
      ctx.fillRect(x, y, barWidth, barHeight);
    });

    const selectionStart = timeToX(timeWindow.start, width);
    const selectionEnd = timeToX(timeWindow.end, width);

    ctx.fillStyle = 'rgba(0, 212, 170, 0.1)';
    ctx.fillRect(selectionStart, 0, selectionEnd - selectionStart, height);

    ctx.strokeStyle = 'rgba(0, 212, 170, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(selectionStart, 0, selectionEnd - selectionStart, height);

    ctx.fillStyle = '#00d4aa';
    ctx.fillRect(selectionStart - 3, 0, 3, height);
    ctx.fillRect(selectionEnd, 0, 3, height);
  }, [earthquakes, timeWindow.start, timeWindow.end, timeToX]);

  useEffect(() => {
    if (!timeWindow.isPlaying) return;

    const interval = setInterval(() => {
      const windowDuration = timeWindow.end - timeWindow.start;
      let newStart = timeWindow.start + 6 * 60 * 60 * 1000 * timeWindow.playSpeed;
      let newEnd = timeWindow.end + 6 * 60 * 60 * 1000 * timeWindow.playSpeed;

      if (newEnd > maxTime) {
        newStart = minTime;
        newEnd = minTime + windowDuration;
      }

      setTimeWindow({ start: newStart, end: newEnd });
    }, 100);

    return () => clearInterval(interval);
  }, [timeWindow.isPlaying, timeWindow.start, timeWindow.end, timeWindow.playSpeed, minTime, maxTime, setTimeWindow]);

  const handleMouseDown = (e: React.MouseEvent, handle: 'left' | 'right' | 'window') => {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartWindow.current = { start: timeWindow.start, end: timeWindow.end };

    if (handle === 'window') {
      setDraggingWindow(true);
    } else {
      setIsDragging(handle);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    if (!isDragging && !draggingWindow) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dx = e.clientX - dragStartX.current;
    const timeDelta = (dx / rect.width) * (maxTime - minTime);

    if (draggingWindow) {
      const windowDuration = dragStartWindow.current.end - dragStartWindow.current.start;
      let newStart = dragStartWindow.current.start + timeDelta;
      let newEnd = dragStartWindow.current.end + timeDelta;

      if (newStart < minTime) {
        newStart = minTime;
        newEnd = minTime + windowDuration;
      }
      if (newEnd > maxTime) {
        newEnd = maxTime;
        newStart = maxTime - windowDuration;
      }

      setTimeWindow({ start: newStart, end: newEnd });
    } else if (isDragging === 'left') {
      const newStart = Math.max(minTime, Math.min(timeWindow.end - 24 * 60 * 60 * 1000, dragStartWindow.current.start + timeDelta));
      setTimeWindow({ start: newStart });
    } else if (isDragging === 'right') {
      const newEnd = Math.min(maxTime, Math.max(timeWindow.start + 24 * 60 * 60 * 1000, dragStartWindow.current.end + timeDelta));
      setTimeWindow({ end: newEnd });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
    setDraggingWindow(false);
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32rem)] min-w-[400px]"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="bg-black/60 backdrop-blur-md rounded-xl border border-white/10 p-4 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/60 text-sm">时间轴 - 过去30天地震活动</span>
          <span className="text-white/40 text-xs">
            显示 {filteredEarthquakes.length} 个事件
          </span>
        </div>

        <div className="relative h-20 rounded-lg overflow-hidden bg-black/40 cursor-grab active:cursor-grabbing">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />

          <div
            className="absolute top-0 bottom-0 cursor-ew-resize hover:bg-white/10"
            style={{
              left: `${timeToX(timeWindow.start, 1) * 100 - 1}%`,
              width: '8px',
              transform: 'translateX(-50%)',
            }}
            onMouseDown={(e) => handleMouseDown(e, 'left')}
          />

          <div
            className="absolute top-0 bottom-0 cursor-move"
            style={{
              left: `${timeToX(timeWindow.start, 1) * 100}%`,
              right: `${100 - timeToX(timeWindow.end, 1) * 100}%`,
            }}
            onMouseDown={(e) => handleMouseDown(e, 'window')}
          />

          <div
            className="absolute top-0 bottom-0 cursor-ew-resize hover:bg-white/10"
            style={{
              left: `${timeToX(timeWindow.end, 1) * 100 - 1}%`,
              width: '8px',
              transform: 'translateX(-50%)',
            }}
            onMouseDown={(e) => handleMouseDown(e, 'right')}
          />
        </div>

        <div className="flex justify-between mt-2 text-xs">
          <span className="text-white/40">
            {format(timeWindow.start, 'MM/dd HH:mm', { locale: zhCN })}
          </span>
          <span className="text-cyan-400 font-medium">
            {format(timeWindow.start, 'MM月dd日', { locale: zhCN })} -{' '}
            {format(timeWindow.end, 'MM月dd日', { locale: zhCN })}
          </span>
          <span className="text-white/40">
            {format(timeWindow.end, 'MM/dd HH:mm', { locale: zhCN })}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Timeline;
