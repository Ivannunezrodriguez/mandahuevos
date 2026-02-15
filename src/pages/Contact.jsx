
import { MapPin, Phone, Envelope, WhatsappLogo } from 'phosphor-react';

export function Contact() {
    return (
        <div>
            <h2 style={{ marginBottom: '2rem' }}>Contacto</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="glass-card">
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-accent-primary)' }}>Nuestras Oficinas</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <MapPin size={24} color="#fbbf24" weight="fill" />
                            <div>
                                <div style={{ fontWeight: 600 }}>Ubicación</div>
                                <div style={{ color: 'var(--color-text-secondary)' }}>Madrid / Toledo, España</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <WhatsappLogo size={24} color="#25D366" weight="fill" />
                            <div>
                                <div style={{ fontWeight: 600 }}>Pedidos WhatsApp</div>
                                <a href="https://wa.me/34691562824" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
                                    +34 691 562 824
                                </a>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Envelope size={24} color="#fbbf24" weight="fill" />
                            <div>
                                <div style={{ fontWeight: 600 }}>Email</div>
                                <a href="mailto:ventas@mandamoshuevos.com" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>ventas@mandamoshuevos.com</a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ color: 'var(--color-accent-primary)' }}>Aviso Legal y Privacidad</h3>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
                        Al realizar un pedido a través de nuestro sitio web o por WhatsApp, aceptas los términos y condiciones.
                        Mandamoshuevos es un negocio dedicado a la venta de huevos frescos de granja.
                    </p>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
                        <strong>Política de Privacidad:</strong> Tus datos serán tratados únicamente para la gestión de pedidos y facturación. No compartimos información con terceros salvo obligación legal.
                    </p>
                    <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        &copy; {new Date().getFullYear()} Mandamoshuevos. Reservados todos los derechos.
                    </div>
                </div>
            </div>
        </div>
    );
}
