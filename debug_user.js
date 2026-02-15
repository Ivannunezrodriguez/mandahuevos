
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dthxbrybixrwgtvptiam.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0aHhicnliaXhyd2d0dnB0aWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MzIwMzksImV4cCI6MjA4NjIwODAzOX0.RV_4D6PcWBwO7eiw7rjlzCchXV8_VKNH4PR25uFfn5k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
    console.log("Comprobando usuario ivannr20@gmail.com...");

    // Intentamos login con el password que se ve en la captura (si es visible/deducible)
    // En la captura se ve "1983Victori@" parcialmente o se intuye, pero no es seguro. 
    // Lo mejor es probar login y ver el error exacto.
    // OJO: NO debo usar contraseñas reales de usuarios si no me las dan explícitamente.
    // La captura muestra "1983Victori..." en ambos campos.

    const email = 'ivannr20@gmail.com';
    const passwordAttempt = '1983Victori@'; // Intento basado en la captura para debug

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: passwordAttempt
    });

    if (error) {
        console.log("Login Fallido:");
        console.log("Mensaje:", error.message);
        console.log("Status:", error.status);
    } else {
        console.log("Login Exitoso!");
        console.log("User ID:", data.user.id);
        console.log("Confirmado:", data.user.email_confirmed_at);
    }
}

checkUser();
