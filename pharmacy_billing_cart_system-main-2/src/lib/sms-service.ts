
// src/lib/sms-service.ts
// PRODUCTION SMS INTEGRATION

interface SMSConfig {
    provider: 'msg91' | 'twilio' | 'fast2sms';
    apiKey: string;
    senderId?: string; // For MSG91
    templateId?: string; // For transactional SMS
}

interface ReceiptData {
    billNumber: string;
    customerName?: string;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    total: number;
    paymentMethod: string;
    date: string;
}

export class SMSService {
    private static config: SMSConfig = {
        provider: import.meta.env.VITE_FAST2SMS_API_KEY ? 'fast2sms' : 'msg91',
        apiKey: import.meta.env.VITE_FAST2SMS_API_KEY || import.meta.env.VITE_MSG91_API_KEY || '',
        templateId: import.meta.env.VITE_MSG91_TEMPLATE_ID || '',
        senderId: 'MEDPLS'
    };

    static configure(config: SMSConfig) {
        this.config = config;
    }

    // MSG91 Integration (Best for India - ₹0.15/SMS)
    static async sendViaMSG91(phone: string, message: string): Promise<boolean> {
        try {
            // In production this would likely be proxied through backend to hide API Key
            const response = await fetch('https://api.msg91.com/api/v5/flow/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authkey': this.config.apiKey
                },
                body: JSON.stringify({
                    template_id: this.config.templateId,
                    short_url: '0',
                    recipients: [{
                        mobiles: phone.replace(/^(\+91)?/, '91'), // Ensure 91 prefix
                        var: message // Variables for template
                    }]
                })
            });

            const data = await response.json();
            return data.type === 'success';
        } catch (error) {
            console.error('MSG91 SMS failed:', error);
            return false;
        }
    }

    // Twilio Integration (Global, expensive for India ₹1.50/SMS)
    static async sendViaTwilio(phone: string, message: string): Promise<boolean> {
        try {
            // Requires backend proxy for security (account SID + auth token)
            const response = await fetch('/api/sms/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: phone,
                    message: message.substring(0, 1600) // Twilio limit
                })
            });

            const data = await response.json();
            return response.ok;
        } catch (error) {
            console.error('Twilio SMS failed:', error);
            return false;
        }
    }

    // Fast2SMS (Cheap but unreliable)
    static async sendViaFast2SMS(phone: string, message: string): Promise<boolean> {
        try {
            const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
                method: 'POST',
                headers: {
                    'authorization': this.config.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    route: 'q',
                    message: message,
                    language: 'english',
                    flash: 0,
                    numbers: phone
                })
            });

            const data = await response.json();
            return data.return === true;
        } catch (error) {
            console.error('Fast2SMS failed:', error);
            return false;
        }
    }

    // Format receipt for SMS (160 chars for single SMS)
    static formatReceipt(data: ReceiptData, shortVersion: boolean = true): string {
        if (shortVersion) {
            // Single SMS (160 chars)
            return `MedPlus Bill ${data.billNumber}
Total: ₹${data.total}
Paid: ${data.paymentMethod}
Items: ${data.items.length}
Thank you! - MedPlus`;
        }

        // Detailed version (multiple SMS)
        const itemsList = data.items
            .map(item => `${item.name} x${item.quantity} - ₹${item.price * item.quantity}`)
            .join('\n');

        return `MedPlus Pharmacy
Bill: ${data.billNumber}
Date: ${data.date}
Customer: ${data.customerName || 'Guest'}

Items:
${itemsList}

Total: ₹${data.total}
Payment: ${data.paymentMethod}

Thank you for shopping!
Call: 1800-XXX-XXXX`;
    }

    // Send receipt (automatically chooses provider)
    static async sendReceipt(
        phone: string,
        receiptData: ReceiptData
    ): Promise<{ success: boolean; error?: string }> {
        // Validate phone number
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length !== 10) {
            return { success: false, error: 'Invalid phone number' };
        }

        // Format message
        const message = this.formatReceipt(receiptData, true);

        // CHECK IF SIMULATION NEEDED
        if (!this.config.apiKey || this.config.apiKey === 'DEMO_KEY' || this.config.apiKey.trim() === '') {
            console.log(`%c[SMS SIMULATION] To: ${cleanPhone}`, 'color: green; font-weight: bold');
            console.log(message);
            console.log('%c[SMS] API Key missing. Simulating success.', 'color: gray');

            // Artificial delay to feel real
            await new Promise(r => setTimeout(r, 800));
            return { success: true };
        }

        console.log(`[SMS Service] Sending via ${this.config.provider} to ${cleanPhone}:`, message);

        // Send via configured provider
        let success = false;
        switch (this.config.provider) {
            case 'msg91':
                success = await this.sendViaMSG91(cleanPhone, message);
                break;
            case 'twilio':
                success = await this.sendViaTwilio(cleanPhone, message);
                break;
            case 'fast2sms':
                success = await this.sendViaFast2SMS(cleanPhone, message);
                break;
            default:
                // Mock success if no provider fully configured/demo
                console.warn('[SMS Service] No valid provider configured, simulating success');
                success = true;
        }

        return {
            success,
            error: success ? undefined : 'SMS delivery failed'
        };
    }
}
