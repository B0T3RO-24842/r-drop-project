import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabase";
import type { AuthContextType, User } from "../types";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Carga (o crea) el perfil en la tabla `usuarios` a partir de la sesión de Supabase.
  // Nunca anula `setUser(null)` por un fallo de DB: mantiene al menos los datos mínimos
  // de la sesión como fuente de verdad, evitando que se "cierre solo" la sesión.
  const sincronizarPerfil = async (authUser: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
  }): Promise<User | null> => {
    const { data: perfil, error: errPerfil } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (perfil) {
      setUser(perfil as User);
      return perfil as User;
    }

    // El perfil no existe: intentar crearlo desde los datos de la sesión.
    if (errPerfil && errPerfil.code !== "PGRST116") {
      console.error("Error buscando perfil:", errPerfil.message);
    }

    const nombre = (authUser.user_metadata?.nombre_completo as string | undefined)
      ?? authUser.email?.split("@")[0]
      ?? "Usuario";

    const { data: creado, error: errCrear } = await supabase
      .from("usuarios")
      .upsert({
        id: authUser.id,
        email: authUser.email ?? "",
        nombre_completo: nombre,
        rol: "comprador",
        puntos_fiabilidad: 0,
      }, { onConflict: "id" })
      .select()
      .single();

    if (!errCrear && creado) {
      setUser(creado as User);
      return creado as User;
    }

    // Si no se pudo crear ni leer, conservamos un perfil mínimo para no expulsar.
    console.error("No se pudo sincronizar el perfil:", errCrear?.message);
    const minimo: User = {
      id: authUser.id,
      email: authUser.email ?? "",
      nombre_completo: nombre,
      rol: "comprador",
      puntos_fiabilidad: 0,
    };
    setUser(minimo);
    return minimo;
  };

  useEffect(() => {
    let mounted = true;

    const aplicarSesion = async (session: { user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } } | null) => {
      if (!mounted) return;
      if (session?.user) {
        await sincronizarPerfil(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        // SIGNED_OUT siempre limpia. Los demás eventos refrescan el perfil.
        if (event === "SIGNED_OUT") {
          setUser(null);
          setLoading(false);
          return;
        }
        aplicarSesion(session);
      }
    );

    // Sesión inicial explícita (cubre INITIAL_SESSION y arranque en frío)
    supabase.auth.getSession().then(({ data }) => {
      aplicarSesion(data.session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signup = async (email: string, password: string, nombre: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre_completo: nombre } },
    });
    if (error) throw new Error(error.message);

    // Si no hay confirmación de email activa, Supabase devuelve una sesión
    // inmediata: iniciamos sesión automáticamente y cargamos el perfil.
    if (data.session?.user) {
      await sincronizarPerfil(data.session.user);
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    // Espera a tener el perfil antes de redirigir para evitar el rebote de PrivateRoute.
    if (data.session?.user) {
      const perfil = await sincronizarPerfil(data.session.user);
      setLoading(false);
      // Redirect condicional según el rol:
      // vendedor/admin → Dashboard; comprador → catálogo/tienda.
      const rol = perfil?.rol;
      const destino = (rol === "vendedor" || rol === "admin") ? "/dashboard" : "/products";
      navigate(destino);
      return;
    }
    navigate("/products");
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) throw new Error(error.message);
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};