<?php
// app/Http/Controllers/ApiController.php
namespace App\Http\Controllers;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;
//use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use App\Models\Session;

//use Illuminate\Support\Facades\ParallelRequests;
use GuzzleHttp\Client;
use GuzzleHttp\Promise;
use GuzzleHttp\Promise\Utils;

class ApiController extends Controller
{

    public function getProductLinks33(Request $request)
    {
        // Get the Shopify API access token and shop from the request
        $session = $request->get('shopifySession');
        $getshopifytoken = DB::table('sessions')->orderBy('id', 'desc')->first();
        $shopifyApiToken = $getshopifytoken->access_token;
        $shopifyshop = $getshopifytoken->shop;
        //$adsParamValue = $this->fetchShopifyData($request);
        $query = $request->input('query');

        // Build the URL for fetching products
        if (!empty($query)) {
            $url = "https://$shopifyshop/admin/api/2023-07/products.json?limit10&" . $query;
        } else {
            $url = "https://$shopifyshop/admin/api/2023-07/products.json?limit=10";
        }

        // Make the API request to fetch products
        $response = Http::withHeaders([
            'X-Shopify-Access-Token' => $shopifyApiToken,
        ])->get($url);


        // Step 1: Fetch Theme ID
        $themeResponse = Http::withHeaders([
            'X-Shopify-Access-Token' => $shopifyApiToken,
        ])->get('https://' . $shopifyshop . '/admin/api/2023-07/themes.json');

        $themes = json_decode($themeResponse->body(), true);
        // Assuming you want to get the current theme ID
        $mainThemeIds = array();
        if (isset($themes['themes'])) {
            foreach ($themes['themes'] as $theme) {
                if (isset($theme['role']) && $theme['role'] === 'main') {
                    $mainThemeIds[] = $theme['id'];
                }
            }
        }
        // ... (Previous code remains the same)

        if ($response->successful()) {
            $data = $response->json();
            $products = $data['products'];

            // Create an array to store promises
            $promises = [];

            foreach ($products as $product) {
                if ($product['template_suffix'] !== null) {
                    $templateName = '.' . $product['template_suffix'];
                }

                // Define the URL for each product
                $url = "https://$shopifyshop/admin/api/2023-07/themes/{$mainThemeIds[0]}/assets.json?asset[key]=templates/product$templateName.json";

                // Add a promise to the array
                $promises[] = Http::withHeaders([
                    'X-Shopify-Access-Token' => $shopifyApiToken,
                ])->get($url);
            }

            // Wait for all promises to complete using the `wait` method
            $responses = Promise\Utils::unwrap($promises);

            // // You can access each response using the key of the promise
            // echo $responses['image']->getHeader('Content-Length')[0];
            // echo $responses['png']->getHeader('Content-Length')[0];

            // Wait for the requests to complete, even if some of them fail
            $responses = Promise\Utils::settle($promises)->wait();


            // $responses = collect($promises)->map(function ($promise) {
            //     return $promise->wait();
            // });

            foreach ($responses as $key => $response) {
                // Process the response for each product
                if ($response->successful()) {
                    $data = $response->json();
                    $sectionid = $data['order'][0];
                    $blockid = $data['sections'][$sectionid]['block_order'][0];
                    $adsParamValue = $data['sections'][$sectionid]['blocks'][$blockid]['settings']['adsparam'];
                    $products[$key]['ads_param'] = $adsParamValue;
                }
            }

            // Extract the 'Link' header and return the response
            $linkHeader = $response->header('Link');
            $combinedLinks = [];
            $links = explode(',', $linkHeader);

            // ... (Extract and process the links as before)

            return response()->json(['products' => $products, 'combined_links' => $combinedLinks]);
        }

        return response()->json(['error' => 'Failed to retrieve products'], $response->status());


    }


    public function submitData(Request $request)
    {
        $data = $request->all();

        // Validate the incoming data
        $request->validate([
            'name' => 'required|string',
            'template_suffix' => 'required|string|unique:products,value',
            // Add more validation rules as needed
        ]);

        // Store the data in the SQLite database
        DB::table('products')->insert([
            'name' => $data['name'],
            'value' => $data['template_suffix']
            // Add more fields as needed
        ]);

        return response()->json(['message' => 'Data stored successfully']);
    }
    public function retrieveData()
    {
        // Fetch data from the SQLite database
        $data = DB::table('products')->get();

        return response()->json($data);
    }

