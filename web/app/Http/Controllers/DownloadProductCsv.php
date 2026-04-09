<?php 
namespace App\Http\Controllers;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;
//use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use App\Models\Session;
use GuzzleHttp\Promise;
use GuzzleHttp\Promise\Utils;
//use Shopify\Utils;
use Exception;
use Illuminate\Http\Client\Response;


class DownloadProductCsv extends Controller
{
    // Replace with your actual values (store securely)

    protected $limit = 250;

    /**
     * Retrieve and process Shopify products.
     *
     * @param Request $request
     * @return Response
     */
    public function index(Request $request)
    {
        try {
            $session = $request->get('shopifySession');
            // Retrieve session data using a middleware (recommended for best practices)
            $shopUrl = $request->getShop();
            $accessToken = $request->getAccessToken();
            // Validate required parameters
            if (empty($shopUrl) || empty($accessToken)) {
                throw new Exception('Missing required parameters: shopUrl and accessToken');
            }

            // Retrieve all products
            $products = $this->retrieveAllProducts($shopUrl, $accessToken);

            // Process products (replace with your desired logic)
            $filteredProducts = [];
            $count = 0;
            foreach ($products as $product) {
                // Filter and prepare data (example: select specific fields)
                $filteredProduct = [
                    'couter' => $count,
                    'id' => $product['id'],
                    'title' => $product['title'],
                    'price' => $product['variants'][0]['price'],
                    'template_suffix' => $product['template_suffix'],
                ];
                $filteredProducts[] = $filteredProduct;
                $count++;
            }

            return response()->json(['products' => $filteredProducts]);

        } catch (Exception $e) {
            // Handle errors gracefully (e.g., log, notify, return appropriate response)
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Retrieve paginated product data using cursor-based pagination.
     *
     * @param string $shopUrl
     * @param string $accessToken
     * @param string $cursor (optional) - Cursor for next page
     * @return array - All retrieved products
     */
    protected function retrieveAllProducts(string $shopUrl, string $accessToken, string $cursor = null): array
    {
        $products = [];
        $hasNextPage = true;

        while ($hasNextPage) {
            $data = $this->getProducts($shopUrl, $accessToken, $cursor);

            if (!$data) {
                throw new Exception('Failed to retrieve products');
            }

            $products = array_merge($products, $data['products']);
            $cursor = $data['has_next'] ?? null; // Use null for missing keys
            $hasNextPage = !is_null($cursor);
        }

        return $products;
    }

    /**
     * Make a single API request to retrieve a page of products.
     *
     * @param string $shopUrl
     * @param string $accessToken
     * @param string $cursor (optional)
     * @return array|null - Associative array containing products data or null on error
     */
    protected function getProducts(string $shopUrl, string $accessToken, string $cursor = null): ?array
    {
        $url = "https://$shopUrl/admin/api/2023-07/products.json?limit=$this->limit";
        if ($cursor) {
            $url .= "&after=" . $cursor;
        }

        $client = new Client();
        $headers = [
            'X-Shopify-Access-Token' => $accessToken,
        ];

        try {
            $response = $client->get($url, ['headers' => $headers]);
            $data = json_decode($response->getBody(), true);

            if (isset($data['errors'])) {
                throw new Exception('API error: ' . json_encode($data['errors']));
            }

            return $data;
        } catch (Exception $e) {
            // Handle API errors gracefully (e.g., log, retry logic)
            // You may want to implement a retry mechanism or log the error here
            return null;
        }
    }
}
