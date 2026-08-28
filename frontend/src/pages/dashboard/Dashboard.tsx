import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { misOfertasComoComprador, ofertasRecibidas, aceptarOferta, rechazarOferta } from "../../services/ofertas";
import { listarTransacciones, crearTransaccionDesdeOferta } from "../../services/transacciones";
import { crearSolicitudVendedor, tipoDocumento, type TipoDocumento } from "../../services/solicitudes";
import type { Oferta, Transaccion } from "../../types";
import "./Dashboard.css";

type Pestaña = "resumen" | "compras" | "ventas" | "transacciones";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [pestaña, setPestaña] = useState<Pestaña>("resumen");

  const [ofertasEnviadas, setOfertasEnviadas] = useState<Oferta[]>([]);
  const [ofertasRecibidasList, setOfertasRecibidasList] = useState<Oferta[]>([]);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // Solicitud de vendedor
  const [mostrarSolicitud, setMostrarSolicitud] = useState(false);
  const [tiposDoc, setTiposDoc] = useState<TipoDocumento[]>([]);
  const [formSolicitud, setFormSolicitud] = useState({
    tipo_documento_id: 0,
    numero_documento: "",
    ciudad: "",
    direccion: "",
    descripcion_tienda: "",
  });
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const [msgSolicitud, setMsgSolicitud] = useState<string | null>(null);

  const esVendedor = user?.rol === "vendedor" || user?.rol === "admin";

  const getInitial = () => {
    if (!user?.nombre_completo) return "U";
    return user.nombre_completo.charAt(0).toUpperCase();
  };

  const cargarDatos = async () => {
    const [enviadas, recibidas, trans] = await Promise.all([
      misOfertasComoComprador().catch(() => ({ success: false, data: [] })),
      ofertasRecibidas().catch(() => ({ success: false, data: [] })),
      listarTransacciones().catch(() => ({ success: false, data: [] })),
    ]);
    setOfertasEnviadas(enviadas.data ?? []);
    setOfertasRecibidasList(recibidas.data ?? []);
    setTransacciones(trans.data ?? []);
  };

  useEffect(() => {
    // Patrón estándar de data-fetching en montaje
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDatos().then(() => setCargando(false));
  }, []);

  const manejarAceptar = async (id: number) => {
    const res = await aceptarOferta(id);
    setMensaje(res.message ?? (res.success ? "Oferta aceptada" : res.error) ?? "");
    cargarDatos();
    setTimeout(() => setMensaje(null), 4000);
  };

  const manejarRechazar = async (id: number) => {
    const res = await rechazarOferta(id);
    setMensaje(res.message ?? (res.success ? "Oferta rechazada" : res.error) ?? "");
    cargarDatos();
    setTimeout(() => setMensaje(null), 4000);
  };

  const manejarComprar = async (id: number) => {
    const res = await crearTransaccionDesdeOferta(id);
    setMensaje(res.message ?? (res.success ? "Compra completada" : res.error) ?? "");
    cargarDatos();
    setTimeout(() => setMensaje(null), 4000);
  };

  const abrirSolicitud = async () => {
    setMsgSolicitud(null);
    if (tiposDoc.length === 0) {
      const res = await tipoDocumento().catch(() => ({ success: false, data: [] }));
      setTiposDoc((res.data ?? []) as TipoDocumento[]);
    }
    setMostrarSolicitud(true);
  };

  const manejarEnviarSolicitud = async () => {
    setMsgSolicitud(null);
    if (!formSolicitud.tipo_documento_id || !formSolicitud.numero_documento.trim()
      || !formSolicitud.ciudad.trim() || !formSolicitud.direccion.trim()) {
      setMsgSolicitud("Completa todos los campos obligatorios.");
      return;
    }
    setEnviandoSolicitud(true);
    const res = await crearSolicitudVendedor({
      tipo_documento_id: formSolicitud.tipo_documento_id,
      numero_documento: formSolicitud.numero_documento.trim(),
      ciudad: formSolicitud.ciudad.trim(),
      direccion: formSolicitud.direccion.trim(),
      descripcion_tienda: formSolicitud.descripcion_tienda.trim() || null,
    }).catch((e) => ({
      success: false,
      error: e?.response?.data?.error ?? "Error al enviar la solicitud",
    }) as never);
    setEnviandoSolicitud(false);
    setMsgSolicitud(res.error ?? res.message ?? "Solicitud enviada");
    if (res.success) {
      setTimeout(() => { setMostrarSolicitud(false); setMsgSolicitud(null); }, 2200);
    }
  };

  const formatearPrecio = (n: number) => `$${n.toLocaleString("es-CO")}`;

  const ofertasPendientes = ofertasRecibidasList.filter((o) => o.id_estado === 1);
  const ofertasActivas = ofertasEnviadas.filter((o) => o.id_estado === 1 || o.id_estado === 2);

  const sidebarLinks = [
    { key: "resumen", icon: "📊", label: "Resumen" },
    { key: "compras", icon: "🛒", label: "Mis ofertas" },
    ...(esVendedor ? [{ key: "ventas", icon: "🏷️", label: "Ofertas recibidas" }] : []),
    { key: "transacciones", icon: "💰", label: "Transacciones" },
  ];

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="user-info">
          <div className="avatar">{getInitial()}</div>
          <div>
            <div className="user-name">
              {user?.nombre_completo?.split(" ").slice(0, 2).join(" ") ?? "Usuario"}
            </div>
            <div className="user-email">{user?.email ?? ""}</div>
            <div className="user-rol">{user?.rol ?? "comprador"}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sidebarLinks.map((link) => (
            <button
              key={link.key}
              className={`sidebar-link ${pestaña === link.key ? "active" : ""}`}
              onClick={() => setPestaña(link.key as Pestaña)}
            >
              {link.icon} {link.label}
            </button>
          ))}
          {user?.rol === "admin" && (
            <button className="sidebar-link sidebar-link-admin">🛡️ Panel admin</button>
          )}
          <button className="sidebar-link sidebar-logout" onClick={logout}>
            🚪 Cerrar sesión
          </button>
        </nav>
      </aside>

      {/* Main */}
      <main className="dash-main">
        <div className="dash-header">
          <div>
            <h1>Hola, {user?.nombre_completo?.split(" ")[0] ?? "Usuario"}</h1>
            <p className="dash-subtitle">Bienvenido a tu panel de R-Drop</p>
          </div>
          <Link to="/products" className="new-order-btn">+ Explorar prendas</Link>
        </div>

        {mensaje && (
          <div style={{
            background: "#9B1C1C15", border: "1px solid #9B1C1C33", color: "#f0f0f0",
            padding: "0.75rem 1.25rem", borderRadius: "10px", marginBottom: "1.5rem",
            fontSize: "0.9rem"
          }}>
            {mensaje}
          </div>
        )}

        {cargando ? (
          <div style={{ color: "#555", padding: "3rem", textAlign: "center" }}>Cargando...</div>
        ) : pestaña === "resumen" ? (
          <>
            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Ofertas activas</div>
                <div className="stat-value">{ofertasActivas.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Transacciones</div>
                <div className="stat-value">{transacciones.length}</div>
              </div>
              {esVendedor ? (
                <div className="stat-card">
                  <div className="stat-label">Ofertas pendientes</div>
                  <div className="stat-value">{ofertasPendientes.length}</div>
                </div>
              ) : null}
              <div className="stat-card">
                <div className="stat-label">Fiabilidad</div>
                <div className="stat-value">{user?.puntos_fiabilidad ?? 0}</div>
              </div>
            </div>

            {/* CTA vendedor */}
            {!esVendedor && (
              <div className="vendor-cta">
                <div className="vendor-cta-text">
                  <h3>¿Quieres vender en R-Drop?</h3>
                  <p>Ventas desde hoy, comisiones transparentes del 8%.</p>
                </div>
                <button type="button" className="vendor-cta-btn" onClick={abrirSolicitud}>Solicitar ahora</button>
              </div>
            )}

            {/* Actividad reciente - transacciones */}
            <div className="orders-section">
              <h2>Actividad reciente</h2>
              {transacciones.length === 0 ? (
                <div className="orders-table">
                  <div className="table-row vacio">
                    Aún no tienes transacciones. Explora productos para empezar.
                  </div>
                </div>
              ) : (
                <div className="orders-table">
                  <div className="table-header">
                    <span>#</span>
                    <span>Producto</span>
                    <span>Estado</span>
                    <span>Monto</span>
                    <span>Te llegan</span>
                  </div>
                  {transacciones.slice(0, 5).map((t) => (
                    <div className="table-row" key={t.id_transaccion}>
                      <span className="order-id">#{t.id_transaccion}</span>
                      <span className="order-product">
                        {t.oferta?.producto?.titulo ?? `Oferta #${t.id_oferta}`}
                      </span>
                      <span className="order-status" style={{ color: "#3b82f6" }}>
                        ● {t.estado?.nombre_estado ?? "Pago pendiente"}
                      </span>
                      <span className="order-price">{formatearPrecio(t.monto_total)}</span>
                      <span className="order-price" style={{ color: "#22c55e" }}>
                        {formatearPrecio(t.monto_vendedor)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : pestaña === "compras" ? (
          <div className="orders-section">
            <h2>Mis ofertas (como comprador)</h2>
            {ofertasEnviadas.length === 0 ? (
              <div className="orders-table">
                <div className="table-row vacio">
                  No has enviado ofertas todavía.
                </div>
              </div>
            ) : (
              <div className="orders-table">
                <div className="table-header">
                  <span>Producto</span>
                  <span>Mi monto</span>
                  <span>Estado</span>
                  <span>Fecha</span>
                  <span>Acción</span>
                </div>
                {ofertasEnviadas.map((o) => (
                  <div className="table-row" key={o.id_oferta} style={{ gridTemplateColumns: "1fr 90px 110px 100px 130px" }}>
                    <span className="order-product">{o.producto?.titulo ?? `Producto #${o.id_producto}`}</span>
                    <span className="order-price">{formatearPrecio(o.monto)}</span>
                    <span className="order-status" style={{ color: o.id_estado === 1 ? "#f59e0b" : o.id_estado === 2 ? "#3b82f6" : "#22c55e" }}>
                      ● {o.estado?.nombre_estado ?? "Pendiente"}
                    </span>
                    <span className="order-date">{new Date(o.created_at).toLocaleDateString("es-CO")}</span>
                    <span>
                      {o.id_estado === 2 && (
                        <button onClick={() => manejarComprar(o.id_oferta)} className="new-order-btn" style={{ fontSize: "0.75rem", padding: "0.35rem 0.8rem" }}>
                          Completar compra
                        </button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : pestaña === "ventas" ? (
          <div className="orders-section">
            <h2>Ofertas recibidas (como vendedor)</h2>
            {ofertasRecibidasList.length === 0 ? (
              <div className="orders-table">
                <div className="table-row vacio">
                  No has recibido ofertas todavía.
                </div>
              </div>
            ) : (
              <div className="orders-table">
                <div className="table-header">
                  <span>Producto</span>
                  <span>Oferta</span>
                  <span>Comprador</span>
                  <span>Estado</span>
                  <span>Acciones</span>
                </div>
                {ofertasRecibidasList.map((o) => (
                  <div className="table-row" key={o.id_oferta} style={{ gridTemplateColumns: "1fr 90px 120px 110px 140px" }}>
                    <span className="order-product">{o.producto?.titulo ?? `#${o.id_producto}`}</span>
                    <span className="order-price">{formatearPrecio(o.monto)}</span>
                    <span className="order-product">{o.comprador?.nombre_completo ?? "—"}</span>
                    <span className="order-status" style={{ color: o.id_estado === 1 ? "#f59e0b" : o.id_estado === 2 ? "#22c55e" : "#666" }}>
                      ● {o.estado?.nombre_estado ?? "Pendiente"}
                    </span>
                    <span>
                      {(o.id_estado === 1) && (
                        <span style={{ display: "flex", gap: "0.4rem" }}>
                          <button onClick={() => manejarAceptar(o.id_oferta)} className="new-order-btn" style={{ fontSize: "0.75rem", padding: "0.35rem 0.8rem" }}>
                            Aceptar
                          </button>
                          <button onClick={() => manejarRechazar(o.id_oferta)} className="vendor-cta-btn" style={{ background: "transparent", border: "1px solid #555" }}>
                            Rechazar
                          </button>
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="orders-section">
            <h2>Transacciones y comisiones transparentes</h2>
            <p className="dash-subtitle" style={{ marginBottom: "1rem" }}>
              Sin sorpresas: siempre ves el desglose de comisión (pain point #1 que resolvemos).
            </p>
            {transacciones.length === 0 ? (
              <div className="orders-table">
                <div className="table-row vacio">
                  Aún no tienes transacciones.
                </div>
              </div>
            ) : (
              <div className="orders-table">
                <div className="table-header" style={{ gridTemplateColumns: "1fr 90px 90px 90px 90px" }}>
                  <span>Producto</span>
                  <span>Total</span>
                  <span>Comisión %</span>
                  <span>Comisión $</span>
                  <span>Vendedor</span>
                </div>
                {transacciones.map((t) => (
                  <div className="table-row" key={t.id_transaccion} style={{ gridTemplateColumns: "1fr 90px 90px 90px 90px" }}>
                    <span className="order-product">{t.oferta?.producto?.titulo ?? `#${t.id_oferta}`}</span>
                    <span className="order-price">{formatearPrecio(t.monto_total)}</span>
                    <span className="order-status">{t.comision_porcentaje}%</span>
                    <span className="order-status" style={{ color: "#f59e0b" }}>-{formatearPrecio(t.comision_monto)}</span>
                    <span className="order-price" style={{ color: "#22c55e" }}>{formatearPrecio(t.monto_vendedor)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal: solicitud para hacerse vendedor */}
        {mostrarSolicitud && (
          <div className="solicitud-overlay" onClick={() => setMostrarSolicitud(false)}>
            <div className="solicitud-modal" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="solicitud-cerrar"
                onClick={() => setMostrarSolicitud(false)}
                aria-label="Cerrar"
              >×</button>
              <h3>Quiero vender en R-Drop</h3>
              <p className="solicitud-sub">
                Completa tus datos de identidad. Un administrador revisará tu solicitud.
              </p>

              {msgSolicitud && (
                <div className="solicitud-msg">{msgSolicitud}</div>
              )}

              <label className="solicitud-label">
                Tipo de documento *
                <select
                  value={formSolicitud.tipo_documento_id}
                  onChange={(e) => setFormSolicitud({ ...formSolicitud, tipo_documento_id: Number(e.target.value) })}
                >
                  <option value={0} disabled>Selecciona...</option>
                  {tiposDoc.map((t) => (
                    <option key={t.id_tipo_doc} value={t.id_tipo_doc}>{t.nombre_tipo}</option>
                  ))}
                </select>
              </label>

              <label className="solicitud-label">
                Número de documento *
                <input
                  type="text"
                  value={formSolicitud.numero_documento}
                  onChange={(e) => setFormSolicitud({ ...formSolicitud, numero_documento: e.target.value })}
                  placeholder="Ej: 1023456789"
                />
              </label>

              <label className="solicitud-label">
                Ciudad *
                <input
                  type="text"
                  value={formSolicitud.ciudad}
                  onChange={(e) => setFormSolicitud({ ...formSolicitud, ciudad: e.target.value })}
                  placeholder="Ej: Bogotá"
                />
              </label>

              <label className="solicitud-label">
                Dirección *
                <input
                  type="text"
                  value={formSolicitud.direccion}
                  onChange={(e) => setFormSolicitud({ ...formSolicitud, direccion: e.target.value })}
                  placeholder="Ej: Calle 123 # 45-67"
                />
              </label>

              <label className="solicitud-label">
                ¿Por qué quieres vender? (opcional)
                <textarea
                  value={formSolicitud.descripcion_tienda}
                  onChange={(e) => setFormSolicitud({ ...formSolicitud, descripcion_tienda: e.target.value })}
                  placeholder="Cuéntanos sobre tu tienda o lo que vas a vender..."
                  rows={3}
                />
              </label>

              <div className="solicitud-botones">
                <button
                  type="button"
                  className="solicitud-cancel"
                  onClick={() => setMostrarSolicitud(false)}
                >Cancelar</button>
                <button
                  type="button"
                  className="solicitud-enviar"
                  onClick={manejarEnviarSolicitud}
                  disabled={enviandoSolicitud}
                >
                  {enviandoSolicitud ? "Enviando..." : "Enviar solicitud"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