    public function deleteData($id)
    {
        // Delete data from the SQLite database based on ID
        DB::table('products')->where('id', $id)->delete();

        return response()->json(['message' => 'Data deleted successfully']);
    }


//10-09-2025
public function searchProducts(Request $request)
{
    $session = $request->get('shopifySession');
    $getshopifytoken = DB::table('sessions')->orderBy('id', 'desc')->first();
    $shopifyApiToken = $getshopifytoken->access_token;
    $shopifyshop = $getshopifytoken->shop;

    $query = $request->input('title');
    $query2 = $request->input('temp');

    // GraphQL query
    $graphqlQuery = <<<GRAPHQL
{
  products(first:10, query: "title:$query* OR template_suffix:$query2") {
    edges {
      node {
        id
        title
        handle
        templateSuffix
      }
    }
  }
}
GRAPHQL;

    $response = Http::withHeaders([
        'X-Shopify-Access-Token' => $shopifyApiToken,
    ])->post("https://$shopifyshop/admin/api/2025-07/graphql.json", [
        'query' => $graphqlQuery,
    ]);

    if ($response->successful()) {
        $data = $response->json();
        $products = $data['data']['products']['edges'];

        // Get main theme
        $themeResponse = Http::withHeaders([
            'X-Shopify-Access-Token' => $shopifyApiToken,
        ])->get("https://$shopifyshop/admin/api/2025-07/themes.json");

        $themes = json_decode($themeResponse->body(), true);
        $mainThemeIds = [];
        if (isset($themes['themes'])) {
            foreach ($themes['themes'] as $theme) {
                if (isset($theme['role']) && $theme['role'] === 'main') {
                    $mainThemeIds[] = $theme['id'];
                }
            }
        }

        $client = new Client();
        $headers = ['X-Shopify-Access-Token' => $shopifyApiToken];
        $promises = [];
        $filteredProducts = [];

        foreach ($products as $product) {
            $node = $product['node'];
            $templateName = $node['templateSuffix'] == null ? '' : '.' . $node['templateSuffix'];
            $assetUrl = "https://$shopifyshop/admin/api/2025-07/themes/{$mainThemeIds[0]}/assets.json?asset[key]=templates/product{$templateName}.json";

            $promises[] = $client->getAsync($assetUrl, ['headers' => $headers]);
            $filteredProducts[] = [
                'id' => $node['id'],
                'title' => $node['title'],
                'handle' => $node['handle'],
                'template_suffix' => $node['templateSuffix'],
            ];
        }

        $results = Utils::settle($promises)->wait();

        foreach ($results as $key => $result) {
            if ($result['state'] === 'fulfilled') {
                $assetResponse = $result['value'];
                $data = json_decode($assetResponse->getBody(), true);

                if (!isset($data['asset']['value'])) {
                    $filteredProducts[$key]['ads_param'] = 'No template data';
                    continue;
                }

                $nestedValue = json_decode($data['asset']['value'], true);

                // Check if order and block_order exist
                if (isset($nestedValue['order'][0])) {
                    $sectionid = $nestedValue['order'][0];

                    if (
                        isset($nestedValue['sections'][$sectionid]['block_order'][0]) &&
                        isset($nestedValue['sections'][$sectionid]['blocks'])
                    ) {
                        $blockid = $nestedValue['sections'][$sectionid]['block_order'][0];

                        if (isset($nestedValue['sections'][$sectionid]['blocks'][$blockid]['settings']['adsparam'])) {
                            $adsParamValue = $nestedValue['sections'][$sectionid]['blocks'][$blockid]['settings']['adsparam'];
                            $filteredProducts[$key]['ads_param'] = $adsParamValue;
                        } else {
                            $filteredProducts[$key]['ads_param'] = 'adsparam not found';
                        }
                    } else {
                        $filteredProducts[$key]['ads_param'] = 'block_order missing';
                    }
                } else {
                    $filteredProducts[$key]['ads_param'] = 'order missing';
                }
            } else {
                $filteredProducts[$key]['ads_param'] = 'Failed to fetch ads parameter';
            }
        }

        return response()->json(['products' => $filteredProducts]);
    } else {
        return response()->json(['error' => 'Failed to retrieve products'], $response->status());
    }
}



