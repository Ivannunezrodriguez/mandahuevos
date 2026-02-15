
import { DbAdapter } from './db.adapter';
import { AdminService } from './admin.service';

export const PRODUCTS = [
    // Cartones Individuales
    { id: 'carton-xxl', name: 'Cartón XXL (20 uds)', price: 7.50, category: 'individual', image: '🥚', eggsPerUnit: 20 },
    { id: 'carton-l', name: 'Cartón L (30 uds)', price: 8.50, category: 'individual', image: '🥚', eggsPerUnit: 30 },
    { id: 'carton-m', name: 'Cartón M (30 uds)', price: 7.50, category: 'individual', image: '🥚', eggsPerUnit: 30 },

    // Ofertas Exclusivas
    { id: 'oferta-3-xxl', name: 'Oferta: 3 Cartones XXL', price: 20.00, category: 'offer', image: '🔥', eggsPerUnit: 60 },
    { id: 'oferta-3-l', name: 'Oferta: 3 Cartones L', price: 25.00, category: 'offer', image: '🔥', eggsPerUnit: 90 },
    { id: 'oferta-3-m', name: 'Oferta: 3 Cartones M', price: 20.00, category: 'offer', image: '🔥', eggsPerUnit: 90 },

    // Packs Ahorro
    { id: 'pack-6-xxl', name: 'Pack 6 Cartones XXL', price: 42.00, category: 'pack', image: '📦', eggsPerUnit: 120 },
    { id: 'pack-6-l', name: 'Pack 6 Cartones L', price: 48.00, category: 'pack', image: '📦', eggsPerUnit: 180 },
    { id: 'pack-6-m', name: 'Pack 6 Cartones M', price: 42.00, category: 'pack', image: '📦', eggsPerUnit: 180 },
    { id: 'pack-12-xxl', name: 'Pack 12 Cartones XXL', price: 75.00, category: 'pack', image: '🚛', eggsPerUnit: 240 },
    { id: 'pack-12-l', name: 'Pack 12 Cartones L', price: 85.00, category: 'pack', image: '🚛', eggsPerUnit: 360 },
    { id: 'pack-12-m', name: 'Pack 12 Cartones M', price: 75.00, category: 'pack', image: '🚛', eggsPerUnit: 360 },
];

export const LOGISTICS_INFO = {
    schedule: "18:30 - 21:00",
    zones: [
        { days: "Lunes y Miércoles", daysNum: [1, 3], areas: ["Illescas", "Casarrubuelos"] },
        { days: "Martes", daysNum: [2], areas: ["Ugena", "Yuncos", "Viso", "Cedillo"] },
        { days: "Jueves", daysNum: [4], areas: ["Seseña", "Yeles", "Esquivias"] }
    ]
};

// Helper para obtener todas las poblaciones
export const ALL_TOWNS = LOGISTICS_INFO.zones.flatMap(z => z.areas).sort();

// Helper para obtener días de una población
export const getDeliveryDaysForTown = (town) => {
    const zone = LOGISTICS_INFO.zones.find(z => z.areas.includes(town));
    return zone ? zone.daysNum : [];
};

export const OrderService = {
    getProducts: () => PRODUCTS,
    getLogistics: () => LOGISTICS_INFO,

    createOrder: async (orderData) => {
        // Delegar en el adaptador (Supabase o Local)
        const order = await DbAdapter.createOrder(orderData);

        // Notificar al administrador
        try {
            await AdminService.notifyNewOrder(order);
        } catch (e) {
            console.error('Error al notificar pedido:', e);
        }

        return order;
    },

    getUserOrders: async (userId) => {
        // Delegar en el adaptador (Supabase o Local)
        return await DbAdapter.getUserOrders(userId);
    },

    getRecurringSuggestion: async (userId) => {
        // Ahora es async porque getUserOrders lo es
        const orders = await OrderService.getUserOrders(userId);
        if (orders.length === 0) return null;

        const lastOrder = orders[0];
        const validItems = lastOrder.items.filter(item =>
            PRODUCTS.some(p => p.id === item.id)
        );

        if (validItems.length === 0) return null;

        return {
            items: validItems,
            lastDate: lastOrder.createdAt
        };
    }
};
