import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Dashboard.css";

const Dashboard = () => {
  const { user, logout } = useAuth();

  const getInitial = () => {
    if (!user?.nombre_completo) return "U";
    return user.nombre_completo.charAt(0).toUpperCase();
  };

  const orders: never[] = [];

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
          <a href="#" className="sidebar-link active">📊 Dashboard</a>
          <a href="#" className="sidebar-link">📦 Mis pedidos</a>
          <a href="#" className="sidebar-link">⭐ Favoritos</a>
          <a href="#" className="sidebar-link">💬 Mensajes</a>
          {(user?.rol === "vendedor" || user?.rol === "admin") && (
            <a href="#" className="sidebar-link">🏪 Mis prendas</a>
          )}
          {user?.rol === "admin" && (
            <a href="#" className="sidebar-link sidebar-link-admin">🛡️ Panel admin</a>
          )}
          <a href="#" className="sidebar-link">⚙️ Configuración</a>
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

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Ofertas activas</div>
            <div className="stat-value">0</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Compras realizadas</div>
            <div className="stat-value">0</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Favoritos</div>
            <div className="stat-value">0</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Fiabilidad</div>
            <div className="stat-value">{user?.puntos_fiabilidad ?? 0}</div>
          </div>
        </div>

        {/* Solicitud vendedor si es comprador */}
        {user?.rol === "comprador" && (
          <div className="vendor-cta">
            <div className="vendor-cta-text">
              <h3>¿Quieres vender en R-Drop?</h3>
              <p>Solicita ser vendedor verificado y empieza a publicar tus prendas.</p>
            </div>
            <a href="#" className="vendor-cta-btn">Solicitar ahora</a>
          </div>
        )}

        {/* Orders Table */}
        <div className="orders-section">
          <h2>Actividad reciente</h2>
          <div className="orders-table">
            <div className="table-header">
              <span>ID</span>
              <span>Producto</span>
              <span>Estado</span>
              <span>Fecha</span>
              <span>Precio</span>
            </div>
            {orders.length === 0 && (
              <div className="table-row" style={{ justifyContent: "center", color: "#555" }}>
                Aún no tienes actividad. Explora productos para empezar.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;