/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { UploadCloud, FileSpreadsheet, AlertCircle, Download, Users, Pencil, Sparkles } from 'lucide-react';
import { parseCSV } from '../utils/csvParser';
import { RawServiceData } from '../types';

// Catálogo base de servicios de demostración (sin barbero asignado todavía)
const DEMO_SERVICES: Omit<RawServiceData, 'barbero'>[] = [
  { sku: 'BC001', nombre_servicio: 'Corte de Cabello Premium + Lavado', costo_unitario: 5, precio_venta: 25, unidades_vendidas: 420 },
  { sku: 'BC002', nombre_servicio: 'Combo BarberCut: Corte, Barba y Facial', costo_unitario: 10, precio_venta: 45, unidades_vendidas: 280 },
  { sku: 'BC003', nombre_servicio: 'Perfilado de Barba con Navaja y Toalla', costo_unitario: 3, precio_venta: 18, unidades_vendidas: 310 },
  { sku: 'BC004', nombre_servicio: 'Corte de Cabello Clásico Tradicional', costo_unitario: 4, precio_venta: 20, unidades_vendidas: 390 },
  { sku: 'BC005', nombre_servicio: 'Terapia Capilar Anticaída & Masaje', costo_unitario: 15, precio_venta: 60, unidades_vendidas: 95 },
  { sku: 'BC006', nombre_servicio: 'Coloración de Cabello / Camuflaje de Canas', costo_unitario: 8, precio_venta: 35, unidades_vendidas: 110 },
  { sku: 'BC007', nombre_servicio: 'Cera Moldeadora BarberCut Efecto Mate', costo_unitario: 4, precio_venta: 15, unidades_vendidas: 160 },
  { sku: 'BC008', nombre_servicio: 'Aceite Orgánico de Cuidado Esencial', costo_unitario: 6, precio_venta: 22, unidades_vendidas: 90 },
  { sku: 'BC009', nombre_servicio: 'Tratamiento Facial Purificante y Exfoliante', costo_unitario: 5, precio_venta: 28, unidades_vendidas: 105 },
  { sku: 'BC010', nombre_servicio: 'Corte Infantil Estilo Libre (Menores)', costo_unitario: 3, precio_venta: 15, unidades_vendidas: 120 },
  { sku: 'BC011', nombre_servicio: 'Delineado de Cejas Detallado', costo_unitario: 1.5, precio_venta: 10, unidades_vendidas: 140 },
  { sku: 'BC012', nombre_servicio: 'Shampoo Revitalizante de Mentol', costo_unitario: 5, precio_venta: 18, unidades_vendidas: 60 },
  { sku: 'BC013', nombre_servicio: 'Afeitado de Cabeza Completo con Toalla Caliente', costo_unitario: 4, precio_venta: 22, unidades_vendidas: 45 },
  { sku: 'BC014', nombre_servicio: 'Mascarilla Negra de Carbón Activo Purificante', costo_unitario: 2, precio_venta: 12, unidades_vendidas: 70 },
];

// Reparte un total de unidades al azar entre los barberos ingresados,
// asegurando que la suma final sea exactamente igual al total original.
function repartirUnidadesAlAzar(total: number, barberos: string[]): { barbero: string; unidades: number }[] {
  if (barberos.length === 0) return [];
  if (barberos.length === 1) return [{ barbero: barberos[0], unidades: total }];

  // Genera pesos aleatorios y los normaliza para repartir proporcionalmente el total
  const pesos = barberos.map(() => Math.random());
  const sumaPesos = pesos.reduce((a, b) => a + b, 0);

  const partes = pesos.map((p) => Math.floor((p / sumaPesos) * total));
  let restante = total - partes.reduce((a, b) => a + b, 0);

  // Distribuye las unidades restantes (por redondeo) al azar, una por una
  while (restante > 0) {
    const idx = Math.floor(Math.random() * partes.length);
    partes[idx] += 1;
    restante -= 1;
  }

  return barberos.map((barbero, i) => ({ barbero, unidades: partes[i] })).filter((r) => r.unidades > 0);
}

// Construye el dataset de demostración, repartiendo cada servicio al azar
// entre los barberos que el usuario ya ingresó en el paso anterior.
function generarDatosDemo(barberos: string[]): RawServiceData[] {
  const data: RawServiceData[] = [];
  DEMO_SERVICES.forEach((servicio) => {
    const reparto = repartirUnidadesAlAzar(servicio.unidades_vendidas, barberos);
    reparto.forEach(({ barbero, unidades }) => {
      data.push({
        sku: servicio.sku,
        nombre_servicio: servicio.nombre_servicio,
        costo_unitario: servicio.costo_unitario,
        precio_venta: servicio.precio_venta,
        barbero,
        unidades_vendidas: unidades,
      });
    });
  });
  return data;
}

