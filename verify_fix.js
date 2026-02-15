
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dthxbrybixrwgtvptiam.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0aHhicnliaXhyd2d0dnB0aWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MzIwMzksImV4cCI6MjA4NjIwODAzOX0.RV_4D6PcWBwO7eiw7rjlzCchXV8_VKNH4PR25uFfn5k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyFix() {
    console.log("Verificando corrección...");

    const email = `test-${Date.now()}@example.com`;
    const password = 'password123';

    try {
        // 1. Registrar/Login Usuario Temporal
        console.log("1. Creando usuario temporal...");
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            console.error('Error al registrar usuario:', authError);
            return;
        }

        const user = authData.user;
        console.log('Usuario creado:', user.email);

        // 2. Crear Pedido (Con la sesión del usuario)
        console.log("2. Intentando crear pedido...");

        const orderData = {
            user_id_ref: user.email, // El campo que usa la política para validar
            total: 50.00,
            delivery_date: '2026-03-01',
            payment_method: 'transfer',
            status: 'pending',
            invoice_number: `INV-VERIFY-${Date.now()}`
        };

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([orderData])
            .select()
            .single();

        if (orderError) {
            console.error('❌ FALLO al crear pedido:', orderError);
        } else {
            console.log('✅ ÉXITO: Pedido creado correctamente:', order.id);
            console.log("La corrección de políticas RLS funciona correctamente.");
        }

    } catch (err) {
        console.error('Error inesperado:', err);
    }
}

verifyFix();
