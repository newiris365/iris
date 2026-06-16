let razorpayInstance: any = null;

export function getRazorpayClient(): any {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || keyId.includes('your_key')) {
    return null;
  }

  if (!razorpayInstance) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Razorpay = require('razorpay');
      razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
    } catch {
      return null;
    }
  }

  return razorpayInstance;
}

export function isMockOrderId(orderId: string): boolean {
  return orderId.startsWith('order_mock_');
}