interface DropzoneProps {
  barberos: string[];
  onDataLoaded: (data: RawServiceData[], warnings: string[]) => void;
  onEditBarberos: () => void;
}

export default function Dropzone({ barberos, onDataLoaded, onEditBarberos }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);

      if (!file.name.toLowerCase().endsWith('.csv')) {
        setError('Solo se aceptan archivos con formato .csv');
        return;
      }

      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const { data, errors, warnings } = parseCSV(content, barberos);

        if (errors.length > 0) {
          setError(errors[0]);
          setIsProcessing(false);
          return;
        }

        onDataLoaded(data, warnings);
        setIsProcessing(false);
      };
      reader.onerror = () => {
        setError('No se pudo leer el archivo. Intenta nuevamente.');
        setIsProcessing(false);
      };
      reader.readAsText(file, 'utf-8');
    },
    [barberos, onDataLoaded]
  );

  const handleLoadDemoData = () => {
    setError(null);
    const demoData = generarDatosDemo(barberos);
    onDataLoaded(demoData, ['Datos de demostración cargados exitosamente.']);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  // Genera una plantilla CSV precargada con los nombres de barberos y datos de ejemplo reales
  // (en vez de filas con ceros) para que al abrirla se vea información útil.
  const handleDownloadTemplate = () => {
    const headers = ['sku', 'nombre_servicio', 'costo_unitario', 'precio_venta', 'barbero', 'unidades_vendidas'];

    const escapeField = (value: string) => {
      if (/[",\n]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const datosEjemplo = generarDatosDemo(barberos);

    const rows: string[] = [headers.join(',')];
    datosEjemplo.forEach((item) => {
      rows.push([
        escapeField(item.sku),
        escapeField(item.nombre_servicio),
        String(item.costo_unitario),
        String(item.precio_venta),
        escapeField(item.barbero),
        String(item.unidades_vendidas),
      ].join(','));
    });

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'BarberCut_Plantilla_Ventas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto space-y-5"
    >
      {/* Barra de barberos confirmados */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-900 bg-slate-950/60 px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex items-center justify-center h-7 w-7 rounded-md bg-amber-400/10 text-amber-400 flex-shrink-0">
            <Users className="h-3.5 w-3.5" />
          </span>
          <p className="text-xs text-slate-400 truncate">
            <span className="text-slate-200 font-semibold">{barberos.length} barbero{barberos.length !== 1 ? 's' : ''}</span>
            {' · '}
            {barberos.join(', ')}
          </p>
        </div>
        <button
          onClick={onEditBarberos}
          className="flex items-center gap-1.5 text-xxs font-semibold text-slate-500 hover:text-amber-400 transition-colors flex-shrink-0"
        >
          <Pencil className="h-3 w-3" />
          Editar
        </button>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white tracking-tight">Carga tu archivo de ventas</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          Sube un CSV con columnas <code className="text-amber-400/90 font-mono text-xs">sku, nombre_servicio, costo_unitario, precio_venta, barbero, unidades_vendidas</code>
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all p-10 sm:p-14 text-center ${
          isDragging
            ? 'border-amber-400 bg-amber-400/5'
            : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <span className={`flex items-center justify-center h-14 w-14 rounded-2xl transition-colors ${
            isDragging ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-500'
          }`}>
            {isProcessing ? (
              <FileSpreadsheet className="h-6 w-6 animate-pulse" />
            ) : (
              <UploadCloud className="h-6 w-6" />
            )}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              {isProcessing ? 'Procesando archivo...' : 'Arrastra tu CSV aquí'}
            </p>
            <p className="text-xs text-slate-500 mt-1">o haz clic para seleccionar un archivo</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/15 bg-rose-500/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
        </div>
      )}

      <button
        onClick={handleLoadDemoData}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-amber-400/20 bg-amber-400/5 text-xs font-semibold text-amber-400 hover:bg-amber-400/10 transition-colors"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Cargar Datos de Demostración
      </button>

      <button
        onClick={handleDownloadTemplate}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-900 text-xs font-semibold text-slate-400 hover:text-amber-400 hover:border-amber-400/20 transition-colors"
      >
        <Download className="h-3.5 w-3.5" />
        Descargar plantilla CSV con tus barberos precargados
      </button>
    </motion.div>
  );
}