    public function getProducts(Request $request)
    {
        // Assuming you have a Shopify session in the request
        $session = $request->get('shopifySession');

        // Get the Shopify access token and shop from your database
        $getshopifytoken = DB::table('sessions')->orderBy('id', 'desc')->first();
        $shopifyApiToken = $getshopifytoken->access_token;
        $shopifyshop = $getshopifytoken->shop;

        $products = [];
        $pageSize = 50; // Maximum products per page
        $cursor = $request->input('cursor'); // Get the cursor from the request
        $previousCursor = $request->input('previousCursor'); // Get the previous cursor from the request

        $queryParams = [
            'limit' => $pageSize,
            'status' => 'active',
        ];

        // Use the 'created_at_min' and 'created_at_max' parameters for cursor-based pagination
        if ($cursor) {
            $queryParams['created_at_min'] = $cursor;
        } elseif ($previousCursor) {
            $queryParams['created_at_max'] = $previousCursor;
        }

        $response = Http::withHeaders([
            'X-Shopify-Access-Token' => $shopifyApiToken,
        ])->get("https://$shopifyshop/admin/api/2025-07/products.json", $queryParams);

        if ($response->successful()) {
            $data = $response->json();
            $products = $data['products'];

            $fieldsToSkip = ['vendor', 'created_at', 'body_html', 'updated_at', 'published_at', 'status', 'published_scope', 'tags', 'variants', 'options', 'images', 'image', 'admin_graphql_api_id'];

            // Filter out the specified fields from each product
            $filteredProducts = [];

            foreach ($products as $product) {
                //print_r($product);
                $filteredProduct = [];
                foreach ($product as $key => $value) {
                    if (!in_array($key, $fieldsToSkip)) {
                        $filteredProduct[$key] = $value;
                    }
                }
                $filteredProducts[] = $filteredProduct;
            }
        } else {
            // Handle API request error
            return response()->json(['error' => 'Failed to retrieve products'], $response->status());
        }

        // Extract the cursor for the next and previous pages
        $nextCursor = end($products)['created_at'] ?? null;
        $previousCursor = count($products) > 0 ? $products[0]['created_at'] : null;

        return response()->json(['products' => $filteredProducts, 'nextCursor' => $nextCursor, 'previousCursor' => $previousCursor]);
    }

    public function getProductsByPage(Request $request)
    {
        // Get the Shopify API access token and shop from the request
        $session = $request->get('shopifySession');
        $getshopifytoken = DB::table('sessions')->orderBy('id', 'desc')->first();
        $shopifyApiToken = $getshopifytoken->access_token;
        $shopifyshop = $getshopifytoken->shop;

        // Initialize an array to store all products
        $allProducts = [];

        // Initialize a page cursor variable
        $pageCursor = null;

        do {
            // Build the URL for fetching products
            $url = "https://$shopifyshop/admin/api/2025-07/products.json?status=active&limit=250";

            // Add the page cursor if available
            if ($pageCursor) {
                $url .= "&page_info=" . urlencode($pageCursor);
            }
            echo $url;
            // Make the API request to fetch products
            $response = Http::withHeaders([
                'X-Shopify-Access-Token' => $shopifyApiToken,
            ])->get($url);
            if ($response->successful()) {
                $data = $response->json();
                $products = $data['products'];
                // Append the products to the allProducts array
                $allProducts = array_merge($allProducts, $products);
                // Extract the 'Link' header and parse it to get the next page cursor
                $linkHeader = $response->header('Link');
                preg_match('/<([^>]+)>; rel="next"/', $linkHeader, $matches);
                $pageCursor = !empty($matches[1]) ? parse_url($matches[1], PHP_URL_QUERY) : null;
            } else {
                return response()->json(['error' => 'Failed to retrieve products'], $response->status());
            }
        } while ($pageCursor);

        return response()->json(['products' => $allProducts, 'link' => $pageCursor]);
    }

