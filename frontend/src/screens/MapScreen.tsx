import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import type { Plaza, Liberation } from '../types';
import { BottomSheet, Badge, SegmentedControl } from '../components/ui';

type Floor = 'P-1' | 'P-2';

// ─── SVG layout constants ─────────────────────────────────────────────────
const W = 34, H = 26, GAP = 4, COL_GAP = 2;
const BAY_W   = W * 2 + COL_GAP;       // 70
const BAY_GAP = 76;
const LEFT_PAD = 59;
const BX_LEFT  = LEFT_PAD;
const BX_MID   = BX_LEFT  + BAY_W + BAY_GAP; // 205
const BX_RIGHT = BX_MID   + BAY_W + BAY_GAP; // 351
const TOTAL_W  = BX_RIGHT + BAY_W + LEFT_PAD; // 480

// Top row — portrait orientation (taller than wide)
const W_TOP = 23, H_TOP = 30;
const TOP_ROW_Y = 10;
const TOP_ROW_START_X = 12;

const TOP_PAD  = H_TOP + 22;           // 52 — aisle space before bays
const BAY_H    = 22 * (H + GAP) - GAP;
const TOTAL_H  = BAY_H + TOP_PAD + 50;

// ─── Stall ────────────────────────────────────────────────────────────────
interface StallProps {
  plaza: Plaza;
  x: number; y: number;
  w: number;  h: number;
  isLiberated: boolean;
  isReserved: boolean;
  isMyPlaza: boolean;
  onClick: () => void;
}

function Stall({ plaza, x, y, w, h, isLiberated, isReserved, isMyPlaza, onClick }: StallProps) {
  const isAptica = plaza.assignedUsers.length > 0 || plaza.isService;

  if (!isAptica) {
    return <rect x={x} y={y} width={w} height={h} rx={2} fill="#E8E6EA" />;
  }

  const fill = plaza.isService
    ? '#58457A'
    : isReserved  ? '#9D8FAA'
    : isLiberated ? '#F4EEF5'
    :               '#6A1873';

  const stroke   = isMyPlaza ? '#2E9E6A' : (isLiberated && !isReserved) ? '#6A1873' : 'none';
  const strokeW  = (isMyPlaza || (isLiberated && !isReserved)) ? 2 : 0;
  const lightFill = isLiberated && !isReserved;
  const textFill  = lightFill ? '#6A1873' : '#fff';
  const ownerName = plaza.assignedUsers[0]?.name ?? '';
  const shortName = ownerName.length > 11 ? ownerName.slice(0, 10) + '…' : ownerName;

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <rect x={x} y={y} width={w} height={h} rx={2} fill={fill} stroke={stroke} strokeWidth={strokeW} />
      {ownerName && !plaza.isService && (
        <text
          x={x + w / 2} y={y + h / 2 - 2}
          textAnchor="middle" dominantBaseline="middle"
          fill={textFill} fontSize={5} fontWeight={700}
          fontFamily="Plus Jakarta Sans, sans-serif"
        >
          {shortName}
        </text>
      )}
      {!plaza.isService && (
        <text
          x={x + w / 2} y={y + h - 5}
          textAnchor="middle"
          fill={textFill} fontSize={8} fontWeight={800}
          fontFamily="Plus Jakarta Sans, sans-serif"
        >
          {plaza.num}
        </text>
      )}
      {plaza.isMoto && (
        <circle cx={x + w - 4} cy={y + 4} r={2.5} fill="rgba(255,255,255,0.8)" stroke="#6A1873" strokeWidth={0.8} />
      )}
    </g>
  );
}

