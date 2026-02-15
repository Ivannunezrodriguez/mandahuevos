
// Script de Verificación de Lógica de Negocio
// Ejecutar con: node src/verify_logic.js

const PRODUCTS = [
    { id: 'carton-xxl', price: 7.50 },
    { id: 'oferta-3-xxl', price: 20.00 }, // 3 Cartones XXL
    { id: 'pack-6-l', price: 48.00 }      // 6 Cartones L
];

// 1. Verificación de Descuentos
console.log("--- TEST 1: CÁLCULO DE DESCUENTOS ---");
function calculateTotal(cart, discountPercent) {
    const subtotal = Object.entries(cart).reduce((total, [productId, quantity]) => {
        const product = PRODUCTS.find(p => p.id === productId);
        return total + (product ? product.price * quantity : 0);
    }, 0);

    if (discountPercent > 0) {
        return subtotal * ((100 - discountPercent) / 100);
    }
    return subtotal;
}

const cart = { 'oferta-3-xxl': 1, 'carton-xxl': 1 }; // 20.00 + 7.50 = 27.50
const discount = 10; // 10%
const total = calculateTotal(cart, discount);
const expected = 27.50 * 0.90; // 24.75

console.log(`Subtotal: 27.50, Descuento: 10%`);
console.log(`Total Calculado: ${total.toFixed(2)}`);
console.log(`Total Esperado:  ${expected.toFixed(2)}`);
console.log(Math.abs(total - expected) < 0.01 ? "✅ PASSED" : "❌ FAILED");

// 2. Verificación de Lógica de Inventario (Mapeo)
console.log("\n--- TEST 2: DEDUCCIÓN DE STOCK (MAPEO) ---");

const PRODUCT_MAPPING = {
    'oferta-3-xxl': { base: 'carton-xxl', qty: 3 },
    'pack-6-l': { base: 'carton-l', qty: 6 },
    'carton-xxl': { base: 'carton-xxl', qty: 1 }
};

function getStockDeduction(orderItems) {
    const deductions = {};
    for (const item of orderItems) {
        const mapping = PRODUCT_MAPPING[item.id];
        if (mapping) {
            const totalToDeduct = item.quantity * mapping.qty;
            deductions[mapping.base] = (deductions[mapping.base] || 0) + totalToDeduct;
        }
    }
    return deductions;
}

const orderItems = [
    { id: 'oferta-3-xxl', quantity: 2 }, // 2 * 3 = 6 XXL
    { id: 'carton-xxl', quantity: 1 },   // 1 * 1 = 1 XXL
    { id: 'pack-6-l', quantity: 1 }      // 1 * 6 = 6 L
];
// Esperado: XXL = 7, L = 6

const result = getStockDeduction(orderItems);
console.log("Items del Pedido:", orderItems);
console.log("Deducciones calculadas:", result);

const passedXXL = result['carton-xxl'] === 7;
const passedL = result['carton-l'] === 6;

if (passedXXL && passedL) {
    console.log("✅ PASSED: La lógica de descomposición de packs funciona correctamente.");
} else {
    console.log("❌ FAILED: El cálculo de stock falló.");
}
