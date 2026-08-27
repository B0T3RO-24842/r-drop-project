import { useState, useEffect, useCallback } from "react";
import { listarProductos } from "../../services/productos";
import { obtenerCatalogos } from "../../services/catalogos";
import type { Product, Categoria } from "../../types";
import "./Products.css";

const Products = () => {
  // Leer categoría de la URL si viene del Home
  const params = new URLSearchParams(window.location.search);
  const categoriaInicial = params.get("categoria");

  const [productos, setProductos] = useState<Product[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [search, setSearch] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number | null>(
    categoriaInicial ? parseInt(categoriaInicial, 10) : null
  );
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar catálogos al montar
  useEffect(() => {
    obtenerCatalogos().then((res) => {
      if (res.success && res.data) {
        setCategorias(res.data.categorias);
      }
    });
  }, []);

  // Cargar productos cada vez que cambian los filtros
  const cargarProductos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await listarProductos({
        search: search || undefined,
        id_categoria: categoriaSeleccionada ?? undefined,
        page: pagina,
        limite: 12,
        ordenar_por: "created_at",
        direccion: "desc",
      });
      if (res.success && res.data) {
        setProductos(res.data);
        setTotalPaginas(res.pagination.paginas);
      } else {
        setError(res.error || "Error al cargar productos");
      }
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setCargando(false);
    }
  }, [search, categoriaSeleccionada, pagina]);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  // Resetear a página 1 al cambiar filtros
  useEffect(() => {
    setPagina(1);
  }, [search, categoriaSeleccionada]);

  const handleBuscar = (valor: string) => {
    setSearch(valor);
  };

  return (
    <div className="products-page">
      {/* Search bar */}
      <div className="products-hero">
        <h1>Explora productos</h1>
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Busca por nombre, marca..."
            value={search}
            onChange={(e) => handleBuscar(e.target.value)}
          />
        </div>
      </div>

      <div className="products-body">
        {/* Filtros de categoría */}
        <aside className="filters">
          <h3>Categorías</h3>
          <div className="filter-list">
            <button
              className={`filter-btn ${categoriaSeleccionada === null ? "active" : ""}`}
              onClick={() => setCategoriaSeleccionada(null)}
            >
              Todos
            </button>
            {categorias.map((c) => (
              <button
                key={c.id_categoria}
                className={`filter-btn ${categoriaSeleccionada === c.id_categoria ? "active" : ""}`}
                onClick={() => setCategoriaSeleccionada(c.id_categoria)}
              >
                {c.nombre_categoria}
              </button>
            ))}
          </div>
        </aside>

        {/* Grid de productos */}
        <div className="products-grid">
          {cargando && (
            <div className="no-results">Cargando productos...</div>
          )}

          {error && (
            <div className="no-results">{error}</div>
          )}

          {!cargando && !error && productos.map((p) => (
            <div className="product-card" key={p.id_producto}>
              <div className="product-img">
                {p.fotos && p.fotos.length > 0 ? (
                  <img src={p.fotos[0]} alt={p.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  "📦"
                )}
              </div>
              <div className="product-info">
                <span className="product-category">
                  {p.categoria?.nombre_categoria}
                </span>
                <h3 className="product-name">{p.titulo}</h3>
                {p.marca && (
                  <span style={{ fontSize: "0.75rem", color: "#666" }}>{p.marca}</span>
                )}
                <div className="product-prices">
                  <span className="price-current">${p.precio.toLocaleString("es-CO")}</span>
                </div>
                <button className="add-cart-btn">Ver detalle</button>
              </div>
            </div>
          ))}

          {!cargando && !error && productos.length === 0 && (
            <div className="no-results">No se encontraron productos</div>
          )}
        </div>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", padding: "1rem 0 2rem" }}>
          <button
            className="filter-btn"
            disabled={pagina === 1}
            onClick={() => setPagina((p) => p - 1)}
          >
            Anterior
          </button>
          <span style={{ color: "#777", padding: "0.5rem 0.75rem", fontSize: "0.9rem" }}>
            {pagina} / {totalPaginas}
          </span>
          <button
            className="filter-btn"
            disabled={pagina === totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default Products;