// ─── ParkingFloor ─────────────────────────────────────────────────────────
function ParkingFloor({
  plazas, liberatedIds, reservedIds, myPlazaId, onSelect, floor,
}: {
  plazas: Plaza[];
  liberatedIds: Set<string>;
  reservedIds: Set<string>;
  myPlazaId?: string;
  onSelect: (p: Plaza) => void;
  floor: Floor;
}) {
  // Returns [x, y, w, h] or null if the slot should not be rendered
  function getXY(p: Plaza): [number, number, number, number] | null {
    if (p.isRamp) return null;

    if (p.bay === 'top') {
      // num=17 → leftmost (pos=0), num=1 → rightmost (pos=16)
      const pos = 17 - p.num;
      return [TOP_ROW_START_X + pos * (W_TOP + GAP), TOP_ROW_Y, W_TOP, H_TOP];
    }

    const yPos = TOP_PAD + 6 + (p.row - 1) * (H + GAP);

    if (p.bay === 'left') {
      // outer = against left wall (smaller x), inner = facing center aisle
      const x = p.col === 'outer' ? BX_LEFT : BX_LEFT + W + COL_GAP;
      return [x, yPos, W, H];
    }
    if (p.bay === 'mid') {
      if (p.row >= 9 && p.row <= 13) return null; // island gap
      const adjY = p.row >= 14
        ? TOP_PAD + 6 + (p.row - 6) * (H + GAP)
        : yPos;
      const x = p.col === 'outer' ? BX_MID : BX_MID + W + COL_GAP;
      return [x, adjY, W, H];
    }
    if (p.bay === 'right') {
      // outer = facing center aisle (smaller x), inner = against right wall
      const x = p.col === 'outer' ? BX_RIGHT : BX_RIGHT + W + COL_GAP;
      return [x, yPos, W, H];
    }
    return null;
  }

  // Midpoint of bay height — used for P-1 entry/exit labels
  const bayMidY = TOP_PAD + 6 + 9 * (H + GAP);

  // Ramp spots in top row → rendered as crosswalk hatching
  const topRamps = plazas.filter(p => p.bay === 'top' && p.isRamp);

  return (
    <svg viewBox={`0 0 ${TOTAL_W} ${TOTAL_H}`} width="100%" style={{ maxHeight: '70vh' }}>
      <defs>
        <pattern id="crosswalk" x="0" y="0" width="5" height="5"
          patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="2.5" height="5" fill="#C0BCC6" />
        </pattern>
      </defs>

      {/* Background */}
      <rect width={TOTAL_W} height={TOTAL_H} fill="#F6F5F7" rx={8} />

      {/* Top row background strip */}
      <rect x={0} y={0} width={TOTAL_W} height={TOP_ROW_Y + H_TOP + 10} fill="#EDEAEF" />

      {/* Crosswalk hatching at ramp positions */}
      {topRamps.map(p => {
        const pos = 17 - p.num;
        const x   = TOP_ROW_START_X + pos * (W_TOP + GAP);
        return (
          <rect key={p.id} x={x} y={TOP_ROW_Y} width={W_TOP} height={H_TOP}
            fill="url(#crosswalk)" rx={1} />
        );
      })}

      {/* All stalls */}
      {plazas.map(p => {
        const pos = getXY(p);
        if (!pos) return null;
        const [x, y, w, h] = pos;
        const isAptica = p.assignedUsers.length > 0 || p.isService;
        return (
          <Stall
            key={p.id}
            plaza={p}
            x={x} y={y} w={w} h={h}
            isLiberated={liberatedIds.has(p.id)}
            isReserved={reservedIds.has(p.id)}
            isMyPlaza={p.id === myPlazaId}
            onClick={() => { if (isAptica) onSelect(p); }}
          />
        );
      })}

      {/* Entry / exit labels — P-2 (below top row) */}
      {floor === 'P-2' && (
        <>
          <text
            x={TOP_ROW_START_X} y={TOP_ROW_Y + H_TOP + 18}
            fill="#58457A" fontSize={7} fontWeight={700}
            fontFamily="Plus Jakarta Sans, sans-serif"
          >← SALIDA</text>
          <text
            x={TOTAL_W - TOP_ROW_START_X} y={TOP_ROW_Y + H_TOP + 18}
            textAnchor="end"
            fill="#58457A" fontSize={7} fontWeight={700}
            fontFamily="Plus Jakarta Sans, sans-serif"
          >ENTRADA →</text>
        </>
      )}

      {/* Entry / exit labels — P-1 (sides, rotated) */}
      {floor === 'P-1' && (
        <>
          <text
            x={9} y={bayMidY}
            textAnchor="middle"
            fill="#58457A" fontSize={7} fontWeight={700}
            fontFamily="Plus Jakarta Sans, sans-serif"
            transform={`rotate(-90, 9, ${bayMidY})`}
          >SALIDA</text>
          <text
            x={TOTAL_W - 9} y={bayMidY}
            textAnchor="middle"
            fill="#58457A" fontSize={7} fontWeight={700}
            fontFamily="Plus Jakarta Sans, sans-serif"
            transform={`rotate(90, ${TOTAL_W - 9}, ${bayMidY})`}
          >ENTRADA</text>
        </>
      )}
    </svg>
  );
}

