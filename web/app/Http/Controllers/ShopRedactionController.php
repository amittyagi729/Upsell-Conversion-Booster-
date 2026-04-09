<?php
// app/Http/Controllers/ShopRedactionController.php

namespace App\Http\Controllers;

use App\Lib\Handlers\Gdpr\ShopRedact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ShopRedactionController extends Controller
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
            Log::error('Invalid or missing values in the webhook payload:', compact('topic', 'shop', 'body'));

            // Return a 401 Unauthorized response
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Create an instance of the ShopRedact class
        $shopRedactionHandler = new ShopRedact();
        // Call the handle method to process the redaction request
        $shopRedactionHandler->handle($topic, $shop, $body);
        // You can return a success response or perform other actions as needed
        return response()->json(['message' => 'Shop redaction webhook handled successfully']);
    }
}
