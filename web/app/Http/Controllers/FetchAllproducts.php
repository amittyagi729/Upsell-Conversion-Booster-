<?php 
// app/Http/Controllers/FetchAllproducts.php
namespace App\Http\Controllers;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
class FetchAllproducts extends Controller
{
public function getAllProductsGraphQL(Request $request)
{
    $getshopifytoken = DB::table('sessions')->orderBy('id', 'desc')->first();
    $shopifyApiToken = $getshopifytoken->access_token;
    $shopifyshop = $getshopifytoken->shop;

    $after = $request->input('after'); // cursor for pagination
    $before = $request->input('before'); // previous page cursor
    $limit = 5; // Shopify GraphQL max is 250, but 100 is safer

    // Build pagination part
    if ($after) {
    $pagination = "first: $limit, after: \"$after\"";
} elseif ($before) {
    $pagination = "last: $limit, before: \"$before\"";
} else {
    $pagination = "first: $limit";
}

    // GraphQL query
    $graphqlQuery = <<<GRAPHQL
    {
      products($pagination) {
        edges {
          cursor
          node {
            id
            title
            handle
            status
            templateSuffix
            variants(first: 5) {
              edges {
                node {
                  id
                  title
                  price
                  availableForSale
                }
              }
            }
            images(first: 1) {
              edges {
                node {
                  src
                  altText
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
    GRAPHQL;

    // Send GraphQL request
    $response = Http::withHeaders([
        'X-Shopify-Access-Token' => $shopifyApiToken,
        'Content-Type' => 'application/json',
    ])->post("https://$shopifyshop/admin/api/2025-07/graphql.json", [
        'query' => $graphqlQuery
    ]);

    if ($response->successful()) {
        return response()->json($response->json());
    } else {
        return response()->json(['error' => 'Failed to retrieve products'], $response->status());
    }
}


}