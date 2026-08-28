// =============================================
// Configuración de comisiones
// Centro único para la política de cobros de R-Drop.
// Ataca el pain point #1 de GoTrendier: comisiones
// ocultas y poco claras. Aquí se definen los % base
// que se muestran SIEMPRE de forma transparente.
// =============================================

export const CONFIG_COMISIONES = {
  // Comisión base para vendedores estándar (en %)
  PORCENTAJE_ESTANDAR: 8,
  // Vendedores "pro" pagamos una comisión menor (incentivo de fiabilidad)
  PORCENTAJE_PRO: 5,
  // Tarifa fija base por operación (COP)
  TARIFA_FIJA: 300,
};

/**
 * Calcula el desglose de comisión de forma transparente.
 *
 * @returns desglose completo con todos los montos, para
 * que el vendedor/comprador nunca tenga sorpresas.
 */
export function calcularComision(monto: number, nivelVendedor: 'estandar' | 'pro' | string): {
  monto_total: number;
  monto_vendedor: number;
  comision_porcentaje: number;
  comision_monto: number;
} {
  const porcentaje = nivelVendedor === 'pro'
    ? CONFIG_COMISIONES.PORCENTAJE_PRO
    : CONFIG_COMISIONES.PORCENTAJE_ESTANDAR;

  const comisionMonto = (monto * porcentaje) / 100 + CONFIG_COMISIONES.TARIFA_FIJA;

  return {
    monto_total: monto,
    monto_vendedor: Number((monto - comisionMonto).toFixed(2)),
    comision_porcentaje: porcentaje,
    comision_monto: Number(comisionMonto.toFixed(2)),
  };
}