    public function getAllProducts(Request $request)
    {
        $session = $request->get('shopifySession');
        $getshopifytoken = DB::table('sessions')->orderBy('id', 'desc')->first();
        $shopifyApiToken = $getshopifytoken->access_token;
        $shopifyshop = $getshopifytoken->shop;

        $queryParams = [
            'limit' => 250,
            // Maximum products per page
            'status' => 'any',
        ];

        $response = Http::withHeaders([
            'X-Shopify-Access-Token' => $shopifyApiToken,
        ])->get("https://$shopifyshop/admin/api/2025-07/products.json", $queryParams);

        if ($response->successful()) {
            $data = $response->json();
            $products = $data['products'];
            //print_r($products);
            // die;

            $fieldsToSkip = ['vendor', 'created_at', 'body_html', 'updated_at', 'published_at', 'status', 'published_scope', 'tags', 'variants', 'options', 'images', 'image', 'admin_graphql_api_id'];

            // Filter out the specified fields from each product
            $filteredProducts = [];
            foreach ($products as &$product) {
                $product['aaaaaaaaaa'] = 'vdsgdshdhdh';
                //print_r($product);
                $filteredProduct = [];
                foreach ($product as $key => $value) {
                    if (!in_array($key, $fieldsToSkip)) {
                        $filteredProduct[$key] = $value;
                    }
                }
                $filteredProducts[] = $filteredProduct;
            }
            return response()->json(['products' => $filteredProducts]);
        } else {
            // Handle API request error
            return response()->json(['error' => 'Failed to retrieve products'], $response->status());
        }
    }

    public function getAllProducts2(Request $request)
    {
        // Assuming you have a Shopify session in the request
        $session = $request->get('shopifySession');

        // Get the Shopify access token and shop from your database
        $getshopifytoken = DB::table('sessions')->orderBy('id', 'desc')->first();
        $shopifyApiToken = $getshopifytoken->access_token;
        $shopifyshop = $getshopifytoken->shop;

        $products = [];
        $pageSize = 250; // Maximum products per page
        $cursor = $request->input('cursor'); // Get the cursor from the request

        $filteredProducts = [];

        $queryParams = [
            'limit' => $pageSize,
            'status' => 'active',
        ];

        // If a cursor is present, set it to fetch the next page
        if ($cursor) {
            $queryParams['created_at_min'] = $cursor;
        }

        $response = Http::withHeaders([
            'X-Shopify-Access-Token' => $shopifyApiToken,
        ])->get("https://$shopifyshop/admin/api/2025-07/products.json", $queryParams);

        if ($response->successful()) {
            $data = $response->json();
            $pageProducts = $data['products'];

            $fieldsToSkip = ['vendor', 'created_at', 'body_html', 'updated_at', 'published_at', 'status', 'published_scope', 'tags', 'variants', 'options', 'images', 'image', 'admin_graphql_api_id'];

            // Filter out the specified fields from each product
            foreach ($pageProducts as $product) {
                $filteredProduct = [];
                foreach ($product as $key => $value) {
                    if (!in_array($key, $fieldsToSkip)) {
                        $filteredProduct[$key] = $value;
                    }
                }
                $filteredProducts[] = $filteredProduct;
            }

            // Extract the cursor for the next and previous pages
            $nextCursor = end($pageProducts)['created_at'] ?? null;
            $previousCursor = count($pageProducts) > 0 ? $pageProducts[0]['created_at'] : null;

            return response()->json([
                'products' => $filteredProducts,
                'nextCursor' => $nextCursor,
                'previousCursor' => $previousCursor,
            ]);
        } else {
            // Handle API request error
            return response()->json(['error' => 'Failed to retrieve products'], $response->status());
        }
    }

