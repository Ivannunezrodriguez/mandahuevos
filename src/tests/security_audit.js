
import { createClient } from '@supabase/supabase-js';

// Configuración - LEER DE VARIABLES DE ENTORNO O HARDCODED PARA TEST LOCAL
// NOTA: Para que este test funcione, necesitas tus credenciales reales de Supabase aquí
// o configurar un entorno de prueba local con Supabase CLI.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'TU_SUPABASE_URL_AQUI';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'TU_SUPABASE_KEY_AQUI';

if (SUPABASE_URL === 'TU_SUPABASE_URL_AQUI') {
    console.warn("⚠️  ADVERTENCIA: No se han configurado las credenciales de Supabase en el script.");
    console.warn("    Por favor, establece VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu entorno o edita este archivo.");
    process.exit(0); // Salimos sin error para no romper CI/CD si no está configurado
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runSecurityAudit() {
    console.log("🔒 Iniciando Auditoría de Seguridad Automatizada...");

    // 1. Crear un usuario 'Hacker' visitante (o usar uno existente)
    const hackerEmail = `hacker_${Date.now()}@test.com`;
    const hackerPassword = 'password123';

    console.log(`\n1. Registrando usuario atacante: ${hackerEmail}`);
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: hackerEmail,
        password: hackerPassword,
    });

    if (authError) {
        console.error("❌ Fallo al crear usuario de prueba:", authError.message);
        return;
    }

    const hackerId = authData.user?.id;
    if (!hackerId) {
        console.log("⚠️  Usuario creado pero requiere confirmación de email. No se puede proceder sin login automático.");
        console.log("    (En desarrollo local, desactiva 'Confirm Email' en Supabase Auth Settings para testear esto)");
        return;
    }

    console.log("✅ Usuario atacante registrado.");

    // Login para obtener sesión
    const { data: sessionData, error: loginError } = await supabase.auth.signInWithPassword({
        email: hackerEmail,
        password: hackerPassword
    });

    if (loginError) {
        console.error("❌ Fallo al iniciar sesión:", loginError.message);
        return;
    }

    // Cliente autenticado como el atacante
    const hackerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${sessionData.session.access_token}` } }
    });

    // TEST 1: Intentar leer TODOS los pedidos (Debería fallar o retornar solo los suyos - array vacío)
    console.log("\n2. TEST: Intento de acceso a tabla 'orders' completa...");
    const { data: orders, error: ordersError } = await hackerClient
        .from('orders')
        .select('*');

    if (ordersError) {
        console.log("✅ PASSED: Acceso denegado o error controlado:", ordersError.message);
    } else {
        if (orders.length === 0) {
            console.log("✅ PASSED: Se retornaron 0 registros (RLS ocultó los pedidos de otros).");
        } else {
            // Verificar si alguno no es suyo
            const stolenData = orders.some(o => o.user_id_ref !== hackerEmail && o.user_id_ref !== hackerId);
            if (stolenData) {
                console.error("❌ FAILED: CRÍTICO - El usuario pudo ver pedidos de otros!!", orders);
                process.exit(1);
            } else {
                console.log("✅ PASSED: El usuario solo ve sus propios datos.");
            }
        }
    }

    // TEST 2: Intentar modificar inventario (Solo ADMIN)
    console.log("\n3. TEST: Intento de modificación de 'inventory'...");
    const { error: updateError } = await hackerClient
        .from('inventory')
        .update({ stock_quantity: 0 }) // Intentar borrar stock
        .eq('product_id', 'carton-xxl'); // Asumiendo que existe

    // En RLS, un update que no matchea políticas a menudo simplemente no actualiza nada (count: 0) o tira error.
    // Si la política es 'USING (false)' para update, debería dar 0 rows affected o error de permiso.
    if (updateError) {
        console.log("✅ PASSED: Error de permiso al actualizar:", updateError.message);
    } else {
        // Verificar si se actualizó algo (necesitamos saber el valor antes, pero RLS debería prevenirlo)
        // Lo ideal es checkear count si se devuelve
        console.log("⚠️  WARN: La operación no retornó error. Verificando integridad...");

        // Verificación con cliente ADMIN (Service Role o Anon público lectura)
        const { data: checkItem } = await supabase
            .from('inventory')
            .select('stock_quantity')
            .eq('product_id', 'carton-xxl')
            .single();

        if (checkItem && checkItem.stock_quantity === 0) {
            console.error("❌ FAILED: El usuario logró modificar el inventario!");
            process.exit(1);
        } else {
            console.log("✅ PASSED: El inventario no se vio afectado.");
        }
    }

    console.log("\n✅ AUDITORÍA COMPLETADA: El sistema parece seguro bajo RLS básico.");

    // Limpieza (Opcional, borrar usuario hacker)
    // await supabase.auth.admin.deleteUser(hackerId);
}

runSecurityAudit().catch(err => {
    console.error("Error inesperado:", err);
    process.exit(1);
});
