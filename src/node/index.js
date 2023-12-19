const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));

const port = 3520;

const cors = require("cors");
app.use(cors());

const { Pool } = require("pg");
const pool = new Pool({
  user: "user_3520", // PostgreSQLのユーザー名に置き換えてください
  host: "172.24.0.2",
  database: "crm_3520", // PostgreSQLのデータベース名に置き換えてください
  password: "pass_3520", // PostgreSQLのパスワードに置き換えてください
  port: 5432,
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.get("/customers", async (req, res) => {
  try {
    const customerData = await pool.query("SELECT * FROM customers");
    res.send(customerData.rows);
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/add-customer", async (req, res) => {
  try {
    const { companyName, industry, contact, location } = req.body;
    const newCustomer = await pool.query(
      "INSERT INTO customers (company_name, industry, contact, location) VALUES ($1, $2, $3, $4) RETURNING *",
      [companyName, industry, contact, location]
    );
    res.json({ success: true, customer: newCustomer.rows[0] });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

app.get("/customers/:id", async (req, res) => {
  const customerId = req.params.id;
  try {
    const customerData = await pool.query("SELECT * FROM customers WHERE customer_id = $1", [customerId]);
    if (customerData.rows.length === 0) {
      res.status(404).send("Customer not found");
    } else {
      res.send(customerData.rows[0]);
    }
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});

app.put("/customers/:id", async (req, res) => {
  const customerId = req.params.id;
  const { companyName, industry, contact, location, deleted } = req.body;

  try {
    if (deleted !== undefined) {
      // "deleted" プロパティがリクエストボディに含まれている場合は、deletedフラグを更新
      await pool.query("UPDATE customers SET deleted = $1 WHERE customer_id = $2", [deleted, customerId]);
    } else {
      // deleted プロパティがない場合は、会社名、業界、連絡先、場所を更新
      await pool.query(
        "UPDATE customers SET company_name = $1, industry = $2, contact = $3, location = $4 WHERE customer_id = $5",
        [companyName, industry, contact, location, customerId]
      );
    }
    res.send({ success: true });
  } catch (err) {
    console.error(err);
    res.send({ success: false });
  }
});


// 顧客情報を削除するエンドポイント
app.delete("/customers/:id", async (req, res) => {
  const customerId = req.params.id;
  try {
    await pool.query("DELETE FROM customers WHERE customer_id = $1", [customerId]);
    res.json({ success: true, message: "Customer deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to delete customer" });
  }
});
app.use(express.static("public"));
