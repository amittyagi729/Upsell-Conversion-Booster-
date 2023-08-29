import { Card, Page, Layout, TextContainer, Text } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";

export default function PageName() {
  const { t } = useTranslation();
  return (
    <Page>
      <TitleBar
        title={t("PageName.title")}
        primaryAction={{
          content: t("PageName.primaryAction"),
          onAction: () => console.log("Primary action"),
        }}
        secondaryActions={[
          {
            content: t("PageName.secondaryAction"),
            onAction: () => console.log("Secondary action"),
          },
        ]}
      />
      <Layout>
        <Layout.Section>
        <Card
        title='Step-by-Step Guide to Adding a Sidebar to Your Shopify Product Page'
        sectioned
        primaryFooterAction=''
      >
        <TextContainer spacing="loose">
          <p>Enhancing your product page with a sidebar can significantly improve the navigation and overall shopping experience for your customers. Here's a simple step-by-step guide on how to add a sidebar to your Shopify product page:</p>
  
          <Text as="h4" variant="headingMd">Step 1: Accessing the Theme Customization</Text>
          
          <p>1. Log in to your Shopify admin panel.</p>
          <p>2. Navigate to "Online Store" in the left-hand menu and click on "Customize" to access your theme editor.</p>
          
          <Text as="h2" variant="headingMd">Step 2: Selecting the Product Page</Text>
          
          <p>1. Once you're in the theme editor, locate the top dropdown menu, and select "Products" from the available options. This will take you to the customization options for your product page.</p>
          
          <Text as="h2" variant="headingMd">Step 3: Choosing a Template</Text>
          
          <p>1. In the product page customization view, click on "Click here" to reveal a list of available templates. </p>
          <p>2. Select either the "Default" template if you want to keep the existing layout with the sidebar or choose a "Custom" template if you have already created a custom product page template that includes a sidebar. </p>
          
          <Text as="h2" variant="headingMd">Step 4: Adding the Collection Sidebar Section </Text>
          
          <p>1. With the template selected, navigate to the right-hand block sidebar within the theme editor.</p>
          <p>2. Click on "Add section" to open a list of available sections you can add to your product page.</p>
          <p>3. Look for and select "Collection Sidebar" from the list of Apps sections. This will add the sidebar to your product page layout.</p>
          
          <Text as="h2" variant="headingMd">Step 5: Managing the Navigation Section</Text>
          <p>1. After adding the "Collection Sidebar" section, you can now manage its content and configuration.</p>
          <p> 2. Customize the section by clicking on it in the theme editor. You can modify the content, select the navigation menu  you want to display in the sidebar, and adjust the settings according to your preferences.</p>
          <p>3. You may have options to change the sidebar's appearance, such as its color, font, and layout, depending on your theme's capabilities.</p>
          
          <Text as="h2" variant="headingMd">Step 6: Preview and Publish</Text>
          
          <p>1. Before finalizing the changes, use the "Preview" button to see how the sidebar looks on your product page.</p>
          <p>2. If you're satisfied with the changes, click on the "Publish" button to make the sidebar live on your Shopify product pages.</p>
          
          <Text as="h4" variant="headingMd">Conclusion:</Text>
          <p>
            Adding a sidebar to your Shopify product page is an excellent way to enhance navigation and make it easier for customers to discover and browse your collections. By following this step-by-step guide, you can seamlessly integrate a sidebar into your product page and improve the overall shopping experience for your store visitors. Happy selling!
            </p>
        </TextContainer>
        </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
