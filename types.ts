/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RawServiceData {
  sku: string;
  nombre_servicio: string;
  costo_unitario: number;
  precio_venta: number;
  unidades_vendidas: number;
}

export interface ComputedServiceData extends RawServiceData {
  ingreso_total: number;
  costo_total: number;
  utilidad_total: number;
  margen_porcentaje: number; // (utilidad / ingreso) * 100
  porcentaje_ingresos: number; // (ingreso_total / total_ingresos) * 100
  porcentaje_acumulado: number; // cumulative running percentage
  categoria: 'A' | 'B' | 'C';
}

export interface ABCAnalysisSummary {
  totalIngresos: number;
  totalCostos: number;
  totalUtilidad: number;
  totalUnidades: number;
  serviciosCount: number;
  countA: number;
  countB: number;
  countC: number;
  ingresosA: number;
  ingresosB: number;
  ingresosC: number;
}

export interface CSVParseResult {
  data: RawServiceData[];
  errors: string[];
  warnings: string[];
}
