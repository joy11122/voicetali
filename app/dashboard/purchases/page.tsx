"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

type Party = { _id: string; name: string; partyType: string };
type Product = {
  _id: string;
  name: string;
  unit: string;
  stockQuantity: number;
  unitPrice?: number;
  buyPrice?: number;
};
type Purchase = {
  _id: string;
  amount: number;
  quantity: number;
  partyId?: { name?: string };
  productId?: { name?: string };
};
type FormState = {
  partyId: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  paidAmount: string;
  notes: string;
};

export default function Page() {
  const [parties, setParties] = useState<Party[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [rows, setRows] = useState<Purchase[]>([]);
  const [form, setForm] = useState<FormState>({
    partyId: "",
    productId: "",
    quantity: "1",
    unitPrice: "0",
    paidAmount: "0",
    notes: "",
  });
  const [message, setMessage] = useState("");

  const load = async (): Promise<void> => {
    const response = await fetch("/api/purchases");
    const data = await response.json();
    setRows(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    let active = true;
    void Promise.all([
      fetch("/api/parties").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ]).then(([partyData, productData]) => {
      if (!active) return;
      setParties(
        Array.isArray(partyData)
          ? partyData.filter((party: Party) => party.partyType === "SUPPLIER")
          : [],
      );
      setProducts(Array.isArray(productData) ? productData : []);
    });
    void load();
    return () => {
      active = false;
    };
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const quantity = Number(form.quantity);
    const unitPrice = Number(form.unitPrice);
    const paidAmount = Number(form.paidAmount);
    const total = quantity * unitPrice;

    if (paidAmount > total) {
      setMessage("Paid amount cannot exceed total");
      return;
    }

    const response = await fetch("/api/purchases", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, quantity, unitPrice, paidAmount }),
    });
    const data = await response.json();
    setMessage(
      response.ok
        ? `Saved. Total ৳${data.result.total} • Due ৳${data.result.due}`
        : data.error || "Failed",
    );

    if (response.ok) {
      setForm({
        partyId: "",
        productId: "",
        quantity: "1",
        unitPrice: "0",
        paidAmount: "0",
        notes: "",
      });
      await load();
      const productsResponse = await fetch("/api/products");
      const productsData = await productsResponse.json();
      setProducts(Array.isArray(productsData) ? productsData : []);
      window.dispatchEvent(new Event("talikhata:refresh"));
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-bold">ক্রয়</h1>
      <p className="mt-2 text-slate-500">
        Complete purchases flow with automatic stock and party balance updates.
      </p>

      <form
        onSubmit={save}
        className="mt-6 grid gap-3 rounded-2xl border bg-white p-5 md:grid-cols-6"
      >
        <select
          className="field"
          value={form.partyId}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            setForm({ ...form, partyId: event.target.value })
          }
        >
          <option value="">Select supplier</option>
          {parties.map((party) => (
            <option key={party._id} value={party._id}>
              {party.name}
            </option>
          ))}
        </select>

        <select
          className="field"
          value={form.productId}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => {
            const product = products.find((item) => item._id === event.target.value);
            setForm({
              ...form,
              productId: event.target.value,
              unitPrice: String(product?.buyPrice ?? product?.unitPrice ?? 0),
            });
          }}
        >
          <option value="">Select product</option>
          {products.map((product) => (
            <option key={product._id} value={product._id}>
              {product.name} • {product.stockQuantity} {product.unit}
            </option>
          ))}
        </select>

        <input
          className="field"
          type="number"
          min="0.01"
          step="0.01"
          value={form.quantity}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setForm({ ...form, quantity: event.target.value })
          }
          placeholder="Quantity"
        />
        <input
          className="field"
          type="number"
          min="0"
          step="0.01"
          value={form.unitPrice}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setForm({ ...form, unitPrice: event.target.value })
          }
          placeholder="Buy price"
        />
        <input
          className="field"
          type="number"
          min="0"
          step="0.01"
          value={form.paidAmount}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setForm({ ...form, paidAmount: event.target.value })
          }
          placeholder="Paid"
        />
        <button className="btn-primary" type="submit">
          Save
        </button>
        {message && <p className="md:col-span-6 text-sm">{message}</p>}
      </form>

      <div className="mt-6 rounded-2xl border bg-white p-5">
        <h2 className="font-semibold">Recent</h2>
        {rows.map((row) => (
          <div key={row._id} className="border-b py-3">
            {row.productId?.name || "Product"} • ৳{row.amount} • Qty {row.quantity} • {row.partyId?.name || "Walk-in"}
          </div>
        ))}
      </div>
    </div>
  );
}
