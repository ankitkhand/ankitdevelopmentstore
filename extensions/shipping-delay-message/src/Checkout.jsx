import { useEffect, useState } from "react";
import {
  useCartLines,
  useAppMetafields,
  reactExtension,
  Text,
  BlockStack,
  Banner,
} from "@shopify/ui-extensions-react/checkout";

// Register extension for checkout UI
export default reactExtension("purchase.checkout.block.render", () => <ShippingDelayMessage />);

function ShippingDelayMessage() {
  // Fetch all cart lines
  const cartLines = useCartLines();

  // Attempt to fetch metafields from products in cart
  const productMetafields = useAppMetafields({
    namespace: "custom",
    key: "shipping_delay",
    type: "product",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shippingDelays, setShippingDelays] = useState([]);

  useEffect(() => {
    if (cartLines.length === 0) {
      setLoading(false);
      return;
    }

    console.log("Cart Lines:", cartLines);
    console.log("Fetched Metafields:", productMetafields);

    try {
      const delays = cartLines.map((line) => {
        const productId = line.merchandise?.product?.id;
        const metafield = productMetafields.find(
          (field) => field.target.id === productId
        );

        return {
          id: line.id,
          title: line.merchandise?.title || "Unknown Product",
          shippingDelay: metafield?.metafield?.value || "Standard shipping applies",
        };
      });

      setShippingDelays(delays);
    } catch (err) {
      setError("Failed to fetch shipping delays.");
    } finally {
      setLoading(false);
    }
  }, [cartLines, productMetafields]);

  if (loading) {
    return <Text>Loading shipping details...</Text>;
  }

  if (error) {
    return <Banner title="Error" status="critical">{error}</Banner>;
  }

  return (
    <BlockStack>
      <Banner title="Shipping Delay Information" status="info">
        {shippingDelays.map((item) => (
          <Text key={item.id}>
            <strong>{item.title}:</strong> {item.shippingDelay}
          </Text>
        ))}
      </Banner>
    </BlockStack>
  );
}