    public function fetchProducts(Request $request)
    {
        // Assuming you have a Shopify session in the request
        $session = $request->get('shopifySession');

        // Get the Shopify access token and shop from your database
        $getshopifytoken = DB::table('sessions')->orderBy('id', 'desc')->first();
        $shopifyApiToken = $getshopifytoken->access_token;
        $shopifyshop = $getshopifytoken->shop;


        $limit = $request->query('limit', 3);
        $pageInfo = $request->query('page_info', '');


        // Create the base URL for Shopify API
        $baseUrl = "https://$shopifyshop/admin/api/2025-07/products.json";

        // Create an array to store products
        $products = [];

        // Perform multiple requests for paginated data
        do {
            // Build the URL with query parameters
            $url = $baseUrl . "?limit=$limit&page_info=$pageInfo";

            // Make a GET request to Shopify's API
            $response = Http::withHeaders([
                'X-Shopify-Access-Token' => $shopifyApiToken,
            ])->get($url);
            //print_r($response);
            //die;
            if ($response->successful()) {
                $data = $response->json();
                $products = array_merge($products, $data['products']);

                // Check for Link headers for pagination
                $linkHeaders = $response->header('Link');
                preg_match('/<([^>]+)>;\s*rel="next"/', $linkHeaders, $matches);

                if (!empty($matches)) {
                    // Extract the next page_info for the next request
                    $nextPageInfo = explode('page_info=', $matches[1])[1];
                    $pageInfo = $nextPageInfo;
                } else {
                    // No more pages, break the loop
                    break;
                }
            } else {
                // Handle API request error
                return response()->json(['error' => 'Failed to retrieve products'], $response->status());
            }
        } while (false);

        return response()->json(['products' => $products]);
    }

    public function getProductLinks(Request $request)
    {
        // Get the Shopify API access token and shop from the request
        $session = $request->get('shopifySession');
        $getshopifytoken = DB::table('sessions')->orderBy('id', 'desc')->first();
        $shopifyApiToken = $getshopifytoken->access_token;
        $shopifyshop = $getshopifytoken->shop;
        $query = $request->input('query');


        // Build the URL for fetching products
        if (!empty($query)) {
            $url = "https://$shopifyshop/admin/api/2025-07/products.json?limit=100&" . $query;
        } else {
            $url = "https://$shopifyshop/admin/api/2025-07/products.json?limit=100";
        }

        // Make the API request to fetch products
        $response = Http::withHeaders([
            'X-Shopify-Access-Token' => $shopifyApiToken,
        ])->get($url);

        if ($response->successful()) {
            $data = $response->json();
            $products = $data['products'];
            // Extract the 'Link' header
            $linkHeader = $response->header('Link');
            $combined_links = [];
            $links = explode(',', $linkHeader);
            foreach ($links as $link) {
                if (preg_match('#<(http(?:s)?:\/\/.*\.myshopify.com\/.*products.json\?.*)>;.*rel=\\"(.*)\\"#', $link, $matches)) {
                    $queryString = parse_url($matches[1], PHP_URL_QUERY);
                    $queryParams = explode('&', $queryString);
                    $combined_links[$matches[2]] = $queryParams[1];
                }
            }
            // Return the 'Link' header as a JSON response
            return response()->json(['products' => $products, $combined_links]);
        } else {
            return response()->json(['error' => 'Failed to retrieve products'], $response->status());
        }
    }


    public function productsDownload(Request $request)
    {
        $session = $request->get('shopifySession');
        $getshopifytoken = DB::table('sessions')->orderBy('id', 'desc')->first();
        $shopifyApiToken = $getshopifytoken->access_token;
        $shopifyshop = $getshopifytoken->shop;
        $client = new Client();
        $products = [];

        $limit = 250;
        $sinceId = 0;

        do {
            $url = 'https://' . $shopifyshop . '/admin/api/2025-07/products.json';

            $response = Http::withHeaders([
                'X-Shopify-Access-Token' => $shopifyApiToken,
            ])->get($url, [
                        'limit' => $limit,
                        'since_id' => $sinceId,
                    ]);

            $data = $response->json();
            $newProducts = $data['products'];
            $cutitle = [];
            foreach ($newProducts as $newProducts2) {
                if ($newProducts2['template_suffix'] == '' ) {
                    $templateName = 'default_ads';
                } else {
                    $templateName = $newProducts2['template_suffix'];

                }

                $cutitle[] = $templateName;
            }

            if (empty($newProducts)) {
                break;
            }
            $ARRAY = array('adsparam' => $templateName);

            // Create an array with the 'adsparam' key for each product
            $adsParams = array_fill(0, count($newProducts), $ARRAY);

            // Combine the products array with the adsParams array
            $combinedProducts = array_map(function ($product, $adsParam) {
                return array_merge($product, $adsParam);
            }, $newProducts, $adsParams);

            // Merge the combined array with the main products array
            $products = array_merge($products, $combinedProducts);
            $sinceId = end($newProducts)['id'] + 1;
        } while (count($newProducts) >= $limit);

        $fieldsToSkip = ['vendor', 'created_at', 'body_html', 'updated_at', 'published_at', 'status', 'published_scope', 'tags', 'variants', 'options', 'images', 'image', 'admin_graphql_api_id'];

        // Filter out the specified fields from each product
        $filteredProducts = [];
        foreach ($products as $product) {
            //print_r($product);
            $filteredProduct = [];
            foreach ($product as $key => $value) {
                if (!in_array($key, $fieldsToSkip)) {
                    $filteredProduct[$key] = $value;
                }
            }
            $filteredProducts[] = $filteredProduct;
        }
        return response()->json(['products' => $filteredProducts]);
    }

