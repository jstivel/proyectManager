-- ========================================
-- FUNCIONES RPC CRÍTICAS PARA DASHBOARD
-- ========================================

-- 1. Función para obtener usuarios del dashboard con roles y organizaciones
CREATE OR REPLACE FUNCTION get_usuarios_dashboard()
RETURNS TABLE (
    id UUID,
    nombre TEXT,
    email TEXT,
    rol_id INTEGER,
    rol_nombre TEXT,
    organizacion_id UUID,
    organizacion_nombre TEXT,
    activo BOOLEAN,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.nombre,
        u.email,
        u.rol_id,
        r.nombre as rol_nombre,
        u.organizacion_id,
        o.nombre as organizacion_nombre,
        u.activo,
        u.created_at
    FROM usuarios u
    LEFT JOIN roles r ON u.rol_id = r.id
    LEFT JOIN organizaciones o ON u.organizacion_id = o.id
    WHERE u.rol_id != 4 -- Excluir superadmins si es necesario
    ORDER BY u.created_at DESC;
END;
$$;

-- 2. Función para obtener organizaciones con conteos (versión final corregida)
CREATE OR REPLACE FUNCTION get_organizaciones_dashboard_final()
RETURNS TABLE (
    id UUID,
    nombre TEXT,
    nit TEXT,
    plan_nombre TEXT,
    total_usuarios BIGINT,
    total_proyectos BIGINT,
    activo BOOLEAN,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.nombre,
        o.nit,
        COALESCE(p.nombre, 'Enterprise') as plan_nombre,
        COALESCE(COUNT(DISTINCT u.id), 0)::BIGINT as total_usuarios,
        COALESCE(COUNT(DISTINCT pr.id), 0)::BIGINT as total_proyectos,
        o.activo,
        o.created_at
    FROM organizaciones o
    LEFT JOIN usuarios u ON o.id = u.organizacion_id AND u.activo = true
    LEFT JOIN proyectos pr ON o.id = pr.organizacion_id AND pr.activo = true
    LEFT JOIN planes p ON o.plan_id = p.id
    WHERE o.activo = true
    GROUP BY o.id, o.nombre, o.nit, p.nombre, o.activo, o.created_at
    ORDER BY o.nombre;
END;
$$;

-- 3. Función simple de organizaciones como fallback
CREATE OR REPLACE FUNCTION get_organizaciones_simple()
RETURNS TABLE (
    id UUID,
    nombre TEXT,
    nit TEXT,
    activo BOOLEAN,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.nombre,
        o.nit,
        o.activo,
        o.created_at
    FROM organizaciones o
    WHERE o.activo = true
    ORDER BY o.nombre;
END;
$$;

-- 4. Función segura para eliminar usuarios
CREATE OR REPLACE FUNCTION fn_delete_usuario_seguro(p_usuario_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_affected_rows INTEGER;
    v_audit_id BIGINT;
BEGIN
    -- Verificar que el usuario existe
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id = p_usuario_id) THEN
        RETURN json_build_object('success', false, 'error', 'Usuario no encontrado');
    END IF;
    
    -- No permitir eliminar administradores globales
    IF EXISTS (SELECT 1 FROM usuarios WHERE id = p_usuario_id AND rol_id = 4) THEN
        RETURN json_build_object('success', false, 'error', 'No se puede eliminar un administrador global');
    END IF;
    
    -- Eliminar el usuario
    DELETE FROM usuarios WHERE id = p_usuario_id;
    
    GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
    
    -- Registrar en auditoría
    INSERT INTO auditoria_usuarios (usuario_id, accion, fecha, datos_anteriores)
    VALUES (p_usuario_id, 'DELETE', NOW(), 
            json_build_object('eliminado_por', current_setting('app.current_user_id', true)))
    RETURNING id INTO v_audit_id;
    
    RETURN json_build_object(
        'success', true, 
        'affected_rows', v_affected_rows,
        'audit_id', v_audit_id
    );
END;
$$;

-- 5. Función para guardar/editar usuarios de forma segura
CREATE OR REPLACE FUNCTION fn_save_usuario_seguro(
    p_nombre TEXT,
    p_email TEXT,
    p_rol_id INTEGER,
    p_organizacion_id UUID,
    p_id_edicion UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_usuario_id UUID;
    v_es_nuevo BOOLEAN := p_id_edicion IS NULL;
    v_audit_id BIGINT;
BEGIN
    -- Validaciones básicas
    IF p_nombre IS NULL OR LENGTH(TRIM(p_nombre)) < 2 THEN
        RETURN json_build_object('success', false, 'error', 'Nombre inválido');
    END IF;
    
    IF p_email IS NULL OR NOT p_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RETURN json_build_object('success', false, 'error', 'Email inválido');
    END IF;
    
    IF p_rol_id IS NULL OR p_rol_id < 1 THEN
        RETURN json_build_object('success', false, 'error', 'Rol inválido');
    END IF;
    
    -- Verificar email único
    IF EXISTS (
        SELECT 1 FROM usuarios 
        WHERE email = LOWER(TRIM(p_email)) 
        AND (p_id_edicion IS NULL OR id != p_id_edicion)
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Email ya registrado');
    END IF;
    
    -- INSERT o UPDATE
    IF v_es_nuevo THEN
        INSERT INTO usuarios (nombre, email, rol_id, organizacion_id, activo, created_at)
        VALUES (TRIM(p_nombre), LOWER(TRIM(p_email)), p_rol_id, p_organizacion_id, true, NOW())
        RETURNING id INTO v_usuario_id;
        
        -- Auditoría
        INSERT INTO auditoria_usuarios (usuario_id, accion, fecha, datos_nuevos)
        VALUES (v_usuario_id, 'INSERT', NOW(), 
                json_build_object('nombre', p_nombre, 'email', p_email, 'rol_id', p_rol_id))
        RETURNING id INTO v_audit_id;
    ELSE
        UPDATE usuarios 
        SET nombre = TRIM(p_nombre),
            email = LOWER(TRIM(p_email)),
            rol_id = p_rol_id,
            organizacion_id = COALESCE(p_organizacion_id, organizacion_id),
            updated_at = NOW()
        WHERE id = p_id_edicion
        RETURNING id INTO v_usuario_id;
        
        -- Auditoría
        INSERT INTO auditoria_usuarios (usuario_id, accion, fecha, datos_nuevos)
        VALUES (p_id_edicion, 'UPDATE', NOW(), 
                json_build_object('nombre', p_nombre, 'email', p_email, 'rol_id', p_rol_id))
        RETURNING id INTO v_audit_id;
    END IF;
    
    RETURN json_build_object(
        'success', true, 
        'usuario_id', v_usuario_id,
        'es_nuevo', v_es_nuevo,
        'audit_id', v_audit_id
    );
END;
$$;

-- 6. Función para activar/desactivar usuarios
CREATE OR REPLACE FUNCTION fn_toggle_usuario_activo(p_usuario_id UUID, p_estado BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE usuarios 
    SET activo = p_estado, updated_at = NOW()
    WHERE id = p_usuario_id AND rol_id != 4; -- No permitir desactivar admins globales
END;
$$;

-- ========================================
-- PERMISOS Y CONFIGURACIÓN
-- ========================================

-- Asegurar que las funciones tienen los permisos correctos
GRANT EXECUTE ON FUNCTION get_usuarios_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION get_organizaciones_dashboard_final() TO authenticated;
GRANT EXECUTE ON FUNCTION get_organizaciones_simple() TO authenticated;
GRANT EXECUTE ON FUNCTION fn_delete_usuario_seguro(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION fn_save_usuario_seguro(TEXT, TEXT, INTEGER, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION fn_toggle_usuario_activo(UUID, BOOLEAN) TO authenticated;

-- Comentarios para documentación
COMMENT ON FUNCTION get_usuarios_dashboard() IS 'Obtiene lista de usuarios con roles y organizaciones para el dashboard';
COMMENT ON FUNCTION get_organizaciones_dashboard_final() IS 'Obtiene organizaciones con conteos de usuarios y proyectos';
COMMENT ON FUNCTION get_organizaciones_simple() IS 'Versión simple de organizaciones como fallback';
COMMENT ON FUNCTION fn_delete_usuario_seguro(UUID) IS 'Elimina usuario de forma segura con auditoría';
COMMENT ON FUNCTION fn_save_usuario_seguro(TEXT, TEXT, INTEGER, UUID, UUID) IS 'Guarda o edita usuario con validaciones';
COMMENT ON FUNCTION fn_toggle_usuario_activo(UUID, BOOLEAN) IS 'Activa o desactiva un usuario';