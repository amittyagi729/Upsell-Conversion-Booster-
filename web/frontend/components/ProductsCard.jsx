import React, { useState, useEffect } from "react";
import { Card, TextContainer, Text, Button, Layout, Page, LegacyCard, Select, TextField, Spinner } from "@shopify/polaris";
import { Toast } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
import { useAppQuery, useAuthenticatedFetch } from "../hooks";
import Papa from "papaparse";
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function ProductsCard() {
  const emptyToastProps = { content: null };
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [toastProps, setToastProps] = useState(emptyToastProps);
  const fetch = useAuthenticatedFetch();
  const [templateSuffixes, setTemplateSuffixes] = useState([]);
  const [selectedSuffix, setSelectedSuffix] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useTranslation();
  const productsCount = 5;
  const [data1, setData1] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [responseData, setResponseData] = useState(null);
  const productsPerPage = 10; // Number of products to display per page
  const urlParams = new URLSearchParams(window.location.search);
  const shopURL = urlParams.get('shop');
  const {
    data,
    refetch: refetchProductCount,
    isLoading: isLoadingCount,
    isRefetching: isRefetchingCount,
  } = useAppQuery({
    url: "/api/products/count",
    reactQueryOptions: {
      onSuccess: () => {
        setIsLoading(false);
      },
    },
  });

  const toastMarkup = toastProps.content && !isRefetchingCount && (
    <Toast {...toastProps} onDismiss={() => setToastProps(emptyToastProps)} />
  );

  const handlePopulate = async () => {
    setIsLoading(true);
    const response = await fetch("/api/products/create");
    if (response.ok) {
      await refetchProductCount();
      setToastProps({
        content: t("ProductsCard.productsCreatedToast", {
          count: productsCount,
        }),
      });
    } else {
      setIsLoading(false); // Set loading to false on error
      setToastProps({
        content: t("ProductsCard.errorCreatingProductsToast"),
        error: true,
      });
    }
  };

  const fetchData = async () => {
    try {
      const response = await fetch("/api/products");
      const jsonData = await response.json();
      const productsArray = jsonData.products || [];
      setProducts(productsArray);
      const uniqueSuffixes = Array.from(
        new Set(productsArray.map((product) => product.template_suffix))
      ).filter((suffix) => suffix !== null);
      setTemplateSuffixes(uniqueSuffixes); // Only add uniqueSuffixes to the options
      setSelectedSuffix('');
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    setSelectedSuffix('');
  }, []);

  const filteredProducts = products.filter((product) => {
    if (!selectedSuffix && !product.template_suffix) {
      return "default";
    } else if (product.template_suffix === selectedSuffix) {
      const searchMatches =
        product.title.toLowerCase().includes(searchQuery.toLowerCase());
      return searchMatches;
    }
  });

  // Calculate the start and end index for the current page
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const nonEmptySuffixes = templateSuffixes.filter(suffix => !!suffix);

  const handleTemplateSuffixChange = (suffix) => {
    setSelectedSuffix(suffix === 'Default Template' ? null : suffix);
    setSearchQuery('');
    setCurrentPage(1);
    sendSelectedOptionToServer(suffix);
  };

  const sendSelectedOptionToServer = async (selectedOption) => {
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      const response = await fetch('/api/fetch-shopify-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({ selectedOption }),
      });
      if (response.ok) {
        const responseData = await response.json();
        setResponseData(responseData); // Update the response data in the state
        toast.success('Ready to  Download your csv file');
      } else {
        toast.error('Failed to submit data');
      }
    } catch (error) {
      console.error('Error sending data:', error);
      toast.error('Not Allowed');
    }
  };

  const handleDownloadCSV = async () => {
    try {
      let selectedProducts = [];

      if (selectedSuffix === '' || selectedSuffix === 'Select a template') {
        // If "Select a template" is chosen, download all products
        selectedProducts = products;
      } else {
        const allProductsResponse = await fetch("/api/products");
        const allProductsJsonData = await allProductsResponse.json();
        const allProductsArray = allProductsJsonData.products || [];
        // Filter all products to include only the selected template
        selectedProducts = allProductsArray.filter((product) => {
          return product.template_suffix === selectedSuffix;
        });
      }

      // Prepare CSV data
      const csvData = selectedProducts.map((product) => {
        return {
          ProductTitle: product.title,
          TemplateName: product.template_suffix || 'default',
          URL: `https://${shopURL}/products/${product.handle}`,
          AdsURL: `https://${shopURL}/products/${product.handle}?${responseData}`,
        };
      });

      // Create CSV content
      const csvContent = Papa.unparse(csvData, {
        header: true,
      });

      // Create a Blob object with the CSV content
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      // Create a temporary URL for the Blob
      const url = URL.createObjectURL(blob);
      // Create a link element and trigger a download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'product_data.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Revoke the Blob URL to release resources
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toast.error('An error occurred while generating the CSV.');
    }
  };

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  return (
    <>
      <ToastContainer />
      {toastMarkup}
      <Page fullWidth>
        <LegacyCard title="Export products" sectioned>
          <Select
            label="Select Template"
            options={[
              {
                label: 'Select a template', // Placeholder or label text
                value: '', // You can set an empty value or any value that's not in your options
                disabled: true, // Disable this option so it's not selectable
              },
              {
                label: 'Default Template',
                value: 'Default Template',
              },
              ...nonEmptySuffixes.map((suffix) => ({
                label: suffix,
                value: suffix,
              })),
            ]}
            onChange={handleTemplateSuffixChange}
            value={selectedSuffix ?? 'Default Template'}
            defaultValue=""
          />

          {isLoading ? ( // Show loading indicator if isLoading is true
            <div style={{ marginTop: "50px", marginLeft: "450px" }}><Spinner accessibilityLabel="Spinner example" size="large" /></div>
          ) : (
            <div className="Polaris-DataTable Polaris-DataTable__ShowTotals">
              <div className="Polaris-DataTable__ScrollContainer">
                <table className="Polaris-DataTable__Table">
                  <thead>
                    <tr>
                      <th
                        data-polaris-header-cell="true"
                        className="Polaris-DataTable__Cell Polaris-DataTable__Cell--verticalAlignTop Polaris-DataTable__Cell--header"
                        scope="col"
                        style={{ textAlign: "center" }}
                      >
                        Product Title
                      </th>
                      <th
                        data-polaris-header-cell="true"
                        className="Polaris-DataTable__Cell Polaris-DataTable__Cell--verticalAlignTop Polaris-DataTable__Cell--header Polaris-DataTable__Cell--numeric"
                        scope="col"
                      >
                        Template Name
                      </th>
                      <th
                        data-polaris-header-cell="true"
                        className="Polaris-DataTable__Cell Polaris-DataTable__Cell--verticalAlignTop Polaris-DataTable__Cell--header Polaris-DataTable__Cell--numeric"
                        scope="col"
                        style={{ textAlign: "center" }}
                      >
                        URL
                      </th>
                      <th
                        data-polaris-header-cell="true"
                        className="Polaris-DataTable__Cell Polaris-DataTable__Cell--verticalAlignTop Polaris-DataTable__Cell--header Polaris-DataTable__Cell--numeric"
                        scope="col"
                        style={{ textAlign: "center" }}
                      >
                        Ads URL
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSuffix === '' || selectedSuffix === 'Select a template' ? (
                      products.map((product) => {
                        const template = product.template_suffix ? product.template_suffix : "default";
                        const queryStringItem = data1.find(item => item.value === template);
                        const queryStringValue = queryStringItem ? queryStringItem.name : "";

                        return (
                          <tr key={product.id} className="Polaris-DataTable__TableRow Polaris-DataTable--hoverable">
                            <td className="Polaris-DataTable__Cell Polaris-DataTable__Cell--verticalAlignTop Polaris-DataTable__Cell--firstColumn" scope="row">
                              {product.title}
                            </td>
                            <td className="Polaris-DataTable__Cell Polaris-DataTable__Cell--verticalAlignTop Polaris-DataTable__Cell--numeric">
                              {template}
                            </td>
                            <td className="Polaris-DataTable__Cell Polaris-DataTable__Cell--verticalAlignTop" scope="row">
                              <span>{`https://${shopURL}/products/${product.handle}`}</span>
                            </td>
                            <td className="Polaris-DataTable__Cell Polaris-DataTable__Cell--verticalAlignTop" scope="row">
                              <span>{`https://${shopURL}/products/${product.handle}?${responseData}`}</span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      paginatedProducts.map((product) => {
                        const template = product.template_suffix ? product.template_suffix : "default";
                        const queryStringItem = data1.find(item => item.value === template);
                        const queryStringValue = queryStringItem ? queryStringItem.name : "";
                        return (
                          <tr key={product.id} className="Polaris-DataTable__TableRow Polaris-DataTable--hoverable">
                            <td className="Polaris-DataTable__Cell Polaris-DataTable__Cell--verticalAlignTop Polaris-DataTable__Cell--firstColumn" scope="row">
                              {product.title}
                            </td>
                            <td className="Polaris-DataTable__Cell Polaris-DataTable__Cell--verticalAlignTop Polaris-DataTable__Cell--numeric">
                              {template}
                            </td>
                            <td className="Polaris-DataTable__Cell Polaris-DataTable__Cell--verticalAlignTop" scope="row">
                              <span>{`https://${shopURL}/products/${product.handle}`}</span>
                            </td>
                            <td className="Polaris-DataTable__Cell Polaris-DataTable__Cell--verticalAlignTop" scope="row">
                              <span>{`https://${shopURL}/products/${product.handle}?${responseData}`}</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>

                </table>
              </div>
            </div>
          )}

          <Button
            accessibilityLabel="Download CSV"
            onClick={handleDownloadCSV} >
            Download CSV
          </Button>
          <Button
            accessibilityLabel="Previous"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <p style={{ display: "inline-block", margin: "0 16px" }}>
            Page {currentPage} of {totalPages}
          </p>
          <Button
            accessibilityLabel="Next"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={endIndex >= filteredProducts.length}
          >
            Next
          </Button>
        </LegacyCard>
      </Page>
    </>
  );
}