    public function fetchShopifyData(Request $request)
    {
        $getshopifytoken = DB::table('sessions')
            ->orderBy('id', 'desc')->first();
        $shopifyApiToken = $getshopifytoken->access_token;
        $shopifyshop = 'https://' . $getshopifytoken->shop;

        // $datatemp = $request->all();
        // if($datatemp['selectedOption'] == 'Default Template'){
        //     $templateName=''; 
        // }else{$templateName= '.'.$datatemp['selectedOption'];}

        // Step 1: Fetch Theme ID
        $themeResponse = Http::withHeaders([
            'X-Shopify-Access-Token' => $shopifyApiToken,
        ])->get($shopifyshop . '/admin/api/2023-07/themes.json');

        $themes = json_decode($themeResponse->body(), true);

        // Assuming you want to get the current theme ID
        $mainThemeIds = array();
        if (isset($themes['themes'])) {
            foreach ($themes['themes'] as $theme) {
                if (isset($theme['role']) && $theme['role'] === 'main') {
                    $mainThemeIds[] = $theme['id'];
                }
            }
        }
        // Step 2: Fetch Assets Using Theme ID
// $assetResponse = Http::withHeaders([
//         'X-Shopify-Access-Token' => $shopifyApiToken,
//     ])->get($shopifyshop."/admin/api/2023-07/themes/$mainThemeIds[0]/assets.json?asset[key]=templates/product$templateName.json");

        $assetResponse = Http::withHeaders([
            'X-Shopify-Access-Token' => $shopifyApiToken,
        ])->get($shopifyshop . "/admin/api/2025-07/themes/$mainThemeIds[0]/assets.json?asset[key]=templates/product.needle-template.json");
        $data = json_decode($assetResponse, true);

        $nestedValue = json_decode($data['asset']['value'], true);

        $sectionid = $nestedValue['order'][0];
        $blockid = $nestedValue['sections'][$sectionid]['block_order'][0];
        $adsParamValue = $nestedValue['sections'][$sectionid]['blocks'][$blockid]['settings']['adsparam'];
        return response()->json($adsParamValue);
    }


