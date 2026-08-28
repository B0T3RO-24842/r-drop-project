import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { misProductos } from "../../services/productos";
import { listarTransacciones } from "../../services/transacciones";
import { obtenerCatalogos } from "../../services/catalogos";
import type { Product, Genero, Transaccion } from "../../types";
import "./Perfil.css";

const Perfil = () => {
  const { user } = useAuth();
  const [productos, setProductos] = useState<Product[]>([]);
  const [generos, setGeneros] = useState<Genero[]>([]);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [generoSeleccionado, setGeneroSeleccionado] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([
      misProductos().catch(() => ({ success: false, data: [] })),
      listarTransacciones().catch(() => ({ success: false, data: [] })),
      obtenerCatalogos().catch(() => ({ success: false, data: null })),
    ]).then(([prod, trans, cat]) => {
      setProductos(prod.data ?? []);
      setTransacciones(trans.data ?? []);
      if (cat.success && cat.data) {
        setGeneros(cat.data.generos);
      }
      setCargando(false);
    });
  }, []);

  const getInitial = () => user?.nombre_completo?.charAt(0).toUpperCase() ?? "U";

  // Rating: derivamos una puntuación 0-5 a partir de puntos_fiabilidad
  const rating = Math.min(5, Math.max(0, Math.round((user?.puntos_fiabilidad ?? 0) / 20))) + 4;

  const esVendedor = user?.rol === "vendedor" || user?.rol === "admin";
  const compras = transacciones.filter((t) => t.oferta?.comprador_id === user?.id).length;
  const ventas = esVendedor
    ? transacciones.filter((t) => t.oferta?.producto?.vendedor_id === user?.id).length
    : 0;

  const productosFiltrados = generoSeleccionado === null
    ? productos
    : productos.filter((p) => p.genero?.id_genero === generoSeleccionado);

  const compartir = async () => {
    const texto = `Mira mi perfil en R-Drop: ${user?.nombre_completo}`;
    try {
      await navigator.clipboard.writeText(texto);
      alert("¡Perfil copiado al portapapeles!");
    } catch {
      alert(texto);
    }
  };

  return (
    <div className="perfil-page">
      {/* Cabecera del perfil */}
      <div className="perfil-header">
        <div className="perfil-avatar-grande">
          {user?.foto_perfil ? (
            <img src={user.foto_perfil} alt="Avatar" />
          ) : (
            <span>{getInitial()}</span>
          )}
        </div>

        <div className="perfil-info">
          <h1>{user?.nombre_completo ?? "Usuario"}</h1>
          <div className="perfil-rating">
            <span className="perfil-estrellas">{"★".repeat(Math.round(rating))} <span className="perfil-estrellas-vacias">{"★".repeat(5 - Math.round(rating))}</span></span>
            <span className="perfil-rating-num">{rating.toFixed(1)}</span>
            <span className="perfil-rol">· {user?.rol ?? "comprador"}</span>
          </div>

          <div className="perfil-stats">
            <div className="perfil-stat">
              <strong>{compras}</strong>
              <span>Compras</span>
            </div>
            <div className="perfil-stat">
              <strong>{ventas}</strong>
              <span>Ventas</span>
            </div>
            <div className="perfil-stat">
              <strong>0</strong>
              <span>Seguidores</span>
            </div>
            <div className="perfil-stat">
              <strong>0</strong>
              <span>Seguidos</span>
            </div>
          </div>

          <div className="perfil-acciones">
            <button className="perfil-compartir" onClick={compartir}>🔗 Compartir</button>
            {esVendedor && (
              <span className="perfil-nivel">
                {user?.nivel_vendedor === "pro" ? "⭐ Vendedor Pro" : "🛍️ Vendedor"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid de productos */}
      <div className="perfil-productos">
        <h2>Mis productos</h2>

        {esVendedor ? (
          <>
            <div className="perfil-filtros">
              <button
                className={`filter-btn ${generoSeleccionado === null ? "active" : ""}`}
                onClick={() => setGeneroSeleccionado(null)}
              >
                Todos
              </button>
              {generos.map((g) => (
                <button
                  key={g.id_genero}
                  className={`filter-btn ${generoSeleccionado === g.id_genero ? "active" : ""}`}
                  onClick={() => setGeneroSeleccionado(g.id_genero)}
                >
                  {g.nombre_genero}
                </button>
              ))}
            </div>

            {cargando ? (
              <div className="no-results">Cargando productos...</div>
            ) : productosFiltrados.length === 0 ? (
              <div className="no-results">
                {productos.length === 0
                  ? "Aún no has publicado productos."
                  : "No hay productos en esta categoría."}
              </div>
            ) : (
              <div className="products-grid">
                {productosFiltrados.map((p) => (
                  <div className="product-card" key={p.id_producto}>
                    <div className="product-img">
                      {p.fotos && p.fotos.length > 0 ? (
                        <img src={p.fotos[0]} alt={p.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        "📦"
                      )}
                    </div>
                    <div className="product-info">
                      <span className="product-category">{p.categoria?.nombre_categoria}</span>
                      <h3 className="product-name">{p.titulo}</h3>
                      <div className="product-prices">
                        <span className="price-current">${p.precio.toLocaleString("es-CO")}</span>
                      </div>
                      <span className={`perfil-disponible ${p.disponible ? "ok" : "no"}`}>
                        {p.disponible ? "Disponible" : "Vendido"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="no-results">
            Hazte vendedor para publicar y mostrar tus productos aquí.
          </div>
        )}
      </div>
    </div>
  );
};

export default Perfil;
