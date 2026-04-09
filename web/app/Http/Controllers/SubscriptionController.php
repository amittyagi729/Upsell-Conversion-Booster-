<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class SubscriptionController extends Controller
{
    public function checkSubscription(Request $request, $shop)
    {
        // echo $shop;
        // die;
        // dd($request);
        //  die;
        // Extract the 'shop' parameter from the request
        //$shop = $request->input('shop');
        //$shop = 'devteammase.myshopify.com';
        // Make a request to Shopify's API to retrieve subscription information

        $getshopifytoken = DB::table('sessions')
        ->where('shop', '=', $shop) // Add your condition here
        ->orderBy('id', 'desc')
        ->first();
   
        $response = Http::withHeaders([
            'X-Shopify-Access-Token' => $getshopifytoken->access_token,
        ])->get("https://{$shop}/admin/api/2024-01/recurring_application_charges.json");
//dd($response);
        if ($response->successful()) {
            // Extract subscription data from the response
            $subscriptionData = $response->json()['recurring_application_charges'];

            // Initialize variables for subscription status and redirect URL
            $hasActiveSubscription = false;
            $redirectUrl = '';

            foreach ($subscriptionData as $charge) {
                if ($charge['status'] === 'active') {
                    // Found an active subscription, set the flag to true
                    $hasActiveSubscription = true;
                    // Redirect to return URL of active charge
                    $redirectUrl = $charge['return_url'];
                    break; // No need to continue searching
                } elseif ($charge['status'] === 'pending' && empty($redirectUrl)) {
                    // Found a pending subscription and not already redirected, set the redirect URL
                    $redirectUrl = $charge['confirmation_url'];
                } elseif (in_array($charge['status'], ['cancelled', 'declined']) && empty($redirectUrl)) {
                    // For cancelled or declined charges, set the redirect URL to a custom URL or handle as needed
                    $redirectUrl = 'https://your-domain.com/custom-redirect-url'; // Replace with your custom URL
                }
            }
//echo $redirectUrl;
//die;
            // If no active or pending subscription found, set the redirect URL to the confirmation URL of the first charge
            if (!$hasActiveSubscription && empty($redirectUrl) && count($subscriptionData) > 0) {
                $redirectUrl = $subscriptionData[0]['confirmation_url'];
            }

            // Return response indicating subscription status and redirect URL
            return response()->json([
                'hasActiveSubscription' => $hasActiveSubscription,
                'redirectUrl' => $redirectUrl,
            ]);
        } else {
            // Handle error response from Shopify's API
            return response()->json(['error' => 'Failed to retrieve subscription data'], $response->status());
        }
    }
}