    public function getProductLinks22(Request $request)
    {
        // Get the Shopify API access token and shop from the request
        $session = $request->get('shopifySession');
        $getshopifytoken = DB::table('sessions')->orderBy('id', 'desc')->first();
        $shopifyApiToken = $getshopifytoken->access_token;
        $shopifyshop = $getshopifytoken->shop;
        //$adsParamValue = $this->fetchShopifyData($request);
        $query = $request->input('query');
        // Build the URL for fetching products
        if (!empty($query)) {
            $url = "https://$shopifyshop/admin/api/2025-07/products.json?limit5&" . $query;
        } else {
            $url = "https://$shopifyshop/admin/api/2025-07/products.json?limit=5";
        }
        // Make the API request to fetch products
        $response = Http::withHeaders([
            'X-Shopify-Access-Token' => $shopifyApiToken,
        ])->get($url);
        // Step 1: Fetch Theme ID
        $themeResponse = Http::withHeaders([
            'X-Shopify-Access-Token' => $shopifyApiToken,
        ])->get('https://' . $shopifyshop . '/admin/api/2025-07/themes.json');
        $themes = json_decode($themeResponse->body(), true);
        // Assuming you want to get the current theme ID
        $mainThemeIds = array();
        if (isset($themes['themes'])) {
            foreach ($themes['themes'] as $theme) {
                if (isset($theme['role']) && $theme['role'] === 'main') {
                    $mainThemeIds[] = $theme['id'];
                }
            }
            if ($response->successful()) {
                $data = $response->json();
                $products = $data['products'];
                // Loop through the products and add adsParamValue to each product
                $templateName = '';
                foreach ($products as &$product) {
                    if ($product['template_suffix'] == null) {
                        $templateName = '';
                    } else {
                        $templateName = '.' . $product['template_suffix'];
                    }
                    //$templateName='.needle-template';
                    // Step 2: Fetch Assets Using Theme ID
                    $assetResponse = Http::withHeaders([
                        'X-Shopify-Access-Token' => $shopifyApiToken,
                    ])->get('https://' . $shopifyshop . "/admin/api/2025-07/themes/$mainThemeIds[0]/assets.json?asset[key]=templates/product$templateName.json");   
                    $data = json_decode($assetResponse, true);
                    $nestedValue = json_decode($data['asset']['value'], true);
                    $sectionid = $nestedValue['order'][0];
                    $blockid = $nestedValue['sections'][$sectionid]['block_order'][0];
                    $adsParamValue = $nestedValue['sections'][$sectionid]['blocks'][$blockid]['settings']['adsparam'];
                    $product['ads_param'] = $adsParamValue;
                }
            }
            // Extract the 'Link' header
            $linkHeader = $response->header('Link');
            $combined_links = [];
            $links = explode(',', $linkHeader);
            foreach ($links as $link) {
                if (preg_match('#<(http(?:s)?:\/\/.*\.myshopify.com\/.*products.json\?.*)>;.*rel=\\"(.*)\\"#', $link, $matches)) {
                    $queryString = parse_url($matches[1], PHP_URL_QUERY);
                    $queryParams = explode('&', $queryString);
                    $combined_links[$matches[2]] = $queryParams[1];
                }
            }
            // Return the 'Link' header as a JSON response
            return response()->json(['products' => $products, 'combined_links' => $combined_links]);
        } else {
            return response()->json(['error' => 'Failed to retrieve products'], $response->status());
        }
    }

