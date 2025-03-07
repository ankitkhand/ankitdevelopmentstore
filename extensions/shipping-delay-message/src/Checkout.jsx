import {
  reactExtension,
  BlockStack,
  Text,
  useApi,
  useCartLines,
  Banner,
} from "@shopify/ui-extensions-react/checkout";
import { useEffect, useState } from "react";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const { extension, query } = useApi();
  const cartLines = useCartLines();
  const [metafields, setMetafields] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetafields() {
      if (cartLines.length > 0) {
        setLoading(true);
        const productIds = cartLines.map((line) => line.merchandise.product.id);
        console.log("Product IDs:", productIds); // Log the product IDs

        // Log the entire product object for each line item
        cartLines.forEach((line) => {
          console.log("Product Object:", line.merchandise.product);
        });

        const graphqlQuery = `
          query getProducts($ids: [ID!]!) {
            products(ids: $ids) {
              nodes {
                id
                title
                metafields(first: 10) {
                  edges {
                    node {
                      namespace
                      key
                      value
                    }
                  }
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

          if (response.data && response.data.products && response.data.products.nodes) {
            const metafieldData = {};
            response.data.products.nodes.forEach((product) => {
              metafieldData[product.id] = {
                title: product.title,
                metafields: product.metafields.edges.map((edge) => ({
                  namespace: edge.node.namespace,
                  key: edge.node.key,
                  value: edge.node.value,
                })),
              };
            });
            setMetafields(metafieldData);
          }
        } catch (error) {
          console.error("Error fetching metafields:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }

    fetchMetafields();
  }, [cartLines, query]);

  return (
    <BlockStack border={"dotted"} padding={"tight"}>
      <Banner title="Product Metafields Displayed Below">
        Product Metafields Displayed Below
      </Banner>
      {loading ? (
        <Text>Loading product metafields...</Text>
      ) : cartLines.length === 0 ? (
        <Text>Your cart is empty.</Text>
      ) : (
        cartLines.map((line) => {
          const productId = line.merchandise.product.id;
          const productMetafields = metafields[productId];
          if (productMetafields) {
            return (
              <BlockStack key={productId}>
                <Text emphasis="bold">{productMetafields.title}</Text>
                {productMetafields.metafields.map((metafield, index) => (
                  <Text key={index}>
                    {metafield.namespace}.{metafield.key}: {metafield.value}
                  </Text>
                ))}
              </BlockStack>
            );
          } else {
            return (
              <BlockStack key={productId}>
                <Text emphasis="bold">{line.merchandise.product.title}</Text>
                <Text>Metafields not found.</Text>
              </BlockStack>
            );
          }
        })
      )}
    </BlockStack>
  );
}
