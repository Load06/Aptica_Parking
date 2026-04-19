import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import type { Plaza, Liberation } from '../types';
import { BottomSheet, Badge, SegmentedControl } from '../components/ui';
import { ymd } from '../lib/utils';

type Floor = 'P-1' | 'P-2';

// SVG layout constants (from design reference)
const W  = 34, H = 26, GAP = 4, BAY_GAP = 76, TOP_PAD = 88, LEFT_PAD = 28;
const COL_GAP = 2, BAY_W = W * 2 + COL_GAP;
const BX_LEFT  = LEFT_PAD;
const BX_MID   = BX_LEFT + BAY_W + BAY_GAP;
const BX_RIGHT = BX_MID  + BAY_W + BAY_GAP;
const TOTAL_W  = BX_RIGHT + BAY_W + LEFT_PAD;
const BAY_H    = 22 * (H + GAP) - GAP;
const TOTAL_H  = BAY_H + TOP_PAD + 50;

interface StallProps {
  plaza: Plaza;
  x: number;
  y: number;
  isLiberated: boolean;
  isReserved: boolean;
  isMyPlaza: boolean;
  onClick: () => void;
}

function Stall({ plaza, x, y, isLiberated, isReserved, isMyPlaza, onClick }: StallProps) {
  const isAssigned = !!plaza.owner || plaza.coOwners?.length;
  const fill = plaza.isService
    ? '#58457A'
    : isAssigned
      ? '#6A1873'
      : isReserved
        ? '#F4EEF5'
        : '#fff';
  const stroke = isMyPlaza ? '#2E9E6A' : isLiberated ? '#6A1873' : '#E8E6EA';
  const strokeW = isMyPlaza || isLiberated ? 2 : 1;
  const textColor = (isAssigned || plaza.isService) ? '#fff' : '#3A3340';
  const ownerName = plaza.owner?.name ?? plaza.coOwners?.[0]?.name ?? '';

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <rect x={x} y={y} width={W} height={H} rx={2} fill={fill} stroke={stroke} strokeWidth={strokeW} />
      {isAssigned && (
        <text x={x + W/2} y={y + H/2 - 2} textAnchor="middle" fill={textColor} fontSize={5.5} fontWeight={700} fontFamily="Plus Jakarta Sans, sans-serif">
          {ownerName.length > 13 ? ownerName.slice(0, 12) + '…' : ownerName}
        </text>
      )}
      <text x={x + W/2} y={y + H - 4} textAnchor="middle" fill={textColor} fontSize={8.5} fontWeight={700} fontFamily="Plus Jakarta Sans, sans-serif">
        {plaza.num}
      </text>
      {plaza.isMoto && (
        <circle cx={x + W - 5} cy={y + 5} r={3} fill="#fff" stroke="#6A1873" strokeWidth={0.8} />
      )}
    </g>
  );
}

