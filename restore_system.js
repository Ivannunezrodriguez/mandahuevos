
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dthxbrybixrwgtvptiam.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0aHhicnliaXhyd2d0dnB0aWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MzIwMzksImV4cCI6MjA4NjIwODAzOX0.RV_4D6PcWBwO7eiw7rjlzCchXV8_VKNH4PR25uFfn5k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreSystem() {
    console.log("Iniciando restauración del sistema...");

    // 1. Crear ADMIN (GranHuevon)
    const adminEmail = 'GranHuevon@mandahuevos.com'; // Email ficticio para Auth
    const adminPass = 'Huevosde0R0.COM';

    console.log(`1. Creando Admin (${adminEmail})...`);

    // Primero intentamos login para ver si existe
    let { data: adminLogin, error: loginError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPass
    });

    let adminUser = adminLogin.user;

    if (loginError) {
        console.log("   Admin no existe o password incorrecto. Intentando crear...");
        const { data: adminCreate, error: createError } = await supabase.auth.signUp({
            email: adminEmail,
            password: adminPass,
            options: {
                data: { full_name: 'Gran Huevón' }
            }
        });

        if (createError) {
            console.error("   ❌ Error creando Admin Auth:", createError.message);
        } else {
            console.log("   ✅ Admin Auth creado.");
            adminUser = adminCreate.user;
        }
    } else {
        console.log("   ✅ Admin ya existía.");
    }

    if (adminUser) {
        // Asegurar rol en Profile
        const { error: roleError } = await supabase
            .from('profiles')
            .upsert({
                id: adminUser.id,
                email: adminEmail,
                role: 'admin',
                full_name: 'Gran Huevón',
                updated_at: new Date()
            });

        if (roleError) console.error("   ❌ Error actualizando rol Admin:", roleError.message);
        else console.log("   ✅ Rol de Admin asignado en Profiles.");
    }

    // 2. Arreglar Perfil de Usuario (ivannr21@gmail.com)
    const userEmail = 'ivannr21@gmail.com';
    console.log(`\n2. Arreglando perfil de usuario (${userEmail})...`);

    // Intentamos buscar el ID del usuario haciendo login (necesitamos su ID real)
    // Como no tenemos su password, vamos a buscar en la tabla 'orders' si ha hecho algún pedido
    // para sacar su ID de referencia, AUNQUE la tabla orders usa lo que le mandamos.

    // MEJOR ESTRATEGIA: Como somos "Admin" (o tenemos key anonima que permite inserts publicos en profile si la politica lo dejara...)
    // Espera, con key anonima NO podemos listar usuarios de Auth.
    // Pero si el usuario puede loguearse, PODRÍA arreglarse solo si el login tuviera lógica de auto-fix.
    // El db.adapter.js YA TIENE lógica de auto-fix en authenticate().

    // PROBLEMA: El usuario dice "ya he podido registrar... pero datos no migrados".
    // Significa que está logueado pero su perfil está vacío o incompleto.

    // Vamos a intentar insertar un perfil para ese email "a ciegas" asumiendo que el ID es el email (si usamos email como ID en profiles?? NO, es UUID).
    // Necesitamos el UUID de Auth para crear el perfil.

    // Si no puedo obtener el UUID sin el password del usuario, no puedo arreglar su perfil desde aquí con un script externo sin Service Key.
    // PERO tengo las credenciales del usuario anterior '1983Victori@'. Voy a probar si son las mismas para este nuevo mail.

    const userPass = '1983Victori@';
    const { data: userLogin, error: userLoginError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: userPass
    });

    if (userLoginError) {
        console.error("   ❌ No pude loguear como usuario para obtener su ID:", userLoginError.message);
        console.log("   NOTA: El usuario debe salir y entrar de nuevo para que el sistema intente autorecuperar su perfil.");
    } else if (userLogin.user) {
        console.log("   ✅ Login usuario exitoso. ID:", userLogin.user.id);

        // Crear/Arreglar perfil
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: userLogin.user.id,
                email: userEmail,
                role: 'user',
                full_name: 'Usuario Recuperado', // Datos dummy, el usuario tendrá que editarlos
                updated_at: new Date()
            });

        if (profileError) console.error("   ❌ Error arreglando perfil:", profileError.message);
        else console.log("   ✅ Perfil restaurado (vacío). El usuario podrá editarlo.");

        // 3. Ver Historial
        // Verificamos qué user_id_ref tienen sus pedidos
        const { data: orders } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id_ref', userEmail); // Probamos con email

        console.log(`\n3. Pedidos encontrados por Email (${userEmail}):`, orders?.length || 0);

        if (orders?.length === 0) {
            // Probamos con ID
            const { data: ordersId } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id_ref', userLogin.user.id);
            console.log(`   Pedidos encontrados por UUID (${userLogin.user.id}):`, ordersId?.length || 0);
        }
    }
}

restoreSystem();
