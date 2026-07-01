import { Router } from 'express';
import {
  // Menu
  getMenu,
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuAvailability,
  getMenuByCategory,
  // Categories
  getCategories,
  createCategory,
  // Orders
  placeOrder,
  getActiveOrders,
  updateOrderStatus,
  getStudentOrders,
  getAllOrders,
  getOrderById,
  cancelOrder,
  getOrdersQueue,
  // Wallet
  topupWallet,
  getWalletBalance,
  getWalletTransactions,
  initiateWalletTopup,
  verifyWalletTopup,
  adjustWallet,
  // Feedback
  submitFeedback,
  getAllFeedback,
  // Offers
  getOffers,
  createOffer,
  deleteOffer,
  validateOfferCode,
  // Pre-orders
  createPreorder,
  getStudentPreorders,
  // Subscriptions & Meal Plans
  createSubscription,
  getStudentSubscriptions,
  getMealPlans,
  createMealPlan,
  subscribeMealPlan,
  selectDailyMeal,
  // AI Menu
  generateAIMenu,
  getCurrentAIMenu,
  approveAIMenu,
  // Analytics
  getAnalytics,
  getAnalyticsToday,
  getAnalyticsWeekly,
  getAnalyticsItems,
  getAnalyticsForecast,
  getNutritionSummary,
  // Hygiene
  submitHygieneChecklist,
  getHygieneReport,
  // Express Counter Face checkout
  faceCheckout,
  // Daily Menu
  getTodayMenu,
  setDailyMenu,
  getDailyMenuByDate
} from '../controllers/canteen';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Apply auth middleware to protect all routes
router.use(authMiddleware);

// ──── MENU ────────────────────────────────────────────────────
router.get('/menu', getMenu);
router.get('/menu/category/:id', getMenuByCategory);
router.get('/menu/all', requireRole(['Admin', 'SuperAdmin', 'Vendor']), getAllMenuItems);
router.post('/menu', requireRole(['Admin', 'SuperAdmin', 'Vendor']), createMenuItem);
router.put('/menu/:id', requireRole(['Admin', 'SuperAdmin', 'Vendor']), updateMenuItem);
router.put('/menu/:id/availability', requireRole(['Admin', 'SuperAdmin', 'Vendor']), toggleMenuAvailability);
router.put('/menu/:id/toggle', requireRole(['Admin', 'SuperAdmin', 'Vendor']), toggleMenuAvailability);
router.delete('/menu/:id', requireRole(['Admin', 'SuperAdmin', 'Vendor']), deleteMenuItem);

// ──── CATEGORIES ──────────────────────────────────────────────
router.get('/categories', getCategories);
router.post('/categories', requireRole(['Admin', 'SuperAdmin', 'Vendor']), createCategory);

// ──── ORDERS ──────────────────────────────────────────────────
router.post('/orders', placeOrder);
router.get('/orders/queue', requireRole(['Admin', 'SuperAdmin', 'Vendor']), getOrdersQueue);
router.get('/orders/active', requireRole(['Admin', 'SuperAdmin', 'Vendor']), getActiveOrders);
router.get('/orders/all', requireRole(['Admin', 'SuperAdmin', 'Vendor']), getAllOrders);
router.get('/orders/student/:studentId', getStudentOrders);
router.get('/orders/:orderId', getOrderById);
router.post('/orders/:id/cancel', cancelOrder);
router.put('/orders/:id/status', requireRole(['Admin', 'SuperAdmin', 'Vendor']), updateOrderStatus);

// ──── WALLET ──────────────────────────────────────────────────
router.post('/wallet/topup', topupWallet);
router.post('/wallet/topup/initiate', initiateWalletTopup);
router.post('/wallet/topup/verify', verifyWalletTopup);
router.post('/wallet/adjust', requireRole(['Admin', 'SuperAdmin']), adjustWallet);
router.get('/wallet/:studentId', getWalletBalance);
router.get('/wallet/transactions/:studentId', getWalletTransactions);

// ──── MEAL PLANS ──────────────────────────────────────────────
router.get('/meal-plans', getMealPlans);
router.post('/meal-plans', requireRole(['Admin', 'SuperAdmin', 'Vendor']), createMealPlan);
router.post('/meal-plans/:id/subscribe', subscribeMealPlan);
router.get('/meal-subscriptions/:studentId', getStudentSubscriptions);
router.post('/meal-selection', selectDailyMeal);

// ──── AI MENU ─────────────────────────────────────────────────
router.post('/ai-menu/generate', requireRole(['Admin', 'SuperAdmin', 'Vendor']), generateAIMenu);
router.get('/ai-menu/current', getCurrentAIMenu);
router.put('/ai-menu/approve', requireRole(['Admin', 'SuperAdmin', 'Vendor']), approveAIMenu);
router.put('/ai-menu/:id/approve', requireRole(['Admin', 'SuperAdmin', 'Vendor']), approveAIMenu);

// ──── FEEDBACK ────────────────────────────────────────────────
router.post('/feedback', submitFeedback);
router.get('/feedback/all', requireRole(['Admin', 'SuperAdmin', 'Vendor']), getAllFeedback);

// ──── ANALYTICS ───────────────────────────────────────────────
router.get('/analytics', requireRole(['Admin', 'SuperAdmin', 'Vendor']), getAnalytics);
router.get('/analytics/today', requireRole(['Admin', 'SuperAdmin', 'Vendor']), getAnalyticsToday);
router.get('/analytics/weekly', requireRole(['Admin', 'SuperAdmin', 'Vendor']), getAnalyticsWeekly);
router.get('/analytics/items', requireRole(['Admin', 'SuperAdmin', 'Vendor']), getAnalyticsItems);
router.get('/analytics/forecast', requireRole(['Admin', 'SuperAdmin', 'Vendor']), getAnalyticsForecast);
router.get('/nutrition/:studentId', getNutritionSummary);

// ──── HYGIENE ─────────────────────────────────────────────────
router.post('/hygiene/checklist', requireRole(['Vendor']), submitHygieneChecklist);
router.get('/hygiene/report', requireRole(['Admin', 'SuperAdmin', 'Vendor']), getHygieneReport);

// ──── OFFERS ──────────────────────────────────────────────────
router.get('/offers', getOffers);
router.post('/offers', requireRole(['Admin', 'SuperAdmin', 'Vendor']), createOffer);
router.post('/offers/validate', validateOfferCode);
router.delete('/offers/:id', requireRole(['Admin', 'SuperAdmin', 'Vendor']), deleteOffer);

// ──── PRE-ORDERS ──────────────────────────────────────────────
router.post('/preorders', createPreorder);
router.get('/preorders/:studentId', getStudentPreorders);

// ──── SUBSCRIPTIONS ───────────────────────────────────────────
router.post('/subscriptions', createSubscription);
router.get('/subscriptions/:studentId', getStudentSubscriptions);

// ──── EXPRESS COUNTER ─────────────────────────────────────────
router.post('/express/checkout-face', faceCheckout);

// ──── DAILY MENU ──────────────────────────────────────────────
router.get('/daily-menu/today', getTodayMenu);
router.post('/daily-menu', requireRole(['Admin', 'SuperAdmin', 'Vendor']), setDailyMenu);
router.get('/daily-menu', getDailyMenuByDate);

export default router;
