import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { misProductos, crearProducto, subirFotoProducto } from "../../services/productos";
import { obtenerCatalogos } from "../../services/catalogos";
import type { Product, Catalogos } from "../../types";
import "./MisProductos.css";

const MisProductos = () => {
  const { user } = useAuth();
  const esVendedor = user?.rol === "vendedor" || user?.rol === "admin";

  const [productos, setProductos] = useState<Product[]>([]);
  const [catalogos, setCatalogos] = useState<Catalogos>({ generos: [], categorias: [], estados_producto: [] });
  const [cargando, setCargando] = useState(true);

  // Estado del formulario
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    precio: "",
    id_categoria: 0,
    id_genero: 0,
    talla: "",
    id_estado_producto: 0,
    marca: "",
  });
  const [fotos, setFotos] = useState<string[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null);

  const cargar = async () => {
    const [prod, cat] = await Promise.all([
      misProductos().catch(() => ({ success: false, data: [] })),
      obtenerCatalogos().catch(() => ({ success: false, data: null })),
    ]);
    setProductos(prod.data ?? []);
    if (cat.success && cat.data) setCatalogos(cat.data);
    setCargando(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const convertirArchivo = (file: File): Promise<{ base64: string; mime: string }> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result ?? "");
        // result: "data:image/png;base64,XXXX"
        const comma = result.indexOf(",");
        const head = comma >= 0 ? result.slice(0, comma) : "";
        const base64 = comma >= 0 ? result.slice(comma + 1) : result;
        const mimeMatch = head.match(/data:([^;]+);/);
        const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
        resolve({ base64, mime });
      };
      reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
      reader.readAsDataURL(file);
    });

  const manejarFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    e.target.value = "";
    setSubiendo(true);
    setMensaje(null);
    try {
      for (const file of files) {
        const { base64, mime } = await convertirArchivo(file);
        const res = await subirFotoProducto(base64, mime);
        if (res.success && res.data?.url) {
          setFotos((prev) => [...prev, res.data!.url]);
        } else {
          setMensaje({ tipo: "err", texto: res.error ?? "Error al subir una foto." });
        }
      }
    } catch {
      setMensaje({ tipo: "err", texto: "No se pudo subir la foto. Intenta de nuevo." });
    } finally {
      setSubiendo(false);
    }
  };

  const quitarFoto = (url: string) => setFotos((prev) => prev.filter((f) => f !== url));

  const manejarCrear = async () => {
    setMensaje(null);
    if (!form.titulo.trim() || !form.descripcion.trim() || !form.precio
      || !form.id_categoria || !form.id_genero || !form.id_estado_producto) {
      setMensaje({ tipo: "err", texto: "Completa todos los campos obligatorios." });
      return;
    }
    if (fotos.length === 0) {
      setMensaje({ tipo: "err", texto: "Sube al menos una foto." });
      return;
    }
    const precio = Number(form.precio);
    if (!(precio > 0)) {
      setMensaje({ tipo: "err", texto: "El precio debe ser mayor a 0." });
      return;
    }
    setEnviando(true);
    const res = await crearProducto({
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      precio,
      id_categoria: form.id_categoria,
      id_genero: form.id_genero,
      talla: form.talla.trim() || null,
      id_estado_producto: form.id_estado_producto,
      marca: form.marca.trim() || null,
      fotos,
    }).catch((e) => ({ success: false, error: e?.response?.data?.error ?? "Error al publicar el producto" }));
    setEnviando(false);
    if (res.success) {
      setMensaje({ tipo: "ok", texto: "¡Producto publicado correctamente!" });
      setForm({ titulo: "", descripcion: "", precio: "", id_categoria: 0, id_genero: 0, talla: "", id_estado_producto: 0, marca: "" });
      setFotos([]);
      cargar();
    } else {
      setMensaje({ tipo: "err", texto: res.error ?? "Error al publicar el producto." });
    }
  };

  const formatearPrecio = (n: number) => `$${n.toLocaleString("es-CO")}`;

  if (cargando) {
    return <div className="misproductos-loading">Cargando...</div>;
  }

  return (
    <div className="misproductos-page">
      <div className="misproductos-header">
        <div>
          <h1>Mis productos</h1>
          <p className="misproductos-sub">Publica y gestiona lo que vendes en R-Drop.</p>
        </div>
        <Link to="/products" className="misproductos-ver">Ver tienda</Link>
      </div>

      {mensaje && (
        <div className={`misproductos-msg ${mensaje.tipo === "ok" ? "ok" : "err"}`}>{mensaje.texto}</div>
      )}

      {!esVendedor ? (
        <div className="misproductos-aviso">
          <h3>Necesitas ser vendedor para publicar productos</h3>
          <p>
            Desde tu panel puedes enviar una solicitud para vender en R-Drop.
            Cuando un administrador la apruebe, podrás publicar aquí.
          </p>
          <Link to="/dashboard" className="misproductos-btn">Ir a mi panel</Link>
        </div>
      ) : (
        <>
          <div className="misproductos-form">
            <h2>Publicar producto</h2>

            <div className="form-grid">
              <label className="mp-label">
                Título *
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej: Buzo Nike Dri-FIT talla M"
                />
              </label>

              <label className="mp-label">
                Precio (COP) *
                <input
                  type="number"
                  min={0}
                  value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: e.target.value })}
                  placeholder="Ej: 150000"
                />
              </label>

              <label className="mp-label">
                Categoría *
                <select value={form.id_categoria} onChange={(e) => setForm({ ...form, id_categoria: Number(e.target.value) })}>
                  <option value={0} disabled>Selecciona...</option>
                  {catalogos.categorias.map((c) => (
                    <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>
                  ))}
                </select>
              </label>

              <label className="mp-label">
                Género *
                <select value={form.id_genero} onChange={(e) => setForm({ ...form, id_genero: Number(e.target.value) })}>
                  <option value={0} disabled>Selecciona...</option>
                  {catalogos.generos.map((g) => (
                    <option key={g.id_genero} value={g.id_genero}>{g.nombre_genero}</option>
                  ))}
                </select>
              </label>

              <label className="mp-label">
                Estado de la prenda *
                <select value={form.id_estado_producto} onChange={(e) => setForm({ ...form, id_estado_producto: Number(e.target.value) })}>
                  <option value={0} disabled>Selecciona...</option>
                  {catalogos.estados_producto.map((es) => (
                    <option key={es.id_estado} value={es.id_estado}>{es.nombre_estado}</option>
                  ))}
                </select>
              </label>

              <label className="mp-label">
                Talla
                <input
                  type="text"
                  value={form.talla}
                  onChange={(e) => setForm({ ...form, talla: e.target.value })}
                  placeholder="Ej: M, 42, S"
                />
              </label>

              <label className="mp-label mp-marca">
                Marca
                <input
                  type="text"
                  value={form.marca}
                  onChange={(e) => setForm({ ...form, marca: e.target.value })}
                  placeholder="Ej: Nike"
                />
              </label>

              <label className="mp-label mp-descripcion">
                Descripción *
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Describe la prenda, su estado y detalles..."
                  rows={4}
                />
              </label>
            </div>

            <div className="mp-fotos">
              <span className="mp-label">Fotos *</span>
              <div className="mp-fotos-row">
                <label className="mp-foto-upload">
                  {subiendo ? "Subiendo..." : "+ Agregar fotos"}
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple onChange={manejarFotos} disabled={subiendo} />
                </label>
                {fotos.map((url) => (
                  <div className="mp-foto-preview" key={url}>
                    <img src={url} alt="Vista previa" />
                    <button type="button" onClick={() => quitarFoto(url)} aria-label="Quitar foto">×</button>
                  </div>
                ))}
              </div>
            </div>

            <button type="button" className="misproductos-publicar" onClick={manejarCrear} disabled={enviando}>
              {enviando ? "Publicando..." : "Publicar producto"}
            </button>
          </div>

          <div className="misproductos-lista">
            <h2>Mis productos publicados</h2>
            {productos.length === 0 ? (
              <div className="misproductos-vacio">Aún no tienes productos publicados.</div>
            ) : (
              <div className="misproductos-grid">
                {productos.map((p) => (
                  <div className="mp-card" key={p.id_producto}>
                    <div className="mp-card-img">
                      {Array.isArray(p.fotos) && (p.fotos as string[]).length > 0 ? (
                        <img src={(p.fotos as string[])[0]} alt={p.titulo} />
                      ) : (
                        <span>Sin foto</span>
                      )}
                    </div>
                    <div className="mp-card-body">
                      <div className="mp-card-titulo">{p.titulo}</div>
                      <div className="mp-card-precio">{formatearPrecio(p.precio)}</div>
                      <div className={`mp-card-estado ${p.disponible ? "ok" : "no"}`}>
                        {p.disponible ? "Disponible" : "Oculto"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MisProductos;
