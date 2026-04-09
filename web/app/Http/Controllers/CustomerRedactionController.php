<?php 
// app/Http/Controllers/CustomerRedactionController.php

namespace App\Http\Controllers;

use App\Lib\Handlers\Gdpr\CustomersRedact;
use Illuminate\Http\Request;
class CustomerRedactionController extends Controller
{
    public function handle(Request $request)
    {
        $payload = $request->all();
        $shop = $payload['shop'] ?? null;
        $customerId = $payload['customer']['id'] ?? null;
        $ordersToRedact = $payload['orders_to_redact'] ?? [];

        // Check if any of the required values is null
        if ($shop === null || $customerId === null || empty($ordersToRedact)) {
            // Log the error
            \Log::error('Invalid or missing values in the redaction webhook payload:', compact('shop', 'customerId', 'ordersToRedact'));

            // Return a 401 Unauthorized response
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Log the entire payload
        \Log::info('Received redaction webhook payload:', compact('shop', 'customerId', 'ordersToRedact'));

        // Create an instance of the CustomerRedaction class
        $customerRedactionHandler = new CustomersRedact();

        // Call the handle method to process the redaction request
        $customerRedactionHandler->handle($shop, $customerId, $ordersToRedact);

        // You can return a success response or perform other actions as needed
        return response()->json(['message' => 'Redaction webhook handled successfully']);
    }
}