    // New function to get product links with parallel requests
   public function getProductLinksParallel(Request $request)
{
    //$session = $request->get('shopifySession');
    //$shopifyshop = $session->getShop();
    $getshopifytoken = DB::table('sessions')->orderBy('id', 'desc')->first();
    $shopifyApiToken = $getshopifytoken->access_token;
    $shopifyshop = $getshopifytoken->shop;
  
    $query = $request->input('query');

    // Build the URL for fetching products
    $url = !empty($query)
        ? "https://$shopifyshop/admin/api/2025-07/products.json?limit=15&" . $query
        : "https://$shopifyshop/admin/api/2025-07/products.json?limit=15";

    // Make the initial API request to fetch products
    $response = Http::withHeaders([
        'X-Shopify-Access-Token' => $shopifyApiToken,
    ])->get($url);

    if ($response->successful()) {
        $data = $response->json();
        $products = $data['products'];
        $combined_links = [];

        // Fetch the main theme ID
        $themeResponse = Http::withHeaders([
            'X-Shopify-Access-Token' => $shopifyApiToken,
        ])->get("https://$shopifyshop/admin/api/2025-07/themes.json");

        $themes = json_decode($themeResponse->body(), true);
        $mainThemeIds = [];
        if (isset($themes['themes'])) {
            foreach ($themes['themes'] as $theme) {
                if (isset($theme['role']) && $theme['role'] === 'main') {
                    $mainThemeIds[] = $theme['id'];
                }
            }
        }

        // Use Guzzle to send parallel requests for each product
        $client = new Client();
        $headers = ['X-Shopify-Access-Token' => $shopifyApiToken];
        $promises = [];

        foreach ($products as &$product) {
            $templateName = $product['template_suffix'] == null ? '' : '.' . $product['template_suffix'];
            $assetUrl = "https://$shopifyshop/admin/api/2025-07/themes/{$mainThemeIds[0]}/assets.json?asset[key]=templates/product{$templateName}.json";
            $promises[] = $client->getAsync($assetUrl, ['headers' => $headers]);
        }

        $results = Utils::settle($promises)->wait();

        foreach ($results as $key => $result) {
            if ($result['state'] === 'fulfilled') {
                $assetResponse = $result['value'];
                $data = json_decode($assetResponse->getBody(), true);

                if (!isset($data['asset']['value'])) {
                    $products[$key]['ads_param'] = 'No template data';
                    continue;
                }

                $nestedValue = json_decode($data['asset']['value'], true);

                // Safely check if order exists
                if (isset($nestedValue['order'][0])) {
                    $sectionid = $nestedValue['order'][0];

                    if (
                        isset($nestedValue['sections'][$sectionid]['block_order'][0]) &&
                        isset($nestedValue['sections'][$sectionid]['blocks'])
                    ) {
                        $blockid = $nestedValue['sections'][$sectionid]['block_order'][0];

                        if (isset($nestedValue['sections'][$sectionid]['blocks'][$blockid]['settings']['adsparam'])) {
                            $products[$key]['ads_param'] = $nestedValue['sections'][$sectionid]['blocks'][$blockid]['settings']['adsparam'];
                        } else {
                            $products[$key]['ads_param'] = 'adsparam not found';
                        }
                    } else {
                        $products[$key]['ads_param'] = 'block_order missing';
                    }
                } else {
                    $products[$key]['ads_param'] = 'order missing';
                }
            } else {
                $products[$key]['ads_param'] = 'Failed to fetch ads parameter';
            }
        }

        // Parse the 'Link' header for pagination links
        $linkHeader = $response->header('Link');

        if ($linkHeader) {
            $links = explode(',', $linkHeader);

            foreach ($links as $link) {
                if (preg_match('#<(http(?:s)?:\/\/.*\.myshopify.com\/.*products.json\?.*)>;.*rel=\\"(.*)\\"#', $link, $matches)) {
                    $queryString = parse_url($matches[1], PHP_URL_QUERY);
                    $queryParams = explode('&', $queryString);
                    $combined_links[$matches[2]] = $queryParams[1];
                }
            }
        }

        return response()->json([
            'products' => $products,
            'combined_links' => $combined_links
        ]);
    } else {
        return response()->json(['error' => 'Failed to retrieve products'], $response->status());
    }
}


public function runBulkOperation(Request $request)
    {
        // Get your Shopify API credentials from the request or config
        $shopifySession = $request->get('shopifySession');
    $getshopifytoken = DB::table('sessions')->orderBy('id', 'desc')->first();
    $shopifyApiToken = $getshopifytoken->access_token;
    $shopifyShop= $getshopifytoken->shop;

        // Define the GraphQL query to run as part of the bulk operation
        $queryToRun = <<<'GRAPHQL'
            {
                products {
                    edges {
                        node {
                            id
                            title
                        }
                    }
                }
            }
GRAPHQL;

        // Define the GraphQL mutation to run a bulk operation with the provided query
        $graphqlMutation = <<<'GRAPHQL'
        mutation {
            bulkOperationRunQuery(input: {
                query: """
                {
                    products {
                        edges {
                            node {
                                id
                                title
                            }
                        }
                    }
                }
                """
            }) {
                bulkOperation {
                    id
                    status
                }
                userErrors {
                    field
                    message
                }
            }
        }
GRAPHQL;

        // Send the GraphQL mutation to Shopify
        $response = Http::withHeaders([
            'X-Shopify-Access-Token' => $shopifyApiToken,
        ])->post("https://$shopifyShop/admin/api/2025-07/graphql.json", [
            'query' => $graphqlMutation,
        ]);

        if ($response->successful()) {
            $data = $response->json();
            dd( $data );
            die;
            $bulkOperation = $data['data']['bulkOperationRunQuery']['bulkOperation'];

            // Check the status of the bulk operation
            $bulkOperationId = $bulkOperation['id'];
            $bulkOperationStatus = $bulkOperation['status'];

            return response()->json([
                'message' => 'Bulk operation started successfully',
                'bulkOperationId' => $bulkOperationId,
                'bulkOperationStatus' => $bulkOperationStatus,
            ]);
        } else {
            return response()->json(['error' => 'Failed to start bulk operation'], $response->status());
        }
    }


}