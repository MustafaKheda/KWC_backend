import mongoose from "mongoose";
import nodemailer from "nodemailer";
import { User } from "../models/user.model.js";
import { Address } from "../models/address.model.js";
import { OrderStatus } from "./OrderStatus.js";
export const sendEmailToVendor = async (order, products, baseUrl) => {
  const customer = await User.findById(order.user_id).select(
    "email mobileNumber"
  );
  const address = await Address.findById(order.address_id).select(
    "-createAt -updateAt"
  );
  var smtpConfig = {
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Use SSL for port 465
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
  };
  var transporter = nodemailer.createTransport(smtpConfig);

  var mailOptions = {
    from: `Beautify <${process.env.EMAIL}>`, // sender address
    to: "maad009bohra@gmail.com", // list of receivers
    subject: "Order Confirmation", // Subject line
    html: createOrderEmailTemplate(order, products, customer, address, baseUrl), // html body
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Failed to send email:", error);
  }
};

export const sendEmailToCustomer = async (order, products) => {
  const customer = await User.findById(order.user_id).select(
    "email mobileNumber"
  );
  var smtpConfig = {
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Use SSL for port 465
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
  };
  var transporter = nodemailer.createTransport(smtpConfig);
  var mailOptions = {
    from: `Beautify <${process.env.EMAIL}>`, // sender address
    to: customer.email, // list of receivers
    subject: "Order Confirmation", // Subject line
    html: createOrderConfirmEmailTemplate(order, products), // html body
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Failed to send email:", error);
  }
};

//Templates
function createOrderEmailTemplate(order, products, customer, address, baseUrl) {
  const { order_items, subtotal, delivery_charge, total, status, _id } = order;
  // Create a mapping from product_id to product name
  const productMap = new Map(
    products.map((product) => [product._id.toString(), product.name])
  );
  const productUnitMap = new Map(
    products.map((product) => [product._id.toString(), product.unit])
  );
  let orderItemsHTML = order_items
    .map(
      (item) => `
        <tr>
            <td>${productMap.get(item.product_id.toString())}</td>
            <td>${item.quantity}</td>
            <td>${item.size}${productUnitMap.get(
        item.product_id.toString()
      )}</td>
            <td>KWD ${item.price.toFixed(2)}</td>
        </tr>
    `
    )
    .join("");
  // Replace with your actual reject URL
  const acceptUrl = encodeURI(
    `${baseUrl}/api/v1/order/confirm?id=${_id}&status=${OrderStatus.ORDER_ACCEPTED}`
  ); // URL to confirm the order
  const rejectUrl = encodeURI(
    `${baseUrl}/api/v1/order/confirm?id=${_id}&status=${OrderStatus.ORDER_CANCELED}`
  ); // URL to reject the order
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 5px; }
            h1 { color: #333; }
            p { font-size: 16px; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
            th { background-color: #f4f4f4; }
            .button-container { margin-top: 20px; text-align: center; }
            .btn { background-color: #4CAF50; color: white!important; padding: 10px 20px; text-align: center; text-decoration: none; font-size: 16px; border-radius: 5px; margin: 5px; }
            .btn-reject { background-color: #f44336; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>New Order Received</h1>
            <p><strong>Order ID:</strong> ${_id}</p>
            <p><strong>Status:</strong> ${status}</p>
            <h2>Customer Information</h2>
            <p><strong>Name:</strong> ${address.firstName} ${
    address.lastName || ""
  }</p>
            <p><strong>Email:</strong> ${customer.email}</p>
            <p><strong>Mobile Number:</strong> ${customer.mobileNumber}</p>

            <h2>Shipping Address</h2>
            <p><strong>Area:</strong> ${address.area}</p>
            <p><strong>Block:</strong> ${address.block}</p>
            <p><strong>Street:</strong> ${address.street}</p>
            ${
              address.avenue
                ? `<p><strong>Avenue:</strong> ${address.avenue}</p>`
                : ""
            }
            <p><strong>House Number:</strong> ${address.houseNumber}</p>
            <h2>Order Details</h2>
            <table>
                <thead>
                    <tr>
                        <th>Product Name</th>
                        <th>Quantity</th>
                        <th>Size</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${orderItemsHTML}
                </tbody>
            </table>
            <p><strong>Subtotal:</strong> KWD ${subtotal.toFixed(2)}</p>
            <p><strong>Delivery Charge:</strong> KWD ${delivery_charge.toFixed(
              2
            )}</p>
            <p><strong>Total:</strong> KWD ${total.toFixed(2)}</p>

             <div class="button-container">
                <a href="${acceptUrl}" class="btn">Accept Order</a>
                <a href="${rejectUrl}" class="btn btn-reject">Reject Order</a>
            </div>
            <p>Please process this order as soon as possible. Thank you!</p>
        </div>
    </body>
    </html>
    `;
}

function createOrderConfirmEmailTemplate(order, products) {
  const { subtotal, delivery_charge, total, status, _id } = order;

  let orderItemsHTML = products
    .map(
      (item) => `
        <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${item.size}${item.unit}</td>
            <td>KWD ${item.price.toFixed(2)}</td>
        </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 5px; }
            h1 { color: #333; }
            p { font-size: 16px; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
            th { background-color: #f4f4f4; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Order Confirmation</h1>
            <p>Thank you for your purchase! Here are the details of your order:</p>
            <p><strong>Order ID:</strong> ${_id}</p>
            <p><strong>Status:</strong> ${status}</p>
            <table>
                <thead>
                    <tr>
                        <th>Product Name</th>
                        <th>Quantity</th>
                        <th>Size</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${orderItemsHTML}
                </tbody>
            </table>
            <p><strong>Subtotal:</strong> KWD ${subtotal.toFixed(2)}</p>
            <p><strong>Delivery Charge:</strong> KWD ${delivery_charge.toFixed(
              2
            )}</p>
            <p><strong>Total:</strong> KWD ${total.toFixed(2)}</p>

            

            <p>We appreciate your business and hope you enjoy your purchase!</p>
        </div>
    </body>
    </html>
    `;
}