function ParkingFloor({ plazas, liberatedIds, reservedIds, myPlazaId, onSelect }: {
  plazas: Plaza[];
  liberatedIds: Set<string>;
  reservedIds: Set<string>;
  myPlazaId?: string;
  onSelect: (p: Plaza) => void;
}) {
  function getXY(p: Plaza): [number, number] | null {
    const row = p.row;
    if (p.isRamp) return null;

    if (p.bay === 'top') {
      const idx = p.num - 1;
      return [LEFT_PAD + idx * (W + GAP), TOP_PAD - H - 18];
    }
    const yPos = TOP_PAD + 6 + (row - 1) * (H + GAP);

    if (p.bay === 'left') {
      const x = p.col === 'outer' ? BX_LEFT + W + COL_GAP : BX_LEFT;
      return [x, yPos];
    }
    if (p.bay === 'mid') {
      // Island gap rows 9-14
      if (row >= 9 && row <= 14) return null;
      const adjustedY = row >= 15 ? TOP_PAD + 6 + (row - 6) * (H + GAP) : yPos;
      const x = p.col === 'outer' ? BX_MID : BX_MID + W + COL_GAP;
      return [x, adjustedY];
    }
    if (p.bay === 'right') {
      const x = p.col === 'outer' ? BX_RIGHT + W + COL_GAP : BX_RIGHT;
      return [x, yPos];
    }
    return null;
  }

  return (
    <svg viewBox={`0 0 ${TOTAL_W} ${TOTAL_H}`} width="100%" style={{ maxHeight: '65vh' }}>
      {/* Background */}
      <rect width={TOTAL_W} height={TOTAL_H} fill="#F6F5F7" rx={8} />
      {/* Entrada label */}
      <text x={LEFT_PAD} y={22} fill="#6A1873" fontSize={8} fontWeight={700} fontFamily="Plus Jakarta Sans, sans-serif">ENTRADA/SALIDA</text>

      {plazas.map(p => {
        const pos = getXY(p);
        if (!pos) return null;
        return (
          <Stall
            key={p.id}
            plaza={p}
            x={pos[0]}
            y={pos[1]}
            isLiberated={liberatedIds.has(p.id)}
            isReserved={reservedIds.has(p.id)}
            isMyPlaza={p.id === myPlazaId}
            onClick={() => onSelect(p)}
          />
        );
      })}
    </svg>
  );
}

export function MapScreen() {
  const { user } = useAuth();
  const [floor, setFloor] = useState<Floor>('P-1');
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [libs, setLibs] = useState<Liberation[]>([]);
  const [selected, setSelected] = useState<Plaza | null>(null);

  const today = ymd(new Date());

  useEffect(() => {
    api.get<Plaza[]>(`/plazas?floor=${floor}&date=${today}`).then(r => setPlazas(r.data));
    api.get<Liberation[]>(`/plazas/availability?date=${today}`).then(r => setLibs(r.data));
  }, [floor]);

  const liberatedIds  = new Set(libs.map(l => l.plazaId));
  const reservedIds   = new Set(libs.filter(l => l.reservation?.status === 'confirmed').map(l => l.plazaId));
  const floorPlazas   = plazas.filter(p => !p.isRamp);
  const freeCount     = floorPlazas.filter(p => !p.owner && !reservedIds.has(p.id)).length;
  const liberatedCount = floorPlazas.filter(p => liberatedIds.has(p.id)).length;
  const occupiedCount  = floorPlazas.filter(p => reservedIds.has(p.id)).length;

  return (
    <div className="px-5 pt-4 pb-4">
      <div className="mb-4">
        <h1 className="text-[22px] font-extrabold text-ink tracking-[-0.6px]">Mapa del parking</h1>
        <p className="text-[13px] text-gray-mid font-medium mt-0.5">Toca una plaza para ver detalles</p>
      </div>

      <SegmentedControl
        options={[{ value: 'P-1' as Floor, label: 'Planta P-1' }, { value: 'P-2' as Floor, label: 'Planta P-2' }]}
        value={floor}
        onChange={setFloor}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 my-4">
        {[
          { label: 'Libres',     v: freeCount,      color: 'text-ok' },
          { label: 'Liberadas',  v: liberatedCount,  color: 'text-purple' },
          { label: 'Ocupadas',   v: occupiedCount,   color: 'text-gray-mid' },
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
          myPlazaId={user?.assignedPlaza?.id}
          onSelect={setSelected}
        />
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {[
          { color: 'bg-purple',       label: 'Plaza asignada' },
          { color: 'bg-purple-soft border border-purple', label: 'Liberada hoy' },
          { color: 'bg-white border border-gray-line',    label: 'Libre' },
          { color: 'bg-[#58457A]',    label: 'Servicio' },
          { color: 'border-2 border-ok bg-white',         label: 'Tu plaza' },
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
                  {selected.isService ? 'Carga y Descarga' : selected.owner?.name ?? 'Sin titular'}
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
            {selected.coOwners && selected.coOwners.length > 0 && (
              <p className="text-[13px] text-gray-mid font-medium">Compartida con: {selected.coOwners.map(c => c.name).join(', ')}</p>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
