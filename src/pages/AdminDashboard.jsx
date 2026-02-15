
import { useState, useEffect, useMemo } from 'react';
import { DbAdapter } from '../services/db.adapter';
import { AdminService } from '../services/admin.service';
import { OrderService } from '../services/order.service';
import {
    Package,
    Truck,
    CheckCircle,
    FilePdf,
    Storefront,
    Warning,
    CaretRight,
    CaretDown,
    Egg,
    ArrowCircleUp,
    ArrowCircleDown,
    User,
    ChartBar,
    MagnifyingGlass,
    DownloadSimple,
    Envelope,
    Funnel
} from 'phosphor-react';

import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/auth.service';

export function AdminDashboard() {
    const [orders, setOrders] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'inventory', 'stats', 'users'
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [selectedOrders, setSelectedOrders] = useState(new Set());

    // Filters
    const [filterText, setFilterText] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const navigate = useNavigate();

    useEffect(() => {
        checkAdminAndLoad();
    }, []);

    const checkAdminAndLoad = async () => {
        const user = AuthService.getCurrentUser();
        if (!user || user.role !== 'admin') {
            console.warn('Acceso denegado');
            navigate('/');
            return;
        }
        await loadData();
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const [ordersData, inventoryData, profilesData] = await Promise.all([
                DbAdapter.getAllOrders(),
                DbAdapter.getInventory(),
                DbAdapter.getAllProfiles()
            ]);

            // Sort Inventory by ID to prevent jumping
            const sortedInventory = [...inventoryData].sort((a, b) => a.product_id.localeCompare(b.product_id));

            setOrders(ordersData);
            setInventory(sortedInventory);
            setUsers(profilesData);
        } catch (error) {
            console.error('Error loading admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- LOGIC: ORDERS ---

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesText =
                (order.invoiceNumber && order.invoiceNumber.toLowerCase().includes(filterText.toLowerCase())) ||
                (order.userId && order.userId.toLowerCase().includes(filterText.toLowerCase()));

            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

            return matchesText && matchesStatus;
        });
    }, [orders, filterText, statusFilter]);

    const handleStatusUpdate = async (orderId, newStatus) => {
        if (!window.confirm('¿Confirmar cambio de estado?')) return;
        try {
            // LOGICA DE INVENTARIO: Si confirmamos pedido, restamos stock
            if (newStatus === 'confirmed') {
                const order = orders.find(o => o.id === orderId);
                if (order) {
                    console.log("Restando stock para pedido:", order.id);

                    // MAPA DE DESCOMPOSICIÓN DE OFERTAS
                    const PRODUCT_MAPPING = {
                        'oferta-3-xxl': { base: 'carton-xxl', qty: 3 },
                        'oferta-3-l': { base: 'carton-l', qty: 3 },
                        'oferta-3-m': { base: 'carton-m', qty: 3 },
                        'pack-6-xxl': { base: 'carton-xxl', qty: 6 },
                        'pack-6-l': { base: 'carton-l', qty: 6 },
                        'pack-6-m': { base: 'carton-m', qty: 6 },
                        'pack-12-xxl': { base: 'carton-xxl', qty: 12 },
                        'pack-12-l': { base: 'carton-l', qty: 12 },
                        'pack-12-m': { base: 'carton-m', qty: 12 },
                        // Base products map to themselves x1
                        'carton-xxl': { base: 'carton-xxl', qty: 1 },
                        'carton-l': { base: 'carton-l', qty: 1 },
                        'carton-m': { base: 'carton-m', qty: 1 }
                    };

                    // Ejecutar actualizaciones
                    const updates = [];
                    for (const item of order.items) {
                        const mapping = PRODUCT_MAPPING[item.id];
                        if (mapping) {
                            // Si es una oferta/pack, restamos X veces la cantidad del item
                            // Ejemplo: 2 Packs de 6 XXL = 2 * 6 = 12 cartones XXL restados
                            const totalToDeduct = item.quantity * mapping.qty;
                            updates.push(DbAdapter.updateStock(mapping.base, -totalToDeduct));
                        } else {
                            // Fallback por si acaso (items desconocidos)
                            console.warn("Producto sin mapeo de stock:", item.id);
                        }
                    }
                    await Promise.all(updates);
                }
            }

            await DbAdapter.updateOrderStatus(orderId, newStatus);
            await loadData(); // Recargar todo (incluido inventario actualizado)
        } catch (error) {
            console.error("Error updating status:", error);
            alert('Error al actualizar estado: ' + error.message);
        }
    };

    const handleUpdateDiscount = async (userId, newDiscount) => {
        const val = parseInt(newDiscount, 10);
        if (isNaN(val) || val < 0) return;
        try {
            await DbAdapter.updateUserDiscount(userId, val);
            // Actualizar estado local
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, discount_percent: val } : u));
        } catch (e) {
            alert("Error al actualizar descuento");
        }
    };

    const handleDownloadPDF = async (order) => {
        try {
            const profile = await DbAdapter.getUserById(order.userId);
            await AdminService.generateDeliveryNote(order, profile || { full_name: order.userId, email: order.userId });
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    // Bulk selection
    const toggleSelectOrder = (orderId) => {
        const newSet = new Set(selectedOrders);
        if (newSet.has(orderId)) newSet.delete(orderId);
        else newSet.add(orderId);
        setSelectedOrders(newSet);
    };

    const handleBulkDownload = async () => {
        if (selectedOrders.size === 0) return;
        const ordersToPrint = orders.filter(o => selectedOrders.has(o.id));
        await AdminService.generateBulkDeliveryNotes(ordersToPrint);
        setSelectedOrders(new Set()); // Clear selection
    };

    const toggleSelectAll = () => {
        if (selectedOrders.size === filteredOrders.length) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
        }
    };

    // --- LOGIC: INVENTORY ---

    const handleStockUpdate = async (productId, delta) => {
        try {
            await DbAdapter.updateStock(productId, delta);
            // Manually update local state to avoid full reload jumpiness, but keep sort
            setInventory(prev => {
                const map = prev.map(item => item.product_id === productId
                    ? { ...item, stock_quantity: item.stock_quantity + delta }
                    : item
                );
                return map; // Order is preserved as map doesn't reorder
            });
        } catch (error) {
            alert('Error al actualizar stock');
        }
    };

    // --- LOGIC: STATS ---
    const stats = useMemo(() => {
        const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
        const totalOrders = orders.length;

        // Sales by Month (Simple Object)
        const salesByMonth = {};
        orders.forEach(o => {
            const month = new Date(o.createdAt).toLocaleString('default', { month: 'short' });
            salesByMonth[month] = (salesByMonth[month] || 0) + o.total;
        });

        // Top Products
        const productCounts = {};
        orders.forEach(o => {
            o.items.forEach(i => {
                productCounts[i.id] = (productCounts[i.id] || 0) + i.quantity;
            });
        });

        // Top Towns (Naive parsing)
        const townCounts = {};
        users.forEach(u => {
            if (u.address) {
                // Heuristic: Last part of address usually contains town or zip
                // For demo, we just group by non-empty address existence or specific keywords if found
                const addressLower = u.address.toLowerCase();
                let town = 'Desconocido';
                if (addressLower.includes('illescas')) town = 'Illescas';
                else if (addressLower.includes('ugena')) town = 'Ugena';
                else if (addressLower.includes('madrid')) town = 'Madrid';
                else town = 'Otros';

                townCounts[town] = (townCounts[town] || 0) + 1;
            }
        });

        return { totalRevenue, totalOrders, salesByMonth, productCounts, townCounts };
    }, [orders, users]);

    if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '5rem' }}>Cargando panel...</div>;

    const products = OrderService.getProducts();

    return (
        <div className="container" style={{ paddingBottom: '5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Package size={40} className="text-gold" />
                <div>
                    <h1 style={{ margin: 0 }}>Panel de Administración</h1>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>Gestión integral de Mandahuevos</p>
                </div>
            </div>

            {/* TABS */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', overflowX: 'auto' }}>
                {[
                    { id: 'orders', icon: Truck, label: `Pedidos (${orders.length})` },
                    { id: 'inventory', icon: Storefront, label: 'Inventario' },
                    { id: 'stats', icon: ChartBar, label: 'Estadísticas' },
                    { id: 'users', icon: User, label: `Usuarios (${users.length})` },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            background: activeTab === tab.id ? 'var(--color-accent-primary)' : 'transparent',
                            color: activeTab === tab.id ? 'var(--color-bg-primary)' : 'var(--color-text-primary)',
                            padding: '0.75rem 1.25rem',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <tab.icon size={20} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* --- TAB: ORDERS --- */}
            {activeTab === 'orders' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Filters & Actions */}
                    <div className="glass-card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                            <MagnifyingGlass size={20} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                            <input
                                type="text"
                                placeholder="Buscar por cliente o factura..."
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                style={{ width: '100%', paddingLeft: '2.5rem', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Funnel size={20} />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{ background: 'var(--color-bg-primary)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', color: 'white' }}
                            >
                                <option value="all">Todos los estados</option>
                                <option value="pending">Pendientes</option>
                                <option value="confirmed">Confirmados</option>
                                <option value="delivered">Entregados</option>
                            </select>
                        </div>
                        {selectedOrders.size > 0 && (
                            <button
                                onClick={handleBulkDownload}
                                className="btn-primary"
                                style={{ background: '#3b82f6', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                            >
                                <DownloadSimple size={20} /> Descargar Seleccionados ({selectedOrders.size})
                            </button>
                        )}
                        <div style={{ marginLeft: 'auto' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                                    onChange={toggleSelectAll}
                                />
                                Seleccionar Todo
                            </label>
                        </div>
                    </div>

                    {filteredOrders.length === 0 && <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>No hay pedidos que coincidan.</p>}

                    {filteredOrders.map(order => (
                        <div key={order.id} className="glass-card" style={{ padding: '1rem', borderLeft: selectedOrders.has(order.id) ? '4px solid var(--color-accent-primary)' : '4px solid transparent' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedOrders.has(order.id)}
                                        onChange={() => toggleSelectOrder(order.id)}
                                        style={{ transform: 'scale(1.2)' }}
                                    />
                                    <div style={{ cursor: 'pointer' }} onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {expandedOrder === order.id ? <CaretDown /> : <CaretRight />}
                                            <span style={{ fontWeight: 600, color: 'var(--color-accent-primary)' }}>{order.invoiceNumber}</span>
                                            <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>{new Date(order.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div style={{ marginLeft: '1.5rem', fontSize: '0.9rem' }}>
                                            {order.userId}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span style={{
                                        padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                                        background: order.status === 'pending' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                        color: order.status === 'pending' ? '#fbbf24' : '#34d399'
                                    }}>
                                        {order.status.toUpperCase()}
                                    </span>
                                    <button onClick={() => handleDownloadPDF(order)} style={{ background: 'transparent', color: '#3b82f6' }} title="Albarán PDF"><FilePdf size={24} /></button>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedOrder === order.id && (
                                <div style={{ marginLeft: '2.5rem', marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                    <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Items:</div>
                                    {order.items.map((item, idx) => {
                                        const p = products.find(prod => prod.id === item.id);
                                        return (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0.2rem 0' }}>
                                                <span>{item.quantity} x {p?.name || item.id}</span>
                                                <span>{(item.price * item.quantity).toFixed(2)} €</span>
                                            </div>
                                        );
                                    })}
                                    <div style={{ marginTop: '0.5rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-accent-primary)' }}>
                                        Total: {order.total.toFixed(2)} €
                                    </div>
                                    {order.status === 'pending' && (
                                        <div style={{ marginTop: '1rem' }}>
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                                                className="btn-primary"
                                                style={{ width: '100%', background: 'var(--color-success)' }}
                                            >
                                                Confirmar Pedido
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* --- TAB: INVENTORY --- */}
            {activeTab === 'inventory' && (
                <div className="glass-card">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--color-border)' }}>
                                <th style={{ padding: '1rem' }}>Producto</th>
                                <th style={{ padding: '1rem' }}>Stock</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Ajuste</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.map(item => {
                                const p = products.find(prod => prod.id === item.product_id);
                                const isLowStock = item.stock_quantity <= item.min_stock_alert;
                                return (
                                    <tr key={item.product_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Egg size={24} weight="fill" color={isLowStock ? 'var(--color-error)' : 'var(--color-accent-primary)'} />
                                                <div>
                                                    <div style={{ fontWeight: 'bold' }}>{p?.name || item.product_id}</div>
                                                    {isLowStock && <div style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>STOCK BAJO</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{item.stock_quantity}</span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button onClick={() => handleStockUpdate(item.product_id, -10)} style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}><ArrowCircleDown size={24} /></button>
                                                <button onClick={() => handleStockUpdate(item.product_id, 10)} style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}><ArrowCircleUp size={24} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- TAB: STATS --- */}
            {activeTab === 'stats' && (
                <div style={{ display: 'grid', gap: '2rem' }}>
                    {/* KPIs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-accent-primary)' }}>{stats.totalRevenue.toFixed(0)} €</div>
                            <div style={{ color: 'var(--color-text-secondary)' }}>Ingresos Totales</div>
                        </div>
                        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{stats.totalOrders}</div>
                            <div style={{ color: 'var(--color-text-secondary)' }}>Pedidos Totales</div>
                        </div>
                        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ec4899' }}>{users.length}</div>
                            <div style={{ color: 'var(--color-text-secondary)' }}>Clientes Registrados</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                        {/* Sales Chart */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3>Ventas Mensuales</h3>
                            <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '1rem', paddingTop: '1rem' }}>
                                {Object.entries(stats.salesByMonth).map(([month, value]) => (
                                    <div key={month} style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{
                                            background: 'var(--color-accent-primary)',
                                            height: `${Math.min((value / (stats.totalRevenue || 1)) * 300, 150)}px`,
                                            borderRadius: '4px 4px 0 0',
                                            transition: 'height 0.3s'
                                        }}></div>
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>{month}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Products */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3>Top Productos</h3>
                            {Object.entries(stats.productCounts).map(([pid, count]) => {
                                const p = products.find(prod => prod.id === pid);
                                return (
                                    <div key={pid} style={{ marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <span>{p?.name || pid}</span>
                                            <span>{count} uds</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                                            <div style={{ height: '100%', width: `${Math.min((count / 50) * 100, 100)}%`, background: '#3b82f6', borderRadius: '4px' }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB: USERS --- */}
            {activeTab === 'users' && (
                <div className="glass-card">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--color-border)' }}>
                                <th style={{ padding: '1rem' }}>Usuario</th>
                                <th style={{ padding: '1rem' }}>Contacto</th>
                                <th style={{ padding: '1rem' }}>Descuento General</th>
                                <th style={{ padding: '1rem' }}>Rol</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <strong>{u.full_name || 'Sin Nombre'}</strong>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Unido: {new Date(u.updated_at || Date.now()).toLocaleDateString()}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div>{u.email}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{u.phone || 'Sin télefono'}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                defaultValue={u.discount_percent || 0}
                                                onBlur={(e) => handleUpdateDiscount(u.id, e.target.value)}
                                                style={{ width: '60px', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: '#374151', color: 'white', textAlign: 'center' }}
                                            />
                                            <span>%</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem',
                                            background: u.role === 'admin' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255,255,255,0.1)',
                                            color: u.role === 'admin' ? '#ec4899' : 'var(--color-text-secondary)'
                                        }}>
                                            {u.role ? u.role.toUpperCase() : 'USER'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <a
                                            href={`mailto:${u.email}?subject=Oferta Especial Mandahuevos&body=Hola ${u.full_name || ''}, tienes un descuento especial del ${u.discount_percent || 0}% en tu próxima compra...`}
                                            className="btn-primary"
                                            style={{ textDecoration: 'none', fontSize: '0.9rem', padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            <Envelope size={18} /> Contactar
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
