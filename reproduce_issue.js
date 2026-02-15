
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dthxbrybixrwgtvptiam.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0aHhicnliaXhyd2d0dnB0aWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MzIwMzksImV4cCI6MjA4NjIwODAzOX0.RV_4D6PcWBwO7eiw7rjlzCchXV8_VKNH4PR25uFfn5k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOrderCreation() {
    console.log("Testing order creation...");

    const orderData = {
        userId: 'test-user-id@example.com', // Simulate email as ID
        total: 100.50,
        deliveryDate: '2026-03-01',
        paymentMethod: 'transfer',
        invoiceNumber: `INV-TEST-${Date.now()}`
    };

    try {
        // 1. Insert Order Header
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([{
                user_id_ref: orderData.userId,
                total: orderData.total,
                delivery_date: orderData.deliveryDate,
                payment_method: orderData.paymentMethod,
                status: 'pending',
                invoice_number: orderData.invoiceNumber
            }])
            .select()
            .single();

        if (orderError) {
            console.error('Error inserting order header:', orderError);
            return;
        }

        console.log('Order created successfully:', order);

        // 2. Insert Order Items
        const items = [
            {
                order_id: order.id,
                product_id: 'carton-xxl',
                quantity: 2,
                price_at_purchase: 20.00
            }
        ];

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(items);

        if (itemsError) {
            console.error('Error inserting items:', itemsError);
        } else {
            console.log('Items inserted successfully.');
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testOrderCreation();
