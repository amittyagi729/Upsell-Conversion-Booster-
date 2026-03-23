import { useState, useEffect } from "react";
import {
  Page,
  Card,
  ResourceList,
  Button,
  Spinner,
  TextField,
  Select,
  Stack,
} from "@shopify/polaris";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [pageInfo, setPageInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState({ after: null, before: null });

  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [productTypeFilter, setProductTypeFilter] = useState("");

  const pageSize = 3; // Show 3 products per page

  const fetchProducts = async (after = null, before = null) => {
    setLoading(true);

    let url = `/api/api/fetchkap?pageSize=${pageSize}`;
    if (after) url += `&after=${after}`;
    if (before) url += `&before=${before}`;
    if (search) url += `&title=${encodeURIComponent(search)}`;
    if (vendorFilter) url += `&vendor=${encodeURIComponent(vendorFilter)}`;
    if (productTypeFilter) url += `&product_type=${encodeURIComponent(productTypeFilter)}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.data?.products) {
      setProducts(data.data.products.edges);
      setPageInfo(data.data.products.pageInfo);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [search, vendorFilter, productTypeFilter]);

  return (
    <Page title="Products">
      <Card sectioned>
        {/* Filters */}
        <Stack distribution="fillEvenly" spacing="loose" alignment="center">
          <TextField
            label="Search"
            value={search}
            onChange={(value) => setSearch(value)}
            placeholder="Search by title"
          />
          <TextField
            label="Vendor"
            value={vendorFilter}
            onChange={(value) => setVendorFilter(value)}
            placeholder="Filter by vendor"
          />
          <TextField
            label="Product Type"
            value={productTypeFilter}
            onChange={(value) => setProductTypeFilter(value)}
            placeholder="Filter by product type"
          />
        </Stack>
      </Card>

      <Card sectioned>
        {loading ? (
          <Spinner accessibilityLabel="Loading products" />
        ) : (
          <ResourceList
            resourceName={{ singular: "product", plural: "products" }}
            items={products}
            renderItem={(item) => {
              const { node } = item;
              const media = node.images.edges[0]?.node?.originalSrc;

              return (
                <ResourceList.Item
                  id={node.id}
                  media={media ? <img src={media} alt={node.title} width="50" /> : null}
                  accessibilityLabel={`View ${node.title}`}
                >
                  <h3>{node.title}</h3>
                  <p>{node.vendor}</p>
                  <p>{node.productType}</p>
                </ResourceList.Item>
              );
            }}
          />
        )}
      </Card>

      {/* Pagination */}
      <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
        <Button
          onClick={() => fetchProducts(null, pageInfo.startCursor)}
          disabled={!pageInfo.hasPreviousPage}
        >
          Previous
        </Button>
        <Button
          onClick={() => fetchProducts(pageInfo.endCursor, null)}
          disabled={!pageInfo.hasNextPage}
        >
          Next
        </Button>
      </div>
    </Page>
  );
}
