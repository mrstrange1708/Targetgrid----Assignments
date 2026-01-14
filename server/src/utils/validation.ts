import Joi from 'joi';
import crypto from 'crypto';

export const eventSchema = Joi.object({
    eventId: Joi.string().optional(),
    event_type: Joi.string().required().messages({
        'any.required': 'event_type is required'
    }),
    source: Joi.string().required().messages({
        'any.required': 'source is required'
    }),
    timestamp: Joi.date().iso().optional(),
    metadata: Joi.object({
        email: Joi.string().email().optional(),
        lead_id: Joi.string().optional(),
        name: Joi.string().optional(),
        company: Joi.string().optional()
    }).unknown(true).required().messages({
        'any.required': 'metadata is required and should contain email or lead_id for identification'
    })
});

export const webhookSchema = Joi.alternatives().try(
    Joi.array().items(Joi.object().unknown(true)),
    Joi.object().unknown(true)
);

/**
 * Verifies a webhook signature using HMAC-SHA256
 * @param payload Raw body of the request
 * @param signature Signature from headers
 * @param secret Secret key
 */
export const verifyWebhookSignature = (payload: string, signature: string, secret: string): boolean => {
    if (!signature || !secret) return false;

    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');

    try {
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
    } catch (e) {
        return false;
    }
};
