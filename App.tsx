/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RawServiceData, ComputedServiceData, ABCAnalysisSummary } from './types';
import { performABCAnalysis } from './utils/csvParser';
import Header from './components/Header';
import Dropzone from './components/Dropzone';
import ParetoChart from './components/ParetoChart';
import AnalyticsSummary from './components/AnalyticsSummary';
import ServiceTable from './components/ServiceTable';
import ServiceDetailModal from './components/ServiceDetailModal';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlusCircle, 
  Trash2, 
  Sparkles, 
  FileDown, 
  HelpCircle, 
  AlertTriangle, 
  Check, 
  ChevronRight, 
  TrendingUp, 
  ArrowLeft 
} from 'lucide-react';

export default function App() {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [rawServices, setRawServices] = useState<RawServiceData[]>([]);
  const [computedServices, setComputedServices] = useState<ComputedServiceData[]>([]);
  const [summary, setSummary] = useState<ABCAnalysisSummary | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<ComputedServiceData | null>(null);
  const [showWarnings, setShowWarnings] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleDataLoaded = (data: RawServiceData[], parseWarnings: string[]) => {
    setRawServices(data);
    setWarnings(parseWarnings);
    
    // Perform Pareto ABC Math
    const { computed, summary: analysisSummary } = performABCAnalysis(data);
    setComputedServices(computed);
    setSummary(analysisSummary);
    setDataLoaded(true);
    setShowWarnings(parseWarnings.length > 0);
  };

  const handleReset = () => {
    setDataLoaded(false);
    setRawServices([]);
    setComputedServices([]);
    setSummary(null);
    setWarnings([]);
    setSelectedService(null);
    setShowWarnings(false);
  };

  // Export ABC enriched dataset as a clean CSV back to the user
  const handleExportCSV = () => {
    if (computedServices.length === 0) return;

    // Construct headers
    const csvHeaders = [
      'SKU',
      'Nombre Servicio',
      'Costo Unitario ($)',
      'Precio Venta ($)',
      'Unidades Vendidas',
      'Ingreso Total ($)',
      'Costo Total ($)',
      'Utilidad Neta ($)',
      'Margen (%)',
      'Porcentaje Ingresos (%)',
      'Porcentaje Acumulado (%)',
      'Clase ABC'
    ];

    // Map rows
    const csvRows = computedServices.map(item => [
      `"${item.sku.replace(/"/g, '""')}"`,
      `"${item.nombre_servicio.replace(/"/g, '""')}"`,
      item.costo_unitario.toFixed(2),
      item.precio_venta.toFixed(2),
      item.unidades_vendidas,
      item.ingreso_total.toFixed(2),
      item.costo_total.toFixed(2),
      item.utilidad_total.toFixed(2),
      item.margen_porcentaje.toFixed(2),
      item.porcentaje_ingresos.toFixed(2),
      item.porcentaje_acumulado.toFixed(2),
      item.categoria
    ]);

    // Build overall file content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BarberCut_ABC_Clasificado_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-900 border border-slate-950">
      {/* Decorative ambient background lights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Primary Navigation Hub */}
      <Header onReset={handleReset} hasData={dataLoaded} />

      {/* Main Container Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 z-10">
        
        <AnimatePresence mode="wait">
          {!dataLoaded ? (
            // Standard Welcome / Dropzone mode
            <motion.div
              key="dropzone-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="py-6 sm:py-10"
            >
              <Dropzone onDataLoaded={handleDataLoaded} />
              
              {/* Informative educational section underneath */}
              <div className="max-w-4xl mx-auto mt-16 border-t border-slate-900 pt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-400">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 font-sans">
                    <span className="text-amber-400">01.</span> ¿Qué es la clase A?
                  </h4>
                  <p className="leading-relaxed">
                    Representa aproximadamente el 20% de tus servicios de peinado o barbería más vendidos que generan el 80% de tus ingresos. Son tu motor comercial principal.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 font-sans">
                    <span className="text-sky-400">02.</span> ¿Qué es la clase B?
                  </h4>
                  <p className="leading-relaxed">
                    Servicios de rotación intermedia (aproximadamente 15% de ingresos). Tienen potencial de crecimiento mediante promociones cruzadas o combos dirigidos.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 font-sans">
                    <span>03.</span> ¿Qué es la clase C?
                  </h4>
                  <p className="leading-relaxed">
                    Representan el 5% de ingresos pero suelen saturar la bodega operativa. Requieren inventario ágil, simplificación o empaquetado para liberar capacidad de trabajo.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            // Full Analysis Dashboard Workspace
            <motion.div
              key="dashboard-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Back breadcrumb and export action top bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-900 pb-5">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors duration-150 py-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Volver a carga de archivo</span>
                </button>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Export enriched CSV back to tenant file catalog */}
                  <button
                    onClick={handleExportCSV}
                    id="btn-exportar-csv"
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      exportSuccess 
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-500/20' 
                        : 'bg-amber-400 text-slate-950 hover:bg-amber-300 font-bold border-amber-500/20 shadow-md shadow-amber-500/5 active:scale-[0.98]'
                    }`}
                  >
                    {exportSuccess ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>¡CSV Descargado!</span>
                      </>
                    ) : (
                      <>
                        <FileDown className="h-3.5 w-3.5" />
                        <span>Descargar Reporte ABC (.CSV)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Collapsible Parse Warnings / Actions panel if any */}
              {warnings.length > 0 && showWarnings && (
                <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 flex items-start gap-3">
                  <AlertTriangle className="h-4.5 w-4.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">Alertas de Procesamiento de Tablas</span>
                      <button 
                        onClick={() => setShowWarnings(false)} 
                        className="text-[10px] text-slate-500 hover:text-slate-350 underline"
                      >
                        Ocultar panel
                      </button>
                    </div>
                    <ul className="text-[11px] text-slate-400 list-disc list-inside mt-1.5 space-y-1">
                      {warnings.map((warn, i) => (
                        <li key={`warn-${i}`}>{warn}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Dynamic Stats summaries and classification index lists */}
              {summary && <AnalyticsSummary summary={summary} computedData={computedServices} />}

              {/* Dual Y-Axes interactive Pareto Plot */}
              <ParetoChart data={computedServices} totalRevenue={summary?.totalIngresos || 1} />

              {/* Interactive grid filters which reveals detailed drawer on click */}
              <div className="space-y-3" id="service-grid-section">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="h-4.5 w-4.5 text-amber-500" />
                    Listado de Prestaciones Evaluadas
                  </h3>
                  <span className="text-xxs font-mono text-slate-500 uppercase tracking-widest">
                    Haga Clic en una fila para abrir simulador de ventas
                  </span>
                </div>
                {summary && (
                  <ServiceTable 
                    data={computedServices} 
                    summary={summary} 
                    onSelectService={(serv) => setSelectedService(serv)} 
                  />
                )}
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Floating Modal Detail focus ledger */}
      <AnimatePresence>
        {selectedService && summary && (
          <ServiceDetailModal
            service={selectedService}
            totalRevenue={summary.totalIngresos}
            onClose={() => setSelectedService(null)}
          />
        )}
      </AnimatePresence>

      {/* Professional subtle footer design */}
      <footer className="mt-20 border-t border-slate-900 px-4 sm:px-6 py-6 bg-slate-950/40 text-center text-slate-500 text-xxs font-mono tracking-wider">
        <p className="max-w-4xl mx-auto">
          BarberCut ABC Pareto Analyzer · Diseñado para optimizar la toma de decisiones, control de insumos y estructura tarifaria con base en la Ley de Distribución de Pareto.
        </p>
      </footer>
    </div>
  );
}
