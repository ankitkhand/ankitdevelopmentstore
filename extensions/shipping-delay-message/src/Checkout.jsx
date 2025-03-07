import {
  reactExtension,
  BlockStack,
  Text,
  useApi,
  useCartLines
} from "@shopify/ui-extensions-react/checkout";
import { Banner } from "@shopify/ui-extensions/checkout";
import { useEffect, useState } from "react";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const { query } = useApi();
  const cartLines = useCartLines();
  const [metafields, setMetafields] = useState({});

  useEffect(() => {
    async function fetchMetafields() {
      if (cartLines.length === 0) return;

      // Extract product IDs from cart
      const productIds = cartLines.map(line => line.merchandise.product.id);

      // GraphQL query to fetch product metafields
      const graphqlQuery = `
        query getProductsMetafields($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Product {
              id
              title
              metafield(namespace: "custom", key: "shipping_delay") {
                value
              }
            }
          }
        }
      `;

      try {
        const response = await query(graphqlQuery, {
          variables: {
            ids: productIds,
          },
        });

        if (response.data && response.data.nodes) {
          const metafieldData = {};
          response.data.nodes.forEach((product) => {
            if (product.metafield) {
              metafieldData[product.id] = product.metafield.value;
            }
          });

          setMetafields(metafieldData);
        }
      } catch (error) {
        console.error("Error fetching metafields:", error);
      }
    }

    fetchMetafields();
  }, [cartLines, query]);

  return (
    <BlockStack border={"dotted"} padding={"tight"}>
      <Banner title="Shipping Delay Info" status="success" />
      {cartLines.map((line) => {
        const productId = line.merchandise.product.id;
        const shippingDelay = metafields[productId];

        return (
          <BlockStack key={productId}>
              <Text as="h2" variant="bodyMd">
                {shippingDelay ? `Shipping Delay: ${shippingDelay}` : "No shipping delay info"}
              </Text>
          </BlockStack>
        );
      })}
    </BlockStack>
  );
}
