import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing PhonePe Order Status API...');
    
    // Import the PhonePe OAuth client
    const { createPhonePeOAuthClient } = await import("@/app/lib/phonepe-oauth");
    const phonePeClient = createPhonePeOAuthClient();
    
    const merchantOrderId = 'CP5NJUUVMFB';
    
    console.log(`Testing Order Status for Merchant Order ID: ${merchantOrderId}`);
    
    const results: any = {
      merchantOrderId,
      tests: {}
    };
    
    // Test without details parameter
    console.log('1. Testing without details parameter:');
    try {
      const responseWithoutDetails = await phonePeClient.getOrderStatus(merchantOrderId, false);
      results.tests.withoutDetails = {
        success: true,
        response: responseWithoutDetails
      };
      console.log('Response without details:', JSON.stringify(responseWithoutDetails, null, 2));
    } catch (error: any) {
      results.tests.withoutDetails = {
        success: false,
        error: error.message
      };
      console.error('Error without details:', error.message);
    }
    
    // Test with details parameter
    console.log('2. Testing with details=true parameter:');
    try {
      const responseWithDetails = await phonePeClient.getOrderStatus(merchantOrderId, true);
      results.tests.withDetails = {
        success: true,
        response: responseWithDetails
      };
      console.log('Response with details:', JSON.stringify(responseWithDetails, null, 2));
      
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
      console.error('Error with details:', error.message);
      console.error('Full error:', error);
    }
    
    return NextResponse.json(results, { status: 200 });
    
  } catch (error: any) {
    console.error('Test failed:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      message: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}