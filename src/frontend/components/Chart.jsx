import React, { useState } from 'react';
import { compactNumber, fullNumber, formatDate } from '../lib/index.js';


const DASHES = ['', '8 4', '2 4'];

const WIDTH = 640;
const MARGIN = { left: 48, right: 14, top: 12, bottom: 26 };


function niceMax(value) {
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return (Math.ceil((value / magnitude) * 2) / 2) * magnitude;
}






export default function Chart({ series, height = 210, area = false }) {
  const [hovered, setHovered] = useState(null);

  const drawable = series.filter(s => s.points?.length);
  if (!drawable.length) {
    return <p className="note">Daily download history is not available right now.</p>;
  }

  const days = [...new Set(drawable.flatMap(s => s.points.map(p => p.day)))].sort();
  const valuesByDay = drawable.map(s => new Map(s.points.map(p => [p.day, p.downloads])));
  const top = niceMax(Math.max(1, ...valuesByDay.flatMap(map => [...map.values()])));

  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = height - MARGIN.top - MARGIN.bottom;
  const x = index => MARGIN.left + (days.length < 2 ? 0 : (index / (days.length - 1)) * plotWidth);
  const y = value => MARGIN.top + (1 - value / top) * plotHeight;

  const linePath = map =>
    days
      .map((day, i) => {
        if (!map.has(day)) return '';
        const startsNewSegment = i === 0 || !map.has(days[i - 1]);
        return `${startsNewSegment ? 'M' : 'L'}${x(i).toFixed(1)},${y(map.get(day)).toFixed(1)}`;
      })
      .join('');

  function handlePointer(event) {
    const box = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * WIDTH;
    const index = Math.round(((px - MARGIN.left) / plotWidth) * (days.length - 1));
    setHovered(Math.max(0, Math.min(days.length - 1, index)));
  }

  const summary = drawable
    .map((s, i) => `${s.name}: ${compactNumber([...valuesByDay[i].values()].reduce((a, b) => a + b, 0))} downloads in total`)
    .join('; ');

  return (
    <figure className="chart">
      {drawable.length > 1 && (
        <figcaption className="legend">
          {drawable.map((s, i) => (
            <span key={s.name}>
              <svg width="28" height="8" aria-hidden="true">
                <line x1="0" y1="4" x2="28" y2="4" stroke={`var(--series-${i + 1})`} strokeWidth="3" strokeDasharray={DASHES[i]} />
              </svg>
              {s.name}
            </span>
          ))}
        </figcaption>
      )}

      <div className="chart-frame">
        <svg
          viewBox={`0 0 ${WIDTH} ${height}`}
          role="img"
          aria-label={`Daily downloads over the last ${days.length} days. ${summary}.`}
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerLeave={() => setHovered(null)}
        >
          {[0, 0.5, 1].map(fraction => (
            <g key={fraction}>
              <line className="gridline" x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y(top * fraction)} y2={y(top * fraction)} />
              <text className="axis-label" x={MARGIN.left - 8} y={y(top * fraction) + 4} textAnchor="end">
                {compactNumber(top * fraction)}
              </text>
            </g>
          ))}
          <text className="axis-label" x={MARGIN.left} y={height - 6}>{formatDate(days[0])}</text>
          <text className="axis-label" x={WIDTH - MARGIN.right} y={height - 6} textAnchor="end">{formatDate(days[days.length - 1])}</text>

          {area && drawable.length === 1 && (
            <path
              className="area"
              d={`${linePath(valuesByDay[0])}L${x(days.length - 1)},${y(0)}L${x(0)},${y(0)}Z`}
            />
          )}

          {drawable.map((s, i) => (
            <path
              key={s.name}
              d={linePath(valuesByDay[i])}
              fill="none"
              stroke={`var(--series-${i + 1})`}
              strokeWidth="2.5"
              strokeDasharray={DASHES[i]}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {hovered != null && (
            <g>
              <line className="cursor" x1={x(hovered)} x2={x(hovered)} y1={MARGIN.top} y2={height - MARGIN.bottom} />
              {drawable.map((s, i) =>
                valuesByDay[i].has(days[hovered]) && (
                  <circle key={s.name} cx={x(hovered)} cy={y(valuesByDay[i].get(days[hovered]))} r="4.5" fill={`var(--series-${i + 1})`} />
                )
              )}
            </g>
          )}
        </svg>

        {hovered != null && (
          <div className="tooltip" style={{ left: `${Math.min(76, Math.max(2, (x(hovered) / WIDTH) * 100 - 8))}%` }}>
            <b>{formatDate(days[hovered])}</b>
            {drawable.map((s, i) => (
              <div key={s.name}>
                <i style={{ background: `var(--series-${i + 1})` }} />
                {s.name}: {fullNumber(valuesByDay[i].get(days[hovered]) ?? null)}
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="note">Daily npm downloads for the last 30 days. Linear scale starting at zero.</p>
    </figure>
  );
}
