import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'es';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header & Nav
    'nav.home': 'Home',
    'nav.wallet': 'Digital Wallet',
    'nav.stores': 'Store Directory',
    'nav.map': 'Map & Route',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.logout': 'Logout',
    'nav.member': 'Member',
    'nav.merchant': 'Merchant',
    'nav.pin_active': 'PIN Active',
    'nav.terminal_mode': 'Merchant Terminal Mode Active',
    'nav.multi_store_network': 'Multi-Store Network',
    'nav.notifications': 'Notifications',
    'nav.switch_lang': 'Español',

    // Home
    'home.badge': 'Next-Generation Multi-Store Loyalty Platform',
    'home.hero_title_1': 'One Digital Wallet.',
    'home.hero_title_2': 'Endless Local Rewards.',
    'home.hero_desc': 'OmniLoyalty connects members with local coffee shops, boutiques, grocery stores, and dining spots. Store all your reward points, dynamic QR pass, and digital discount vouchers in one seamless digital wallet.',
    'home.btn_register': 'Member Sign Up / Register',
    'home.btn_signin': 'Member Sign In',
    'home.btn_merchant': 'Merchant Login',
    'home.stat_stores': 'Partner Network',
    'home.stat_rate': 'Standard Earn Rate',
    'home.stat_tiers': 'Bronze to Platinum',
    'home.stat_instant': '100% Instant',
    'home.stat_instant_sub': 'Real-Time QR Scans',
    'home.features_title': 'Why Choose OmniLoyalty',
    'home.features_subtitle': 'A unified customer loyalty network built for modern shoppers and thriving neighborhood merchants.',
    'home.feat_1_title': 'Unified Digital Pass',
    'home.feat_1_desc': 'One QR code works at every participating store. No more carrying 10 different punch cards.',
    'home.feat_2_title': 'Interactive Store Map',
    'home.feat_2_desc': 'Discover nearby participating merchants, view perks, and get real-time turn-by-turn walking or driving navigation.',
    'home.feat_3_title': 'Tiered Perks & Vouchers',
    'home.feat_3_desc': 'Level up from Bronze to Platinum as you earn. Unlock free items, percentage discounts, and VIP store access.',
    'home.feat_4_title': 'Merchant POS Scanner',
    'home.feat_4_desc': 'Businesses can scan customer passes instantly, issue reward points, redeem vouchers, and broadcast promos.',
    'home.feat_5_title': '5-Digit PIN Security',
    'home.feat_5_desc': 'Authorizations and reward redemptions are protected with your personal 5-digit security PIN.',
    'home.feat_6_title': 'Push Notifications',
    'home.feat_6_desc': 'Receive instant notifications for earned points, new tier achievements, and exclusive flash discounts.',
    'home.featured_stores': 'Featured Partner Stores',
    'home.featured_stores_desc': 'Explore local businesses where you can earn and redeem points today.',
    'home.view_all_stores': 'View All Stores',
    'home.merchant_cta_title': 'Are You a Local Business Owner?',
    'home.merchant_cta_desc': 'Join the OmniLoyalty merchant network to issue points, reward loyal regulars, and broadcast special promotions directly to nearby shoppers.',
    'home.merchant_cta_btn': 'Access Merchant Terminal',

    // Digital Wallet
    'wallet.omnipass_title': 'OmniPass Digital Membership',
    'wallet.show_pass': 'Show Pass',
    'wallet.copy_id': 'Copy Pass ID',
    'wallet.copied': 'Copied!',
    'wallet.points_balance': 'Available Balance',
    'wallet.lifetime_points': 'Lifetime Points',
    'wallet.tier_progress': 'Tier Progress',
    'wallet.tier_pts_to': 'points to',
    'wallet.tier_max': 'Maximum Platinum Tier Reached',
    'wallet.quick_actions': 'Quick Actions',
    'wallet.btn_scan_earn': 'Scan & Earn Points',
    'wallet.btn_scan_earn_desc': 'Scan store barcode or enter receipt total',
    'wallet.btn_find_stores': 'Find Nearby Stores',
    'wallet.btn_find_stores_desc': 'Explore partner businesses on the map',
    'wallet.btn_redeem_rewards': 'Browse Rewards Catalog',
    'wallet.btn_redeem_rewards_desc': 'Exchange points for discounts & vouchers',
    'wallet.vouchers_title': 'My Active Reward Vouchers',
    'wallet.vouchers_empty': 'No active vouchers yet. Redeem your points at partner stores!',
    'wallet.voucher_expires': 'Expires:',
    'wallet.voucher_use': 'Use Voucher',
    'wallet.transactions_title': 'Recent Points Activity',
    'wallet.filter_all': 'All',
    'wallet.filter_earned': 'Earned',
    'wallet.filter_redeemed': 'Redeemed',
    'wallet.tx_empty': 'No transactions recorded yet.',
    'wallet.qr_modal_title': 'Your OmniLoyalty QR Pass',
    'wallet.qr_modal_desc': 'Present this QR code to the cashier at checkout to earn points or redeem rewards.',
    'wallet.security_notice': 'Protected with 5-digit PIN authorization',

    // Store Finder
    'stores.search_placeholder': 'Search by store name, cuisine, category or city...',
    'stores.cat_all': 'All Stores',
    'stores.cat_coffee': 'Coffee & Tea',
    'stores.cat_fashion': 'Fashion & Apparel',
    'stores.cat_grocery': 'Grocery & Market',
    'stores.cat_electronics': 'Electronics & Gadgets',
    'stores.cat_dining': 'Dining & Bistro',
    'stores.cat_wellness': 'Wellness & Spa',
    'stores.results_count': 'partner locations found',
    'stores.points_rate': 'pts / $1 spent',
    'stores.open_hours': 'Hours:',
    'stores.phone': 'Phone:',
    'stores.get_directions': 'Get Directions',
    'stores.view_rewards': 'View Rewards',
    'stores.featured_reward': 'Featured Perk:',
    'stores.no_results': 'No stores match your search criteria. Try a different filter or keyword.',

    // Interactive Map & Navigation
    'map.title': 'Interactive Store Map & Route Navigation',
    'map.desc': 'View nearby partner locations and receive real-time turn-by-turn routing.',
    'map.walking': 'Walking',
    'map.driving': 'Driving',
    'map.biking': 'Biking',
    'map.start_nav': 'Start Route Navigation',
    'map.exit_nav': 'Exit Navigation',
    'map.directions_to': 'Directions to',
    'map.est_time': 'Est. Travel Time',
    'map.distance': 'Distance',
    'map.steps': 'Route Steps',
    'map.current_location': 'Your Location (Simulated)',
    'map.destination': 'Destination',

    // Scan & Earn Modal
    'scan.title': 'Scan & Earn / Redeem Points',
    'scan.desc': 'Generate an instant point-earning request or redeem your vouchers at checkout.',
    'scan.tab_earn': 'Earn Points',
    'scan.tab_redeem': 'Redeem Points',
    'scan.select_store': 'Select Partner Store:',
    'scan.purchase_amount': 'Purchase Amount ($ USD):',
    'scan.points_to_earn': 'Points to be added:',
    'scan.points_to_redeem': 'Points to Redeem:',
    'scan.discount_value': 'Discount Value:',
    'scan.pin_required': '5-Digit PIN Required for Confirmation',
    'scan.btn_confirm_earn': 'Authorize & Add Points',
    'scan.btn_confirm_redeem': 'Authorize & Redeem Points',
    'scan.success_title': 'Transaction Successful!',
    'scan.success_earn_msg': 'Points have been credited to your digital wallet.',
    'scan.success_redeem_msg': 'Discount voucher generated and applied.',
    'scan.close': 'Close',

    // Merchant Dashboard
    'merchant.dashboard_title': 'Merchant POS Terminal & Store Hub',
    'merchant.dashboard_desc': 'Scan customer passes, issue reward points, manage store rewards, and broadcast push notifications.',
    'merchant.stat_points_issued': 'Points Issued Today',
    'merchant.stat_points_redeemed': 'Points Redeemed',
    'merchant.stat_transactions': 'Total Transactions',
    'merchant.stat_est_revenue': 'Estimated POS Revenue',
    'merchant.quick_terminal': 'Open POS Terminal',
    'merchant.quick_rewards': 'Reward Catalog Manager',
    'merchant.quick_broadcast': 'Broadcast Push Promo',
    'merchant.activity_title': 'Live Store Activity Feed',
    'merchant.activity_empty': 'No transactions recorded today yet.',
    'merchant.btn_switch_store': 'Select Active Store Branch:',

    // POS Scanner Terminal
    'pos.title': 'POS Barcode / QR Scanner Terminal',
    'pos.desc': 'Scan customer digital pass QR code to issue points or redeem reward vouchers.',
    'pos.customer_pass_id': 'Customer Pass ID / Username:',
    'pos.scan_simulate': 'Scan Customer QR',
    'pos.sale_amount': 'Total Sale Amount ($):',
    'pos.calculated_points': 'Points to Issue (10 pts/$1):',
    'pos.btn_issue_points': 'Issue Loyalty Points',
    'pos.redeem_tab': 'Redeem Reward Code',
    'pos.voucher_code': 'Enter Voucher Code:',
    'pos.btn_verify_voucher': 'Verify & Redeem Voucher',
    'pos.recent_scans': 'Recent POS Scans',

    // Reward Catalog Manager
    'reward_mgr.title': 'Reward Catalog Manager',
    'reward_mgr.desc': 'Create, edit, and publish digital discount rewards for your store members.',
    'reward_mgr.btn_add': 'Create New Reward',
    'reward_mgr.form_title': 'Reward Item Title:',
    'reward_mgr.form_desc': 'Description:',
    'reward_mgr.form_points': 'Points Cost:',
    'reward_mgr.form_discount': 'Discount Value (e.g. $5 OFF, 20% OFF, Free Drink):',
    'reward_mgr.form_category': 'Category:',
    'reward_mgr.form_tier': 'Minimum Required Tier:',
    'reward_mgr.form_expiry': 'Expiry Days:',
    'reward_mgr.btn_save': 'Save Reward',
    'reward_mgr.btn_delete': 'Delete',
    'reward_mgr.active_rewards': 'Active Store Rewards',

    // Push Notification Broadcaster
    'broadcast.title': 'Push Notification Broadcaster',
    'broadcast.desc': 'Send instant promotional push notifications to your loyal customer base.',
    'broadcast.campaign_title': 'Notification Title:',
    'broadcast.campaign_body': 'Message Content:',
    'broadcast.target_audience': 'Target Audience:',
    'broadcast.target_all': 'All Registered Members',
    'broadcast.target_bronze': 'Bronze Members Only',
    'broadcast.target_silver': 'Silver & Above Members',
    'broadcast.target_gold': 'Gold & Above Members',
    'broadcast.target_platinum': 'Platinum VIP Members Only',
    'broadcast.btn_send': 'Broadcast Notification Now',
    'broadcast.history_title': 'Recent Broadcast History',

    // Login & Register Modal
    'auth.title_login': 'Welcome Back',
    'auth.title_register': 'Create Your Account',
    'auth.desc_login': 'Sign in to access your digital rewards wallet or merchant terminal.',
    'auth.desc_register': 'Join the OmniLoyalty network and start earning points at local stores.',
    'auth.login_title': 'Member Login',
    'auth.register_title': 'Member Registration',
    'auth.merchant_login_title': 'Merchant POS Sign In',
    'auth.merchant_register_title': 'Merchant Partner Registration',
    'auth.login_subtitle': 'Sign in to access your digital wallet & rewards',
    'auth.register_subtitle': 'Create an account to earn points across local partner stores',
    'merchant.terminal_subtitle': 'Sign in to access POS scanning terminal & reward management',
    'auth.tab_member': 'Member',
    'auth.tab_merchant': 'Merchant POS',
    'auth.tab_signin': 'Sign In',
    'auth.tab_signup': 'Register',
    'auth.demo_autofill': 'Quick Demo Autofill',
    'auth.demo_member': 'Member',
    'auth.demo_merchant': 'Merchant',
    'auth.email_or_user': 'Email Address or Username',
    'auth.password': 'Password',
    'auth.confirm_password': 'Confirm Password',
    'auth.full_name': 'Full Name',
    'auth.email_address': 'Email Address',
    'auth.username': 'Username',
    'auth.pin_title': '5-Digit Transaction PIN',
    'auth.pin_required': 'Required',
    'auth.pin_desc': 'This 5-digit code will be requested to authorize important transactions & redemptions.',
    'auth.btn_signing_in': 'Signing In...',
    'auth.btn_signin_wallet': 'Sign In to Digital Wallet',
    'auth.btn_signin_merchant': 'Sign In to Merchant Dashboard',
    'auth.btn_creating_acc': 'Creating Account...',
    'auth.btn_create_member': 'Create Member Account',
    'auth.btn_register_merchant': 'Register Merchant Store',
    'auth.field_username': 'Username:',
    'auth.field_fullname': 'Full Name:',
    'auth.field_email': 'Email Address:',
    'auth.field_password': 'Password:',
    'auth.field_confirm_password': 'Confirm Password:',
    'auth.field_pin': '5-Digit Security PIN (For transaction confirmations):',
    'auth.pin_helper': 'Used to securely authorize reward redemptions and profile changes.',
    'auth.btn_signin': 'Sign In to Account',
    'auth.btn_signup': 'Create Member Account',
    'auth.no_account': "Don't have an account?",
    'auth.has_account': 'Already have an account?',
    'auth.switch_signup': 'Register now',
    'auth.switch_signin': 'Sign in here',
    'auth.verify_title': 'Verify Your Email Address',
    'auth.verify_subtitle': 'Please confirm your email address to activate your account',
    'auth.verify_sent_to': 'We sent a verification link & security code to:',
    'auth.verify_instructions': 'Check your email inbox (and spam folder) to activate your account. You must verify your email before accessing your rewards wallet or merchant terminal.',
    'auth.verify_enter_code': 'Enter 6-Digit Verification Code (Optional):',
    'auth.btn_check_status': 'Check Verification Status',
    'auth.btn_resend_email': 'Resend Verification Email',
    'auth.btn_instant_activate': 'Instant Verify & Activate Account',
    'auth.verify_success': 'Email verified successfully! Account is now active.',
    'auth.verify_pending_error': 'Your account is pending email verification. Please verify your email before logging in.',

    // PIN Verification Modal
    'pin_modal.title': 'Security PIN Verification',
    'pin_modal.desc': 'Please enter your 5-digit security PIN to authorize this action.',
    'pin_modal.btn_confirm': 'Authorize',
    'pin_modal.btn_cancel': 'Cancel',
    'pin_modal.error_invalid': 'Incorrect 5-digit PIN. Please try again.',
    'pin_modal.enter_digits': 'Enter 5 digits',

    // Profile Modal
    'profile.title': 'Account Profile & Security Settings',
    'profile.desc': 'Manage your personal account details and update your 5-digit security PIN.',
    'profile.field_name': 'Full Name:',
    'profile.field_email': 'Email Address:',
    'profile.field_username': 'Username:',
    'profile.field_pass_id': 'OmniPass ID:',
    'profile.field_current_pin': 'Current 5-Digit PIN:',
    'profile.field_new_pin': 'New 5-Digit PIN (Optional):',
    'profile.btn_save': 'Save Changes',
    'profile.success': 'Profile and security PIN updated successfully!',

    // Notification Drawer
    'notif.title': 'Notifications & Alerts',
    'notif.unread': 'unread',
    'notif.mark_all': 'Mark all as read',
    'notif.clear_all': 'Clear all',
    'notif.empty': 'No notifications right now.'
  },
  es: {
    // Header & Nav
    'nav.home': 'Inicio',
    'nav.wallet': 'Billetera Digital',
    'nav.stores': 'Directorio de Tiendas',
    'nav.map': 'Mapa y Ruta',
    'nav.login': 'Iniciar Sesión',
    'nav.register': 'Registrarse',
    'nav.logout': 'Cerrar Sesión',
    'nav.member': 'Miembro',
    'nav.merchant': 'Comerciante',
    'nav.pin_active': 'PIN Activo',
    'nav.terminal_mode': 'Modo Terminal Comerciante Activo',
    'nav.multi_store_network': 'Red Multi-Tiendas',
    'nav.notifications': 'Notificaciones',
    'nav.switch_lang': 'English',

    // Home
    'home.badge': 'Plataforma de Fidelización Multi-Tienda de Nueva Generación',
    'home.hero_title_1': 'Una Billetera Digital.',
    'home.hero_title_2': 'Recompensas Locales Infinitas.',
    'home.hero_desc': 'OmniLoyalty conecta a los miembros con cafeterías locales, boutiques, supermercados y restaurantes. Guarda todos tus puntos de recompensa, pase QR dinámico y cupones de descuento digitales en una sola billetera digital fluida.',
    'home.btn_register': 'Registrarse como Miembro',
    'home.btn_signin': 'Iniciar Sesión Miembro',
    'home.btn_merchant': 'Acceso Comerciante',
    'home.stat_stores': 'Red de Socios',
    'home.stat_rate': 'Tasa Estándar de Ganancia',
    'home.stat_tiers': 'Bronce a Platino',
    'home.stat_instant': '100% Instantáneo',
    'home.stat_instant_sub': 'Escaneos QR en Tiempo Real',
    'home.features_title': '¿Por Qué Elegir OmniLoyalty?',
    'home.features_subtitle': 'Una red unificada de lealtad para clientes creada para compradores modernos y comercios locales prósperos.',
    'home.feat_1_title': 'Pase Digital Unificado',
    'home.feat_1_desc': 'Un solo código QR funciona en todas las tiendas participantes. Olvídate de llevar 10 tarjetas de cartón diferentes.',
    'home.feat_2_title': 'Mapa Interactivo de Tiendas',
    'home.feat_2_desc': 'Descubre comercios asociados cercanos, consulta beneficios y obtén navegación paso a paso a pie o en auto en tiempo real.',
    'home.feat_3_title': 'Beneficios y Cupones por Niveles',
    'home.feat_3_desc': 'Sube de nivel de Bronce a Platino conforme acumulas puntos. Desbloquea artículos gratis, descuentos en porcentaje y acceso VIP.',
    'home.feat_4_title': 'Escáner POS para Comercios',
    'home.feat_4_desc': 'Los negocios pueden escanear los pases de los clientes al instante, emitir puntos, canjear cupones y difundir promociones.',
    'home.feat_5_title': 'Seguridad con PIN de 5 Dígitos',
    'home.feat_5_desc': 'Tus autorizaciones y canjes de recompensas están protegidos con tu PIN personal de seguridad de 5 dígitos.',
    'home.feat_6_title': 'Notificaciones Push',
    'home.feat_6_desc': 'Recibe notificaciones instantáneas de puntos ganados, nuevos logros de nivel y descuentos flash exclusivos.',
    'home.featured_stores': 'Tiendas Asociadas Destacadas',
    'home.featured_stores_desc': 'Explora negocios locales donde puedes ganar y canjear puntos hoy mismo.',
    'home.view_all_stores': 'Ver Todas las Tiendas',
    'home.merchant_cta_title': '¿Eres Dueño de un Negocio Local?',
    'home.merchant_cta_desc': 'Únete a la red de comerciantes de OmniLoyalty para emitir puntos, premiar a tus clientes frecuentes y enviar promociones especiales directamente a compradores cercanos.',
    'home.merchant_cta_btn': 'Acceder a la Terminal de Comerciante',

    // Digital Wallet
    'wallet.omnipass_title': 'Membresía Digital OmniPass',
    'wallet.show_pass': 'Mostrar Pase',
    'wallet.copy_id': 'Copiar ID del Pase',
    'wallet.copied': '¡Copiado!',
    'wallet.points_balance': 'Saldo Disponible',
    'wallet.lifetime_points': 'Puntos Acumulados Históricos',
    'wallet.tier_progress': 'Progreso de Nivel',
    'wallet.tier_pts_to': 'puntos para',
    'wallet.tier_max': 'Nivel Máximo Platino Alcanzado',
    'wallet.quick_actions': 'Acciones Rápidas',
    'wallet.btn_scan_earn': 'Escanear y Ganar Puntos',
    'wallet.btn_scan_earn_desc': 'Escanea el código de la tienda o ingresa el total de la compra',
    'wallet.btn_find_stores': 'Buscar Tiendas Cercanas',
    'wallet.btn_find_stores_desc': 'Explora negocios asociados en el mapa interactivo',
    'wallet.btn_redeem_rewards': 'Explorar Catálogo de Recompensas',
    'wallet.btn_redeem_rewards_desc': 'Canjea puntos por descuentos y cupones',
    'wallet.vouchers_title': 'Mis Cupones de Recompensa Activos',
    'wallet.vouchers_empty': 'Aún no tienes cupones activos. ¡Canjea tus puntos en tiendas asociadas!',
    'wallet.voucher_expires': 'Vence:',
    'wallet.voucher_use': 'Usar Cupón',
    'wallet.transactions_title': 'Actividad Reciente de Puntos',
    'wallet.filter_all': 'Todos',
    'wallet.filter_earned': 'Ganados',
    'wallet.filter_redeemed': 'Canjeados',
    'wallet.tx_empty': 'Aún no hay transacciones registradas.',
    'wallet.qr_modal_title': 'Tu Pase QR OmniLoyalty',
    'wallet.qr_modal_desc': 'Presenta este código QR en la caja al pagar para ganar puntos o canjear recompensas.',
    'wallet.security_notice': 'Protegido con autorización de PIN de 5 dígitos',

    // Store Finder
    'stores.search_placeholder': 'Buscar por nombre de tienda, tipo de comida, categoría o ciudad...',
    'stores.cat_all': 'Todas las Tiendas',
    'stores.cat_coffee': 'Café y Té',
    'stores.cat_fashion': 'Moda y Ropa',
    'stores.cat_grocery': 'Supermercado y Mercado',
    'stores.cat_electronics': 'Electrónica y Gadgets',
    'stores.cat_dining': 'Restaurantes y Bistró',
    'stores.cat_wellness': 'Bienestar y Spa',
    'stores.results_count': 'ubicaciones asociadas encontradas',
    'stores.points_rate': 'pts / $1 gastado',
    'stores.open_hours': 'Horario:',
    'stores.phone': 'Teléfono:',
    'stores.get_directions': 'Cómo Llegar',
    'stores.view_rewards': 'Ver Recompensas',
    'stores.featured_reward': 'Beneficio Destacado:',
    'stores.no_results': 'No hay tiendas que coincidan con tu búsqueda. Prueba con otro filtro o palabra clave.',

    // Interactive Map & Navigation
    'map.title': 'Mapa Interactivo de Tiendas y Navegación de Ruta',
    'map.desc': 'Visualiza ubicaciones asociadas cercanas y recibe indicaciones paso a paso en tiempo real.',
    'map.walking': 'Caminando',
    'map.driving': 'En Auto',
    'map.biking': 'En Bicicleta',
    'map.start_nav': 'Iniciar Navegación de Ruta',
    'map.exit_nav': 'Salir de Navegación',
    'map.directions_to': 'Indicaciones para llegar a',
    'map.est_time': 'Tiempo Estimado',
    'map.distance': 'Distancia',
    'map.steps': 'Pasos de la Ruta',
    'map.current_location': 'Tu Ubicación (Simulada)',
    'map.destination': 'Destino',

    // Scan & Earn Modal
    'scan.title': 'Escanear y Ganar / Canjear Puntos',
    'scan.desc': 'Genera una solicitud instantánea para ganar puntos o canjear tus cupones en caja.',
    'scan.tab_earn': 'Ganar Puntos',
    'scan.tab_redeem': 'Canjear Puntos',
    'scan.select_store': 'Seleccionar Tienda Asociada:',
    'scan.purchase_amount': 'Monto de Compra ($ USD):',
    'scan.points_to_earn': 'Puntos que recibirás:',
    'scan.points_to_redeem': 'Puntos a Canjear:',
    'scan.discount_value': 'Valor de Descuento:',
    'scan.pin_required': 'Se Requiere PIN de 5 Dígitos para Confirmar',
    'scan.btn_confirm_earn': 'Autorizar y Sumar Puntos',
    'scan.btn_confirm_redeem': 'Autorizar y Canjear Puntos',
    'scan.success_title': '¡Transacción Exitosa!',
    'scan.success_earn_msg': 'Los puntos han sido acreditados a tu billetera digital.',
    'scan.success_redeem_msg': 'Cupón de descuento generado y aplicado exitosamente.',
    'scan.close': 'Cerrar',

    // Merchant Dashboard
    'merchant.dashboard_title': 'Terminal POS y Panel del Comerciante',
    'merchant.dashboard_desc': 'Escanea pases de clientes, emite puntos de recompensa, administra recompensas y difunde notificaciones push.',
    'merchant.stat_points_issued': 'Puntos Emitidos Hoy',
    'merchant.stat_points_redeemed': 'Puntos Canjeados',
    'merchant.stat_transactions': 'Total de Transacciones',
    'merchant.stat_est_revenue': 'Ingresos POS Estimados',
    'merchant.quick_terminal': 'Abrir Terminal POS',
    'merchant.quick_rewards': 'Administrador de Recompensas',
    'merchant.quick_broadcast': 'Difundir Promoción Push',
    'merchant.activity_title': 'Actividad en Vivo de la Tienda',
    'merchant.activity_empty': 'Aún no hay transacciones registradas hoy.',
    'merchant.btn_switch_store': 'Seleccionar Sucursal Activa:',

    // POS Scanner Terminal
    'pos.title': 'Terminal de Escáner POS / Código de Barras / QR',
    'pos.desc': 'Escanea el código QR del pase digital del cliente para emitir puntos o canjear cupones.',
    'pos.customer_pass_id': 'ID del Pase / Usuario del Cliente:',
    'pos.scan_simulate': 'Escanear QR del Cliente',
    'pos.sale_amount': 'Monto Total de Venta ($):',
    'pos.calculated_points': 'Puntos a Emitir (10 pts/$1):',
    'pos.btn_issue_points': 'Emitir Puntos de Fidelidad',
    'pos.redeem_tab': 'Canjear Código de Cupón',
    'pos.voucher_code': 'Ingresar Código de Cupón:',
    'pos.btn_verify_voucher': 'Verificar y Canjear Cupón',
    'pos.recent_scans': 'Escaneos Recientes de POS',

    // Reward Catalog Manager
    'reward_mgr.title': 'Administrador del Catálogo de Recompensas',
    'reward_mgr.desc': 'Crea, edita y publica cupones de descuento digitales para los miembros de tu tienda.',
    'reward_mgr.btn_add': 'Crear Nueva Recompensa',
    'reward_mgr.form_title': 'Título de la Recompensa:',
    'reward_mgr.form_desc': 'Descripción:',
    'reward_mgr.form_points': 'Costo en Puntos:',
    'reward_mgr.form_discount': 'Valor del Descuento (ej. $5 OFF, 20% OFF, Bebida Gratis):',
    'reward_mgr.form_category': 'Categoría:',
    'reward_mgr.form_tier': 'Nivel Mínimo Requerido:',
    'reward_mgr.form_expiry': 'Días de Validez:',
    'reward_mgr.btn_save': 'Guardar Recompensa',
    'reward_mgr.btn_delete': 'Eliminar',
    'reward_mgr.active_rewards': 'Recompensas Activas de la Tienda',

    // Push Notification Broadcaster
    'broadcast.title': 'Emisor de Notificaciones Push',
    'broadcast.desc': 'Envía notificaciones push promocionales instantáneas a tu base de clientes leales.',
    'broadcast.campaign_title': 'Título de la Notificación:',
    'broadcast.campaign_body': 'Contenido del Mensaje:',
    'broadcast.target_audience': 'Audiencia Destino:',
    'broadcast.target_all': 'Todos los Miembros Registrados',
    'broadcast.target_bronze': 'Solo Miembros Bronce',
    'broadcast.target_silver': 'Miembros Plata y Superior',
    'broadcast.target_gold': 'Miembros Oro y Superior',
    'broadcast.target_platinum': 'Solo Miembros VIP Platino',
    'broadcast.btn_send': 'Transmitir Notificación Ahora',
    'broadcast.history_title': 'Historial Reciente de Emisiones',

    // Login & Register Modal
    'auth.title_login': 'Bienvenido de Nuevo',
    'auth.title_register': 'Crea Tu Cuenta',
    'auth.desc_login': 'Inicia sesión para acceder a tu billetera de recompensas o terminal de comerciante.',
    'auth.desc_register': 'Únete a la red OmniLoyalty y comienza a ganar puntos en tiendas locales.',
    'auth.login_title': 'Inicio de Sesión de Miembro',
    'auth.register_title': 'Registro de Miembro',
    'auth.merchant_login_title': 'Acceso a Terminal POS Comerciante',
    'auth.merchant_register_title': 'Registro de Comercio Asociado',
    'auth.login_subtitle': 'Inicia sesión para acceder a tu billetera digital y recompensas',
    'auth.register_subtitle': 'Crea una cuenta para acumular puntos en tiendas locales asociadas',
    'merchant.terminal_subtitle': 'Inicia sesión para acceder a la terminal de escaneo POS y gestión de recompensas',
    'auth.tab_member': 'Miembro',
    'auth.tab_merchant': 'POS Comercio',
    'auth.tab_signin': 'Iniciar Sesión',
    'auth.tab_signup': 'Registrarse',
    'auth.demo_autofill': 'Autocompletar Demo',
    'auth.demo_member': 'Miembro',
    'auth.demo_merchant': 'Comercio',
    'auth.email_or_user': 'Correo Electrónico o Usuario',
    'auth.password': 'Contraseña',
    'auth.confirm_password': 'Confirmar Contraseña',
    'auth.full_name': 'Nombre Completo',
    'auth.email_address': 'Correo Electrónico',
    'auth.username': 'Nombre de Usuario',
    'auth.pin_title': 'PIN de Transacción de 5 Dígitos',
    'auth.pin_required': 'Requerido',
    'auth.pin_desc': 'Este código de 5 dígitos será solicitado para autorizar transacciones y canjes importantes.',
    'auth.btn_signing_in': 'Iniciando Sesión...',
    'auth.btn_signin_wallet': 'Ingresar a Billetera Digital',
    'auth.btn_signin_merchant': 'Ingresar a Panel de Comerciante',
    'auth.btn_creating_acc': 'Creando Cuenta...',
    'auth.btn_create_member': 'Crear Cuenta de Miembro',
    'auth.btn_register_merchant': 'Registrar Comercio',
    'auth.field_username': 'Nombre de Usuario:',
    'auth.field_fullname': 'Nombre Completo:',
    'auth.field_email': 'Correo Electrónico:',
    'auth.field_password': 'Contraseña:',
    'auth.field_confirm_password': 'Confirmar Contraseña:',
    'auth.field_pin': 'PIN de Seguridad de 5 Dígitos (Para autorizar transacciones):',
    'auth.pin_helper': 'Se utiliza para autorizar de forma segura canjes de recompensas y cambios de perfil.',
    'auth.btn_signin': 'Iniciar Sesión en la Cuenta',
    'auth.btn_signup': 'Crear Cuenta de Miembro',
    'auth.no_account': '¿No tienes una cuenta?',
    'auth.has_account': '¿Ya tienes una cuenta?',
    'auth.switch_signup': 'Regístrate ahora',
    'auth.switch_signin': 'Inicia sesión aquí',
    'auth.verify_title': 'Verifica Tu Correo Electrónico',
    'auth.verify_subtitle': 'Por favor confirma tu correo electrónico para activar tu cuenta',
    'auth.verify_sent_to': 'Hemos enviado un enlace de verificación y código a:',
    'auth.verify_instructions': 'Revisa tu bandeja de entrada (y carpeta de spam) para activar tu cuenta. Debes verificar tu correo antes de ingresar a tu billetera o terminal comercial.',
    'auth.verify_enter_code': 'Ingresa el Código de 6 Dígitos (Opcional):',
    'auth.btn_check_status': 'Comprobar Estado de Verificación',
    'auth.btn_resend_email': 'Reenviar Correo de Verificación',
    'auth.btn_instant_activate': 'Verificar y Activar Cuenta Ahora',
    'auth.verify_success': '¡Correo verificado exitosamente! Tu cuenta ya está activa.',
    'auth.verify_pending_error': 'Tu cuenta está pendiente de verificación de correo. Por favor verifícalo antes de iniciar sesión.',

    // PIN Verification Modal
    'pin_modal.title': 'Verificación de PIN de Seguridad',
    'pin_modal.desc': 'Por favor ingresa tu PIN de seguridad de 5 dígitos para autorizar esta acción.',
    'pin_modal.btn_confirm': 'Autorizar',
    'pin_modal.btn_cancel': 'Cancelar',
    'pin_modal.error_invalid': 'PIN de 5 dígitos incorrecto. Por favor intenta de nuevo.',
    'pin_modal.enter_digits': 'Ingresa 5 dígitos',

    // Profile Modal
    'profile.title': 'Perfil de Cuenta y Configuración de Seguridad',
    'profile.desc': 'Administra tus datos personales y actualiza tu PIN de seguridad de 5 dígitos.',
    'profile.field_name': 'Nombre Completo:',
    'profile.field_email': 'Correo Electrónico:',
    'profile.field_username': 'Nombre de Usuario:',
    'profile.field_pass_id': 'ID de OmniPass:',
    'profile.field_current_pin': 'PIN Actual de 5 Dígitos:',
    'profile.field_new_pin': 'Nuevo PIN de 5 Dígitos (Opcional):',
    'profile.btn_save': 'Guardar Cambios',
    'profile.success': '¡Perfil y PIN de seguridad actualizados exitosamente!',

    // Notification Drawer
    'notif.title': 'Notificaciones y Alertas',
    'notif.unread': 'sin leer',
    'notif.mark_all': 'Marcar todo como leído',
    'notif.clear_all': 'Borrar todo',
    'notif.empty': 'No hay notificaciones por el momento.'
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string) => key
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('omni_language');
      if (saved === 'es' || saved === 'en') return saved;
      // Auto-detect browser language if Spanish
      if (typeof navigator !== 'undefined' && navigator.language && navigator.language.startsWith('es')) {
        return 'es';
      }
      return 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('omni_language', lang);
    } catch (e) {
      console.error('Error saving language preference:', e);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  const t = (key: string): string => {
    const langDict = translations[language] || translations.en;
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    const fallbackDict = translations.en;
    return fallbackDict[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
