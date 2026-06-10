import { Router } from 'express';
import {
  // Menu
  getMenu,
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuAvailability,
  // Categories
  getCategories,
  createCategory,
  // Orders
  placeOrder,
  getActiveOrders,
  updateOrderStatus,
  getStudentOrders,
  getAllOrders,
  // Wallet
  topupWallet,
  getWalletBalance,
  getWalletTransactions,
  // Feedback
  submitFeedback,
  getAllFeedback,
  // Offers
  getOffers,
  createOffer,
  deleteOffer,
  // Pre-orders
  createPreorder,
  getStudentPreorders,
  // Subscriptions
  createSubscription,
  getStudentSubscriptions,
  // Analytics
  getAnalytics
} from '../controllers/canteen';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Apply auth middleware to protect all routes
router.use(authMiddleware);

// ──── MENU ────────────────────────────────────────────────────
router.get('/menu', getMenu);
router.get('/menu/all', requireRole(['Admin', 'SuperAdmin', 'Vendor']), getAllMenuItems);
router.post('/menu', requireRole(['Admin', 'SuperAdmin', 'Vendor']), createMenuItem);
router.put('/menu/:id', requireRole(['Admin', 'SuperAdmin', 'Vendor']), updateMenuItem);
router.delete('/menu/:id', requireRole(['Admin', 'SuperAdmin', 'Vendor']), deleteMenuItem);
router.put('/menu/:id/toggle', requireRole(['Admin', 'SuperAdmin', 'Vendor']), toggleMenuAvailability);

// ──── CATEGORIES ──────────────────────────────────────────────
router.get('/categories', getCategories);
router.post('/categories', requireRole(['Admin', 'SuperAdmin', 'Vendor']), createCategory);

// ──── ORDERS ──────────────────────────────────────────────────
router.post('/orders', placeOrder);
router.get('/orders/active', requireRole(['Admin', 'SuperAdmin', 'Vendor']), getActiveOrders);
router.get('/orders/all', requireRole(['Admin', 'SuperAdmin', 'Vendor']), getAllOrders);
router.get('/orders/:studentId', getStudentOrders);
router.put('/orders/:id/status', requireRole(['Admin', 'SuperAdmin', 'Vendor']), updateOrderStatus);

// ──── WALLET ──────────────────────────────────────────────────
router.post('/wallet/topup', topupWallet);
router.get('/wallet/:studentId', getWalletBalance);
router.get('/wallet/:studentId/transactions', getWalletTransactions);

// ──── FEEDBACK ────────────────────────────────────────────────
router.post('/feedback', submitFeedback);
router.get('/feedback', requireRole(['Admin', 'SuperAdmin', 'Vendor']), getAllFeedback);

// ──── OFFERS ──────────────────────────────────────────────────
router.get('/offers', getOffers);
router.post('/offers', requireRole(['Admin', 'SuperAdmin', 'Vendor']), createOffer);
router.delete('/offers/:id', requireRole(['Admin', 'SuperAdmin', 'Vendor']), deleteOffer);

// ──── PRE-ORDERS ──────────────────────────────────────────────
router.post('/preorders', createPreorder);
router.get('/preorders/:studentId', getStudentPreorders);

// ──── SUBSCRIPTIONS ───────────────────────────────────────────
router.post('/subscriptions', createSubscription);
router.get('/subscriptions/:studentId', getStudentSubscriptions);

// ──── ANALYTICS ───────────────────────────────────────────────
router.get('/analytics', requireRole(['Admin', 'SuperAdmin', 'Vendor']), getAnalytics);

export default router;
