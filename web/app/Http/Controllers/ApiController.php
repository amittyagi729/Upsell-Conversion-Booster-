<?php
// app/Http/Controllers/ApiController.php
namespace App\Http\Controllers;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;
//use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use App\Models\Session;
use GuzzleHttp\Client;
class ApiController extends Controller
{
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


public function getProducts(Request $request)
{
    $limit = $request->query('limit', 250);
    $session = $request->get('shopifySession');
    // Retrieve the access token  and shopurl from the database
    $apiToken = Session::whereNotNull('access_token')->value('access_token');
    $shopifyshop= Session::whereNotNull('shop')->value('shop');

    $client = new Client();
    $url = 'https://'.$shopifyshop.'/admin/api/2023-07/products.json';

    $response = Http::withHeaders([
        'X-Shopify-Access-Token' => $apiToken,
    ])->get($url, ['limit' => $limit]);

    $products = $response->json();
    return response()->json($products);
  
}

public function fetchShopifyData(Request $request)
{
    //$shop = ShopifyApp::shop();
    //$shopifyApiToken = env('SHOPIFY_API_TOKEN'); // Retrieve token from .env
    //$shopifyApiToken = ('shpua_4f4fba643e5deb95804662f22959d817');
    $getshopifytoken = DB::table('sessions')
            ->orderBy('access_token', 'desc')->first();
    $shopifyApiToken = $getshopifytoken->access_token;
    $shopifyshop = 'https://'.$getshopifytoken->shop;

    $datatemp = $request->all();
    if($datatemp['selectedOption'] == 'Default Template'){
        $templateName=''; 
    }else{$templateName= '.'.$datatemp['selectedOption'];}

    // Step 1: Fetch Theme ID
    $themeResponse = Http::withHeaders([
        'X-Shopify-Access-Token' => $shopifyApiToken,
    ])->get($shopifyshop.'/admin/api/2023-07/themes.json');

    $themes = json_decode($themeResponse->body(), true);
    
    // Assuming you want to get the current theme ID
$mainThemeIds = array();
if (isset( $themes['themes'])) {
    foreach ( $themes['themes'] as $theme) {
        if (isset($theme['role']) && $theme['role'] === 'main') {
            $mainThemeIds[] = $theme['id'];
        }
    }
} 
// Step 2: Fetch Assets Using Theme ID
$assetResponse = Http::withHeaders([
        'X-Shopify-Access-Token' => $shopifyApiToken,
    ])->get($shopifyshop."/admin/api/2023-07/themes/$mainThemeIds[0]/assets.json?asset[key]=templates/product$templateName.json");
   
    $data = json_decode($assetResponse, true);

    $nestedValue = json_decode($data['asset']['value'], true);

 $sectionid= $nestedValue['order'][0];
 $blockid= $nestedValue['sections'][$sectionid]['block_order'][0];
$adsParamValue = $nestedValue['sections'][$sectionid]['blocks'][$blockid]['settings']['adsparam'];
    return response()->json($adsParamValue);
}

}