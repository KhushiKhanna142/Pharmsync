// ============================================================================
// UPI PAYMENT INTEGRATION FOR PHARMACY BILLING
// ============================================================================

/**
 * UPI Payment Flow:
 * 1. Generate UPI deep link → QR code
 * 2. Customer scans with any UPI app (GPay, PhonePe, Paytm)
 * 3. Customer completes payment
 * 4. We verify via transaction ID (or webhook if using payment gateway)
 * 
 * For hackathon/demo: We'll use UPI Intent + simulate verification
 * For production: Integrate with Razorpay/PhonePe/Paytm Business API
 */

// ============================================================================
// UPI CONFIGURATION
// ============================================================================

export interface UPIConfig {
    merchantName: string;
    merchantVPA: string; // UPI ID like pharmacy@upi
    merchantCode?: string;
}

// Demo UPI config (replace with real details)
export const UPI_CONFIG: UPIConfig = {
    merchantName: 'MedPlus Pharmacy',
    merchantVPA: import.meta.env.VITE_MERCHANT_VPA || 'medplus@paytm',
    merchantCode: 'PHM001'
};

// ============================================================================
// UPI DEEP LINK GENERATION
// ============================================================================

export interface UPIPaymentRequest {
    amount: number;
    transactionNote: string;
    transactionRef: string; // Unique bill number
}

/**
 * Generate UPI deep link following NPCI specification
 * Format: upi://pay?pa=VPA&pn=NAME&am=AMOUNT&tn=NOTE&tr=REF
 */
export function generateUPILink(request: UPIPaymentRequest): string {
    const params = new URLSearchParams({
        pa: UPI_CONFIG.merchantVPA,
        pn: UPI_CONFIG.merchantName,
        am: request.amount.toFixed(2),
        tn: request.transactionNote,
        tr: request.transactionRef,
        cu: 'INR'
    });

    return `upi://pay?${params.toString()}`;
}

/**
 * Generate UPI Intent URL (for Android apps)
 */
export function generateUPIIntent(request: UPIPaymentRequest): string {
    const params = new URLSearchParams({
        pa: UPI_CONFIG.merchantVPA,
        pn: UPI_CONFIG.merchantName,
        am: request.amount.toFixed(2),
        tn: request.transactionNote,
        tr: request.transactionRef,
        cu: 'INR',
        mode: '02' // 02 = collect, 01 = send
    });

    return `upi://pay?${params.toString()}`;
}

// ============================================================================
// QR CODE GENERATION
// ============================================================================

/**
 * Generate QR code data URL for UPI payment
 * Uses browser-friendly QR generation (no server needed)
 */
export async function generatePaymentQR(request: UPIPaymentRequest): Promise<string> {
    const upiLink = generateUPILink(request);

    try {
        // Dynamic import to avoid SSR issues
        const QRCode = (await import('qrcode')).default;
        const qrDataURL = await QRCode.toDataURL(upiLink, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        return qrDataURL;
    } catch (error) {
        console.error('QR generation failed:', error);
        // Fallback: Return placeholder
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmNWY1ZjUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UVIgQ29kZTwvdGV4dD48L3N2Zz4=';
    }
}

// ============================================================================
// PAYMENT VERIFICATION (Demo Mode)
// ============================================================================

export interface PaymentVerification {
    success: boolean;
    transactionId?: string;
    message: string;
}

/**
 * Simulate payment verification
 * In production: Call payment gateway API to verify transaction
 */
export async function verifyPayment(
    billNumber: string,
    amount: number
): Promise<PaymentVerification> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // For demo: 90% success rate
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
        return {
            success: true,
            transactionId: `UPI${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            message: 'Payment received successfully'
        };
    } else {
        return {
            success: false,
            message: 'Payment failed or cancelled by user'
        };
    }
}

// ============================================================================
// CASH PAYMENT (No integration needed)
// ============================================================================

export interface CashPaymentResult {
    success: boolean;
    changeAmount: number;
}

export function processCashPayment(
    billAmount: number,
    amountReceived: number
): CashPaymentResult {
    if (amountReceived < billAmount) {
        return {
            success: false,
            changeAmount: 0
        };
    }

    return {
        success: true,
        changeAmount: amountReceived - billAmount
    };
}
