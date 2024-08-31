import { text } from "express";
import twilio from "twilio";
import { Address } from "../models/address.model.js";
import { User } from "../models/user.model.js";

export const sendTovendor = async (order, products, baseUrl) => {
  console.log(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  const customer = await User.findById(order.user_id).select(
    "email mobileNumber"
  );
  const address = await Address.findById(order.address_id).select(
    "-createAt -updateAt"
  );
  const message = createOrderWhatsAppTemplate(
    order,
    products,
    customer,
    address,
    baseUrl
  );
  try {
    const response = await client.messages.create({
      from: "whatsapp:+14155238886", // Replace with your Twilio WhatsApp-enabled number
      to: `whatsapp:+919680151370`,
      body: message,
    });
    return { response: response, error: null };
  } catch (error) {
    console.log(error);
    return { response: null, error: error };
  }
};

function createOrderWhatsAppTemplate(
  order,
  products,
  customer,
  address,
  baseUrl
) {
  const { order_items, subtotal, delivery_charge, total, status, _id } = order;
  const productMap = new Map(
    products.map((product) => [product._id.toString(), product.name])
  );
  const productUnitMap = new Map(
    products.map((product) => [product._id.toString(), product.unit])
  );

  let orderItemsText = order_items
    .map(
      (item) => `
- ${productMap.get(item.product_id.toString())}, Quantity: ${
        item.quantity
      }, Size: ${item.size}${productUnitMap.get(
        item.product_id.toString()
      )}, Price: KWD ${item.price.toFixed(2)}
    `
    )
    .join("");

  const acceptUrl = encodeURI(
    `${baseUrl}/api/v1/order/confirm?id=${_id}&status=Inprogress`
  ); // URL to confirm the order
  const rejectUrl = encodeURI(
    `${baseUrl}/api/v1/order/confirm?id=${_id}&status=Canceled`
  ); // URL to reject the order

  return `
*New Order Received*
Order ID: ${_id}
Status: ${status}

*Customer Information*
Name: ${address.firstName} ${address.lastName || ""}
Email: ${customer.email}
MobileNumber: ${customer.mobileNumber}

*Shipping Address*
Area: ${address.area}
Block: ${address.block}
Street: ${address.street}
${address.avenue ? `Avenue: ${address.avenue}` : ""}
House Number: ${address.houseNumber}

*Order Details*
${orderItemsText}

Subtotal: KWD ${subtotal.toFixed(2)}
Delivery Charge: KWD ${delivery_charge.toFixed(2)}
Total: KWD ${total.toFixed(2)}

Please process this order as soon as possible. Thank you!

To reject the order, click the link below:
${rejectUrl}
To confirm the order, click the link below:
${acceptUrl}


    `;
}
