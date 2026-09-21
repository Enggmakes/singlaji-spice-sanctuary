<?php
/**
 * Dynamic OpenGraph & WhatsApp Link Preview Handler for Singlaji
 * Serves rich meta preview cards to social media bots (WhatsApp, Facebook, Twitter, Telegram, LinkedIn)
 * Human users are automatically redirected to the full React single-page app.
 */

$supabaseUrl = "https://wsvhkgxgfhifmweqcpey.supabase.co";
$supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzdmhrZ3hnZmhpZm13ZXFjcGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NDczNDMsImV4cCI6MjA4NDMyMzM0M30.tIt0CjTgGnflRkw4sqw_h2E8JPsTyjf3lBsrJhUwco8";

$siteBase = "https://singlaji.in";
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$canonicalUrl = $siteBase . strtok($requestUri, '?');

// Default metadata
$title = "Singlaji Masala Store | Premium Pure Indian Spices";
$description = "Discover authentic, aromatic Indian masalas & spices from Abohar. Handcrafted Garam Masala, Turmeric, Red Chilli & specialty blends. Pan India delivery with COD.";
$imageUrl = $siteBase . "/og-preview.jpg";
$pageType = "website";

// Check if visiting a product page: /product/{slug} or /products/{slug}
$cleanPath = parse_url($requestUri, PHP_URL_PATH) ?? $requestUri;
if (preg_match('#^/products?/([a-zA-Z0-9_-]+)#', $cleanPath, $matches)) {
    $slug = $matches[1];
    $apiUrl = $supabaseUrl . "/rest/v1/products?slug=eq." . urlencode($slug) . "&select=name,price,description,image_url&limit=1";

    $opts = [
        "http" => [
            "method" => "GET",
            "header" => "apikey: " . $supabaseKey . "\r\n" .
                        "Authorization: Bearer " . $supabaseKey . "\r\n" .
                        "Accept: application/json\r\n",
            "timeout" => 2.5
        ]
    ];

    $context = stream_context_create($opts);
    $response = @file_get_contents($apiUrl, false, $context);

    if ($response !== false) {
        $data = json_decode($response, true);
        if (!empty($data) && isset($data[0])) {
            $prod = $data[0];
            $prodName = htmlspecialchars($prod['name'] ?? 'Pure Spice');
            $prodPrice = !empty($prod['price']) ? "₹" . round($prod['price']) : "";
            $title = $prodName . ($prodPrice ? " (" . $prodPrice . ")" : "") . " | Singlaji Spices";

            if (!empty($prod['description'])) {
                $rawDesc = strip_tags($prod['description']);
                $description = mb_substr($rawDesc, 0, 160) . (mb_strlen($rawDesc) > 160 ? "..." : "");
            } else {
                $description = "Order authentic " . $prodName . " freshly packed at Abohar facility. 100% pure, natural aroma. Cash on Delivery available across India.";
            }

            if (!empty($prod['image_url']) && filter_var($prod['image_url'], FILTER_VALIDATE_URL)) {
                $imageUrl = $prod['image_url'];
            }
            $pageType = "product";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $title; ?></title>
    <meta name="description" content="<?php echo htmlspecialchars($description); ?>">

    <!-- Open Graph / WhatsApp / Facebook -->
    <meta property="og:type" content="<?php echo $pageType; ?>">
    <meta property="og:site_name" content="Singlaji Spices">
    <meta property="og:url" content="<?php echo htmlspecialchars($canonicalUrl); ?>">
    <meta property="og:title" content="<?php echo htmlspecialchars($title); ?>">
    <meta property="og:description" content="<?php echo htmlspecialchars($description); ?>">
    <meta property="og:image" content="<?php echo htmlspecialchars($imageUrl); ?>">
    <meta property="og:image:secure_url" content="<?php echo htmlspecialchars($imageUrl); ?>">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="<?php echo htmlspecialchars($title); ?>">

    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@singlaji">
    <meta name="twitter:title" content="<?php echo htmlspecialchars($title); ?>">
    <meta name="twitter:description" content="<?php echo htmlspecialchars($description); ?>">
    <meta name="twitter:image" content="<?php echo htmlspecialchars($imageUrl); ?>">

    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="canonical" href="<?php echo htmlspecialchars($canonicalUrl); ?>">

    <!-- Immediate redirect for human browsers -->
    <script type="text/javascript">
        window.location.replace("<?php echo htmlspecialchars($canonicalUrl); ?>");
    </script>
    <meta http-equiv="refresh" content="0;url=<?php echo htmlspecialchars($canonicalUrl); ?>">
</head>
<body style="font-family: sans-serif; text-align: center; padding: 40px; color: #333;">
    <p>Opening <a href="<?php echo htmlspecialchars($canonicalUrl); ?>"><?php echo htmlspecialchars($title); ?></a>...</p>
</body>
</html>
