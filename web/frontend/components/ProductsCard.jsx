import React, { useState, useEffect } from "react";
import { Button, ButtonGroup, Page, Spinner } from "@shopify/polaris";
import { Toast } from "@shopify/app-bridge-react";
import { ToastContainer } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSort, faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
import "react-toastify/dist/ReactToastify.css";

const filterOptions = ["Template", "Title", "URL",];
const sortOptions = ["A-Z", "Z-A"];

export function ProductsCard() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("Template");
  const [selectedSort, setSelectedSort] = useState("A-Z");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState(null);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const emptyToastProps = { content: null };
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [toastProps, setToastProps] = useState(emptyToastProps);
  const urlParams = new URLSearchParams(window.location.search);
  const shopURL = urlParams.get("shop");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50); // Display 50 products per page
  const [apiResponse, setApiResponse] = useState(null);
  const toggleFilterDropdown = () => {
    setShowFilterDropdown(!showFilterDropdown);
  };

  const toggleInput = () => {
    if (showInput) {
      // If the input is currently open, clear the query and show all products
      setQuery("");
      fetchData(); // Fetch all products when input is closed
    }
    setShowInput(!showInput); // Toggle the input field
  };

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const toastMarkup =
    toastProps.content && !isLoading && !isDataFetched ? (
      <Toast {...toastProps} onDismiss={() => setToastProps(emptyToastProps)} />
    ) : null;

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/getProductLinksParallel');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();

        console.log('Full API Response:', data);

        if (data && data.combined_links) {
          setApiResponse(data);
        } else {
          console.log('Data structure is not as expected.');
          setApiResponse(null);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const fetchDataWithNext = async (nextValue) => {
    if (nextValue) {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/getProductLinksParallel?query=${nextValue}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();

        console.log('Next API Response:', data);

        if (data && data.combined_links) {
          setApiResponse(data);
        } else {
          console.log('Data structure is not as expected.');
          setApiResponse(null);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setIsLoading(false);
      }
    }
  };

  const fetchDataWithPrevious = async (previousValue) => {
    if (previousValue) {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/getProductLinksParallel?query=${previousValue}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();

        console.log('Previous API Response:', data);

        if (data && data.combined_links) {
          setApiResponse(data);
        } else {
          console.log('Data structure is not as expected.');
          setApiResponse(null);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setIsLoading(false);
      }
    }
  };

  // Function to extract the page number from the URL
  const extractPageNumber = (url) => {
    const match = url.match(/page=(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };
  // const fetchData = async (page = 1) => {
  //   setIsLoading(true);
  //   setError(null);
  //   try {
  //     const response = await fetch(`/api/productssearch?title=${query}&page=${page}&pageSize=${pageSize}`);
  //     if (!response.ok) {
  //       throw new Error("Network response was not ok");
  //     }
  //     const data = await response.json();
  //     // console.log("API Response:", data);
  //     if (data && Array.isArray(data.products)) {
  //       setSearchResults(data.products);
  //     } else {
  //       console.error("API response does not contain an array of products:", data);
  //       setSearchResults([]);
  //     }
  //     setCurrentPage(page); // Update the current page
  //   } catch (error) {
  //     setError(error);
  //     setSearchResults([]);
  //     console.error("Error fetching data:", error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const fetchData = async (page = 1) => {
    setIsLoading(true);
    setError(null);
  
    if (query.trim().length >= 3) { // Check if query has at least 4 characters
      try {
        const response = await fetch(`/api/productssearch?title=${query}&page=${page}&pageSize=${pageSize}`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
  
        if (data && Array.isArray(data.products)) {
          setSearchResults(data.products);
        } else {
          console.error("API response does not contain an array of products:", data);
          setSearchResults([]);
        }
        setCurrentPage(page); // Update the current page
      } catch (error) {
        setError(error);
        setSearchResults([]);
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // If the query does not have at least 4 characters, you can decide what action to take.
      // For example, you can clear the search results or display a message to the user.
      setSearchResults([]);
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (event) => {
    setQuery(event.target.value);
  };
  useEffect(() => {
    if (query.trim() !== "") {
      fetchData();
    }
  }, [query]);

  const fetchData1 = async () => {
    try {
      setIsDownloading(true);
      let responseData;
      if (query !== "") {
        const response = await fetch(`/api/productssearch?title=${query}`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        responseData = await response.json();
      } else {
        const response = await fetch("/api/productsdownloads");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        responseData = await response.json();
      }
      if (Array.isArray(responseData.products)) {
        const csvContent = createCsvContent(responseData.products);
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "products.csv");
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(url);
      } else {
        console.error(
          "API response does not contain an array of products:",
          responseData
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const createCsvContent = (products) => {
    const header = ["Product Title", "Template_suffix", "URL", "Ads URL"].join(",");
    const rows = products.map((product) => {
      let { title, template_suffix, handle } = product;
      if (!template_suffix || template_suffix.trim() === "") {
        template_suffix = "default_template";
      }
      const productUrl = `https://${shopURL}/products/${handle}`;
      const adsUrl = `https://${shopURL}/products/${handle}?${encodeURIComponent(product.ads_param)}`;
      return [title, template_suffix, productUrl, adsUrl].map(escapeCsvValue).join(",");
    });
    return [header, ...rows].join("\n");
  };

  function escapeCsvValue(value) {
    if (/[,"'\n\r]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  const handleFilterOptionClick = (option) => {
    setSelectedFilter(option);
  };

  const sortProducts = (criteria, order) => {
    const sortedProducts = [...apiResponse.products]; // Copy the original array
    if (criteria === "Title") {
      sortedProducts.sort((a, b) => {
        if (order === "A-Z") {
          return a.title.localeCompare(b.title);
        } else {
          return b.title.localeCompare(a.title);
        }
      });
    } else if (criteria === "Template") {
      sortedProducts.sort((a, b) => {
        if (order === "A-Z") {
          return (a.template_suffix || "").localeCompare(b.template_suffix || "");
        } else {
          return (b.template_suffix || "").localeCompare(a.template_suffix || "");
        }
      });
    } else if (criteria === "URL") {
      sortedProducts.sort((a, b) => {
        if (order === "A-Z") {
          return a.url.localeCompare(b.url);
        } else {
          return b.url.localeCompare(a.url);
        }
      });
    } else if (criteria === "Ads URL") {
      sortedProducts.sort((a, b) => {
        if (order === "A-Z") {
          return a.adsUrl.localeCompare(b.adsUrl);
        } else {
          return b.adsUrl.localeCompare(a.adsUrl);
        }
      });
    }
    setApiResponse({ ...apiResponse, products: sortedProducts }); // Update the apiResponse with sorted products
  }

  const sortSearchResults = (criteria, order) => {
    const sortedResults = [...searchResults];
    if (criteria === "Title") {
      sortedResults.sort((a, b) => {
        if (order === "A-Z") {
          return a.title.localeCompare(b.title);
        } else {
          return b.title.localeCompare(a.title);
        }
      });
    } else if (criteria === "Template") {
      sortedResults.sort((a, b) => {
        if (order === "A-Z") {
          return (a.template_suffix || "").localeCompare(b.template_suffix || "");
        } else {
          return (b.template_suffix || "").localeCompare(a.template_suffix || "");
        }
      });
    } else if (criteria === "URL") {
      sortedResults.sort((a, b) => {
        if (order === "A-Z") {
          return a.url.localeCompare(b.url);
        } else {
          return b.url.localeCompare(a.url);
        }
      });
    } else if (criteria === "Ads URL") {
      sortedResults.sort((a, b) => {
        if (order === "A-Z") {
          return a.adsUrl.localeCompare(b.adsUrl);
        } else {
          return b.adsUrl.localeCompare(a.adsUrl);
        }
      });
    }
    setSearchResults(sortedResults);
  };

  const handleSortOptionClick = (option) => {
    setSelectedSort(option);
    if (query === "") {
      sortProducts(selectedFilter, option); // Sort products when there's no query
    } else {
      sortSearchResults(selectedFilter, option); // Sort search results when there's a query
    }
  };

  const renderPaginationButtons = () => {
    const totalProducts = searchResults.length;
    const totalPages = Math.ceil(totalProducts / pageSize);

    if (totalProducts > pageSize) {
      return (
        <div className="pagination-buttons">
          <ButtonGroup>
            <Button
              onClick={() => fetchData(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              primary
              onClick={() => fetchData(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </ButtonGroup>
        </div>
      );
    }
    return null;
  };

  const tableHeader = (
    <thead>
      <tr>
        <th
          className="Polaris-DataTable__Cell Polaris-DataTable__Cell--header Polaris-TextStyle--variationStrong"
          scope="col"
          style={{ borderBottom: "1px solid #ddd", borderRight: "1px solid #ddd", borderLeft: "1px solid #ddd", borderTop: "1px solid #ddd", fontWeight: "800", }}
        >
          Product Title
        </th>
        <th
          className="Polaris-DataTable__Cell Polaris-DataTable__Cell--header Polaris-TextStyle--variationStrong"
          scope="col"
          style={{
            borderBottom: "1px solid #ddd", borderRight: "1px solid #ddd", textAlign: "center", borderTop: "1px solid #ddd", fontWeight: "800"
          }}
        >
          Template Name
        </th>
        <th
          className="Polaris-DataTable__Cell Polaris-DataTable__Cell--header Polaris-TextStyle--variationStrong"
          scope="col"
          style={{ borderBottom: "1px solid #ddd", borderTop: "1px solid #ddd", borderRight: "1px solid #ddd", fontWeight: "800" }}
        >
          URL
        </th>
        <th
          className="Polaris-DataTable__Cell Polaris-DataTable__Cell--header Polaris-TextStyle--variationStrong"
          scope="col"
          style={{ borderBottom: "1px solid #ddd", borderTop: "1px solid #ddd", borderRight: "1px solid #ddd", fontWeight: "800" }}
        >
          Ads URL
        </th>

      </tr>
    </thead>

  );

  const renderProductsTable = () => {
    if (isLoading) {
      return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <Spinner size="large" color="teal" />
        </div>
      );
    } else if (query === "" || query.length <= 2) {
      // Render products when there's no query or when the query length is 2 or less
      return (
        <div>
          <div className="Polaris-DataTable Polaris-DataTable__ShowTotals">
            <div className="Polaris-DataTable__ScrollContainer">
              <div>
                <table className="Polaris-DataTable__Table">
                  {tableHeader}
                  <tbody>
                    {apiResponse &&
                      apiResponse.products.map((product, index) => (
                        <tr
                          key={index}
                          style={{
                            backgroundColor: index % 2 === 0 ? 'white' : '#f2f2f2',
                          }}
                        >
                          <td className="Polaris-IndexTable__TableCell">
                            <span className="Polaris-Text--root Polaris-Text--bodyMd Polaris-Text">
                              {product.title}
                            </span>
                          </td>
                          <td className="Polaris-IndexTable__TableCell">
                            <span className="Polaris-Text--root Polaris-Text--bodyMd Polaris-Text">
                              {product.template_suffix || 'default_template'}
                            </span>
                          </td>
                          <td
                            className="Polaris-IndexTable__TableCell"
                            style={{
                              borderLeft: "1px solid #ddd", padding: "15px",
                            }}
                          >
                            <a
                              href={product.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <span className="Polaris-Text--root Polaris-Text--bodyMd Polaris-Text">
                                {`https://${shopURL}/products/${product.handle}`}
                              </span>
                            </a>
                          </td>
                          <td
                            className="Polaris-IndexTable__TableCell"
                            style={{
                              borderLeft: "1px solid #ddd",
                              borderRight: "1px solid #ddd",
                              padding: "15px",
                            }}
                          >
                            <a href={product.url} target="_blank" rel="noopener noreferrer">
                            <span className="Polaris-Text--root Polaris-Text--bodyMd Polaris-Text">
                            {product.ads_param
                              ? `https://${shopURL}/products/${product.handle}?${encodeURIComponent(product.ads_param)}`
                              : `https://${shopURL}/products/${product.handle}`
                            }
                          </span>
                            </a>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', marginTop: '25px' }}>
            <ButtonGroup>
              <Button
                accessibilityLabel="Previous"
                onClick={() => fetchDataWithPrevious(apiResponse.combined_links.previous)}
                disabled={!apiResponse || !apiResponse.combined_links.previous}
              >
                Previous
              </Button>
              <Button
                primary
                accessibilityLabel="Next"
                onClick={() => fetchDataWithNext(apiResponse.combined_links.next)}
              >
                Next
              </Button>
              <Button
                primary
                onClick={fetchData1}
                className="download-button"
                style={{ marginRight: '16px', marginLeft: '16px' }}
                disabled={isDownloading}
              >
                {isDownloading ? 'Downloading...' : 'Download CSV'}
              </Button>
            </ButtonGroup>
          </div>
        </div>
      );
    } else if (query.length >= 3 && searchResults.length === 0) {
      // Render "No products found" when query has 3 or more characters and no results
      return (
        <div style={{ textAlign: "center", marginTop: "30px" }}>
          No products found
        </div>
      );
    } else if (query.length >= 3) {
      // Render search results when there's a query with length 3 or more
      return (
        <div>
          <div className="Polaris-DataTable Polaris-DataTable__ShowTotals">
            <div className="Polaris-DataTable__ScrollContainer">
              <table className="Polaris-DataTable__Table" >
                {tableHeader}
                <tbody>
                  {searchResults.slice(startIndex, endIndex).map((product, index) => (
                    <tr
                      key={index}
                      style={{ backgroundColor: index % 2 === 0 ? "white" : "#f2f2f2", }}
                    >
                      <td
                        className="Polaris-IndexTable__TableCell"
                        style={{
                          borderRight: "1px solid #ddd", borderLeft: "1px solid #ddd", padding: "15px",
                        }}
                      >
                        <span className="Polaris-Text--root Polaris-Text--bodyMd Polaris-Text">
                          {product.title}
                        </span>
                      </td>
                      <td
                        className="Polaris-IndexTable__TableCell"
                        style={{ padding: "15px", }} // Add padding here (adjust the value as needed)
                      >
                        <span className="Polaris-Text--root Polaris-Text--bodyMd Polaris-Text">
                          {product.template_suffix || "default_template"}
                        </span>
                      </td>
                      <td
                        className="Polaris-IndexTable__TableCell"
                        style={{
                          borderLeft: "1px solid #ddd", padding: "15px",
                        }}
                      >
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className="Polaris-Text--root Polaris-Text--bodyMd Polaris-Text">
                            {`https://${shopURL}/products/${product.handle}`}
                          </span>
                        </a>
                      </td>
                      <td
                        className="Polaris-IndexTable__TableCell"
                        style={{ borderLeft: "1px solid #ddd", borderRight: "1px solid #ddd", padding: "15px", }}
                      >
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                        <span className="Polaris-Text--root Polaris-Text--bodyMd Polaris-Text">
                        {product.ads_param
                          ? `https://${shopURL}/products/${product.handle}?${encodeURIComponent(product.ads_param)}`
                          : `https://${shopURL}/products/${product.handle}`
                        }
                      </span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ display: "flex", marginTop: "25px" }}>
            {renderPaginationButtons()}
            <Button primary
              onClick={fetchData1}
              className="download-button"
              style={{ marginRight: "16px", marginLeft: "16px" }}
              disabled={isDownloading}
            >
              {isDownloading ? "Downloading..." : "Download CSV"}
            </Button>
          </div>
        </div>
      );
    }
  };

  return (
    <>
      <ToastContainer />
      {toastMarkup}
      <Page fullWidth title="Export Products">
        <div className="search-input-container">
          <div
            className="search-input-wrapper"
            style={{ display: "flex", alignItems: "center", background: "#f5f5f5", padding: "10px", borderRadius: "5px", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)", }}
          >
            {showInput ? (
              <div style={{ display: "flex", alignItems: "center", flex: "1" }}>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search for products"
                  style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc", }}
                  value={query}
                  onChange={handleInputChange}
                />
                <div
                  className="cancel-button"
                  onClick={toggleInput}
                  style={{ cursor: "pointer", marginLeft: "10px", }}
                >
                  <FontAwesomeIcon
                    icon={faTimes}
                    style={{ fontSize: "20px", color: "#555" }} // Dark grey color
                  />
                </div>
              </div>
            ) : (
              <div
                className="search-icon"
                onClick={toggleInput}
                style={{ cursor: "pointer", marginLeft: "auto", }}
              >
                <FontAwesomeIcon
                  icon={faSearch}
                  style={{ fontSize: "20px", color: "#555" }} // Dark grey color
                />
              </div>
            )}
            <div
              className="filter-icons"
              style={{ display: "flex", alignItems: "center", marginLeft: "10px", position: "relative", }}
            >
              <div
                className="filter-icon"
                onClick={toggleFilterDropdown}
                style={{ cursor: "pointer" }}
              >
                <FontAwesomeIcon
                  icon={faSort}
                  style={{ fontSize: "23px", color: "#555" }} // Dark grey color
                />
              </div>
              {showFilterDropdown && (
                <div
                  className="filter-dropdown"
                  style={{ position: "absolute", top: "35px", left: "-70px", width: "120px", background: "#ffffff", border: "1px solid #ccc", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)", zIndex: 1, padding: "10px", borderRadius: "5px", }}
                >
                  <div>
                    <h4 style={{ fontWeight: "bold" }}>Filter By:</h4>
                    {filterOptions.map((option) => (
                      <label
                        key={option}
                        style={{ display: "block", marginBottom: "5px", cursor: "pointer", }}
                      >
                        <input
                          type="radio"
                          value={option}
                          checked={selectedFilter === option}
                          onChange={() => handleFilterOptionClick(option)}
                          style={{ marginRight: "5px" }}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  <div>
                    <h4 style={{ fontWeight: "bold" }}>Sort By:</h4>
                    {sortOptions.map((option) => (
                      <label
                        key={option}
                        style={{ display: "block", marginBottom: "5px", cursor: "pointer", }}
                      >
                        <input
                          type="radio"
                          value={option}
                          checked={selectedSort === option}
                          onChange={() => handleSortOptionClick(option)}
                          style={{ marginRight: "5px" }}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {renderProductsTable()}
      </Page>

    </>
  );
}