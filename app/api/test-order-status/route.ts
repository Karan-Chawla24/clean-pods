import { NextRequest, NextResponse } from 'next/server';
import { withUpstashRateLimit } from "@/app/lib/security/upstashRateLimit";
import { safeLog, safeLogError } from "@/app/lib/security/logging";

export const GET = withUpstashRateLimit("moderate")(async (request: NextRequest) => {
  try {
    safeLog('info', 'Testing PhonePe Order Status API', {});
    
    // Import the PhonePe OAuth client
    const { createPhonePeOAuthClient } = await import("@/app/lib/phonepe-oauth");
    const phonePeClient = createPhonePeOAuthClient();
    
    const merchantOrderId = 'CP5NJUUVMFB';
    
    safeLog('info', 'Testing Order Status for Merchant Order ID', { merchantOrderId });
    
    const results: any = {
      merchantOrderId,
      tests: {}
    };
    
    // Test without details parameter
    safeLog('info', 'Testing without details parameter', {});
    try {
      const responseWithoutDetails = await phonePeClient.getOrderStatus(merchantOrderId, false);
      results.tests.withoutDetails = {
        success: true,
        response: responseWithoutDetails
      };
      safeLog('info', 'Response without details received', { hasResponse: !!responseWithoutDetails });
    } catch (error: any) {
      results.tests.withoutDetails = {
        success: false,
        error: error.message
      };
      safeLogError('Error without details', error);
    }
    
    // Test with details parameter
    safeLog('info', 'Testing with details=true parameter', {});
    try {
      const responseWithDetails = await phonePeClient.getOrderStatus(merchantOrderId, true);
      results.tests.withDetails = {
        success: true,
        response: responseWithDetails
      };
      safeLog('info', 'Response with details received', { hasResponse: !!responseWithDetails });
      
      // Analyze the structure
      if (responseWithDetails?.paymentDetails) {
        const analysis: any = {
          paymentDetailsCount: responseWithDetails.paymentDetails.length,
          payments: []
        };
        
        responseWithDetails.paymentDetails.forEach((payment: any, index: number) => {
          const paymentAnalysis: any = {
            index: index + 1,
            state: payment.state,
            paymentMode: payment.paymentMode,
            transactionId: payment.transactionId,
            amount: payment.amount,
            timestamp: payment.timestamp,
            hasRail: !!payment.rail,
            hasInstrument: !!payment.instrument,
            hasSplitInstruments: !!payment.splitInstruments
          };
          
          // Check for rail data
          if (payment.rail) {
            paymentAnalysis.rail = {
              utr: payment.rail.utr,
              upiTransactionId: payment.rail.upiTransactionId,
              vpa: payment.rail.vpa
            };
          }
          
          // Check for instrument data
          if (payment.instrument) {
            paymentAnalysis.instrument = {
              accountHolderName: payment.instrument.accountHolderName,
              accountType: payment.instrument.accountType,
              maskedAccountNumber: payment.instrument.maskedAccountNumber
            };
          }
          
          // Check for splitInstruments
          if (payment.splitInstruments) {
            paymentAnalysis.splitInstruments = {
              count: payment.splitInstruments.length,
              details: payment.splitInstruments.map((split: any, splitIndex: number) => ({
                index: splitIndex + 1,
                rail: split.rail ? {
                  utr: split.rail.utr,
                  upiTransactionId: split.rail.upiTransactionId,
                  vpa: split.rail.vpa
                } : null,
                instrument: split.instrument ? {
                  accountHolderName: split.instrument.accountHolderName,
                  accountType: split.instrument.accountType,
                  maskedAccountNumber: split.instrument.maskedAccountNumber
                } : null
              }))
            };
          }
          
          analysis.payments.push(paymentAnalysis);
        });
        
        results.analysis = analysis;
      } else {
        results.analysis = { error: 'No payment details found in response' };
      }
      
    } catch (error: any) {
      results.tests.withDetails = {
        success: false,
        error: error.message,
        fullError: error.toString()
      };
      safeLogError('Error with details', error);
    }
    
    return NextResponse.json(results, { status: 200 });
    
  } catch (error: any) {
    safeLogError('Test failed', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      message: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});