// ─── MapScreen ────────────────────────────────────────────────────────────
export function MapScreen() {
  const { user } = useAuth();
  const location = useLocation();
  const navState = location.state as { highlightPlazaId?: string; floor?: string } | null;
  const [floor, setFloor] = useState<Floor>((navState?.floor as Floor) ?? 'P-1');
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [libs, setLibs] = useState<Liberation[]>([]);
  const [selected, setSelected] = useState<Plaza | null>(null);
  const highlightPlazaId = navState?.highlightPlazaId ?? user?.assignedPlaza?.id;

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    api.get<Plaza[]>(`/plazas?floor=${floor}&date=${today}`).then(r => setPlazas(r.data));
    api.get<Liberation[]>(`/plazas/availability?date=${today}`).then(r => setLibs(r.data));
  }, [floor]);

  const liberatedIds  = new Set(libs.map(l => l.plazaId));
  const reservedIds   = new Set(libs.filter(l => l.reservation?.status === 'confirmed').map(l => l.plazaId));

  // Stats: only APTICA plazas (with assigned users, non-ramp)
  const apticaPlazas   = plazas.filter(p => p.assignedUsers.length > 0 && !p.isRamp);
  const freeCount      = apticaPlazas.filter(p => liberatedIds.has(p.id) && !reservedIds.has(p.id)).length;
  const liberatedCount = apticaPlazas.filter(p => liberatedIds.has(p.id)).length;
  const occupiedCount  = apticaPlazas.filter(p => reservedIds.has(p.id)).length;

  return (
    <div className="px-5 pt-4 pb-4">
      <div className="mb-4">
        <h1 className="text-[22px] font-extrabold text-ink tracking-[-0.6px]">Mapa del parking</h1>
        <p className="text-[13px] text-gray-mid font-medium mt-0.5">Toca una plaza para ver detalles</p>
      </div>

      <SegmentedControl
        options={[
          { value: 'P-1' as Floor, label: 'Planta P-1' },
          { value: 'P-2' as Floor, label: 'Planta P-2' },
        ]}
        value={floor}
        onChange={setFloor}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 my-4">
        {[
          { label: 'Libres',    v: freeCount,       color: 'text-ok' },
          { label: 'Liberadas', v: liberatedCount,  color: 'text-purple' },
          { label: 'Ocupadas',  v: occupiedCount,   color: 'text-gray-mid' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-3 border border-gray-line text-center">
            <p className={`text-[22px] font-extrabold leading-none tracking-[-1px] ${s.color}`}>{s.v}</p>
            <p className="text-[11px] text-gray-mid font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Map SVG */}
      <div className="bg-white rounded-xl border border-gray-line p-2 overflow-auto">
        <ParkingFloor
          plazas={plazas}
          liberatedIds={liberatedIds}
          reservedIds={reservedIds}
          myPlazaId={highlightPlazaId}
          onSelect={setSelected}
          floor={floor}
        />
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {[
          { color: 'bg-purple',                           label: 'Asignada' },
          { color: 'bg-purple-soft border border-purple', label: 'Liberada hoy' },
          { color: 'bg-[#E8E6EA]',                        label: 'Sin titular' },
          { color: 'bg-[#58457A]',                        label: 'Servicio' },
          { color: 'border-2 border-ok bg-white',         label: 'Tu plaza / reserva' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-3.5 h-3.5 rounded-[3px] ${l.color}`} />
            <span className="text-[11px] text-gray-mid font-medium">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Detail sheet */}
      <BottomSheet open={!!selected} onClose={() => setSelected(null)} title="Detalle plaza">
        {selected && (
          <div className="pt-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-2xl bg-purple-soft flex flex-col items-center justify-center">
                <p className="text-[10px] font-bold text-gray-mid">{selected.floor}</p>
                <p className="text-[36px] font-extrabold text-purple leading-none tracking-[-2px]">{selected.num}</p>
              </div>
              <div>
                <p className="text-[18px] font-bold text-ink">
                  {selected.isService
                    ? 'Carga y Descarga'
                    : selected.assignedUsers.map(u => u.name).join(' · ') || 'Sin titular'}
                </p>
                <p className="text-[13px] text-gray-mid font-medium">{selected.floor} · {selected.bay}</p>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {selected.isService  && <Badge color="gray">Servicio</Badge>}
                  {selected.isShared   && <Badge color="blue">Compartida</Badge>}
                  {selected.isMoto     && <Badge color="purple">Moto</Badge>}
                  {liberatedIds.has(selected.id) && <Badge color="ok">Liberada hoy</Badge>}
                  {reservedIds.has(selected.id)  && <Badge color="gray">Ocupada</Badge>}
                  {selected.id === user?.assignedPlaza?.id && <Badge color="ok">Tu plaza</Badge>}
                </div>
              </div>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
