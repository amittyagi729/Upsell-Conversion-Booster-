<?php 
// app/lib/Http/Controllers/CustomersDataController.php

namespace App\Http\Controllers;

use App\Lib\Handlers\Gdpr\CustomersDataRequest; // Adjust the namespace as needed
use Illuminate\Http\Request;
use Log;

class CustomersDataController extends Controller
{
    public function handle(Request $request)
    {
        $payload = $request->all();
        $topic = $payload['topic'] ?? null;
        $shop = $payload['shop'] ?? null;
        $body = $payload['body'] ?? [];

        // Check if any of the required values is null
        if ($topic === null || $shop === null || empty($body)) {
            // Log the error
            \Log::error('Invalid or missing values in the webhook payload:', compact('topic', 'shop', 'body'));

            // Return a 401 Unauthorized response
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Log the entire payload
        \Log::info('Received webhook payload:', compact('topic', 'shop', 'body'));

        // Create an instance of the CustomersDataRequest class
        $customersDataRequestHandler = new CustomersDataRequest();

        // Call the handle method to process the data request
        $customersDataRequestHandler->handle($topic, $shop, $body);

        // You can return a success response or perform other actions as needed
        return response()->json(['message' => 'Webhook handled successfully']);
    }
}
