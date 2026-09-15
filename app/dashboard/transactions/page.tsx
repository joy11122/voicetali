"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Plus, Trash2 } from "lucide-react";

const labels: Record<string, string> = {
  DUE_GIVEN: "বাকি দেওয়া",
  DUE_RECEIVED: "জমা নেওয়া",
  STOCK_IN: "স্টক যোগ",
  STOCK_OUT: "স্টক বের",
  EXPENSE: "খরচ",
  SALE: "বিক্রি",
};

const empty = {
  type: "EXPENSE",
  partyId: "",
  productId: "",
  amount: 0,
  quantity: 0,
  unitPrice: 0,
  notes: "",
};

export default function TransactionsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [error, setError] = useState("");

  const load = async (): Promise<void> => {
    const response = await fetch("/api/transactions?limit=200");
    const data = await response.json();
    setRows(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    void load();
    void Promise.all([
      fetch("/api/parties").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ]).then(([partyData, productData]) => {
      setParties(Array.isArray(partyData) ? partyData : []);
      setProducts(Array.isArray(productData) ? productData : []);
    });
  }, []);

  const summary = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc.sales += row.type === "SALE" ? Number(row.amount) : 0;
          acc.expense += row.type === "EXPENSE" ? Number(row.amount) : 0;
          acc.due +=
            row.type === "DUE_GIVEN"
              ? Number(row.amount)
              : row.type === "DUE_RECEIVED"
                ? -Number(row.amount)
                : 0;
          return acc;
        },
        { sales: 0, expense: 0, due: 0 },
      ),
    [rows],
  );

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const body = {
      ...form,
      partyId: form.partyId || null,
      productId: form.productId || null,
      amount: Number(form.amount),
      quantity: Number(form.quantity),
      unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined,
    };

    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Could not save");
      return;
    }

    setForm({ ...empty });
    await load();
    const productsResponse = await fetch("/api/products");
    const productsData = await productsResponse.json();
    setProducts(Array.isArray(productsData) ? productsData : []);
  }

  async function del(id: string) {
    if (!confirm("Delete this transaction and reverse its effect?")) return;

    const response = await fetch(`/api/transactions?id=${id}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) {
      alert(data.error || "Could not delete");
      return;
    }

    await load();
    window.dispatchEvent(new Event("talikhata:refresh"));
  }

  const needsParty = ["DUE_GIVEN", "DUE_RECEIVED"].includes(form.type);
  const needsProduct = ["STOCK_IN", "STOCK_OUT", "SALE"].includes(form.type);

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <p className="text-sm font-semibold text-emerald-700">Cash flow</p>
        <h1 className="text-3xl font-bold">দৈনিক হিসাব</h1>
        <p className="mt-2 text-slate-500">
          Record sales, expenses, dues and stock movements. Deleting a transaction safely reverses its effect.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">Sales</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            ৳{summary.sales.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">Expenses</p>
          <p className="mt-1 text-2xl font-bold text-red-600">
            ৳{summary.expense.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">Net due movement</p>
          <p className="mt-1 text-2xl font-bold">
            ৳{summary.due.toLocaleString()}
          </p>
        </div>
      </div>

      <form onSubmit={add} className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 font-semibold">
          <Plus size={18} /> Quick transaction
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <select
            className="field"
            value={form.type}
            onChange={(event) => setForm({ ...empty, type: event.target.value })}
          >
            {Object.entries(labels).map(([key, value]) => (
              <option key={key} value={key}>
                {String(value)}
              </option>
            ))}
          </select>

          {needsParty ? (
            <select
              className="field"
              value={form.partyId}
              onChange={(event) => setForm({ ...form, partyId: event.target.value })}
            >
              <option value="">Select party</option>
              {parties.map((party) => (
                <option key={party._id} value={party._id}>
                  {party.name}
                </option>
              ))}
            </select>
          ) : needsProduct ? (
            <select
              className="field"
              value={form.productId}
              onChange={(event) => setForm({ ...form, productId: event.target.value })}
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name} ({product.stockQuantity} {product.unit})
                </option>
              ))}
            </select>
          ) : (
            <input
              className="field"
              placeholder="Notes / category"
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          )}

          <input
            className="field"
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount ৳"
            value={form.amount}
            onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })}
          />

          {needsProduct && (
            <input
              className="field"
              type="number"
              min="0"
              step="0.01"
              placeholder="Quantity"
              value={form.quantity}
              onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })}
            />
          )}

          <button className="btn-primary" type="submit">
            Save
          </button>
        </div>

        {needsParty && (
          <input
            className="field mt-3"
            placeholder="Notes"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        )}
        {needsProduct && (
          <input
            className="field mt-3"
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </form>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Type</th>
                <th className="p-4">Party / Product</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Qty</th>
                <th className="p-4">Notes</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id} className="border-t">
                  <td className="whitespace-nowrap p-4">
                    {new Date(row.timestamp).toLocaleString("en-BD")}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1">
                      {[
                        "DUE_RECEIVED",
                        "SALE",
                        "STOCK_IN",
                      ].includes(row.type) ? (
                        <ArrowDownLeft size={14} className="text-emerald-600" />
                      ) : (
                        <ArrowUpRight size={14} className="text-red-500" />
                      )}
                      {labels[row.type] || row.type}
                    </span>
                  </td>
                  <td className="p-4">
                    {row.partyId?.name || row.productId?.name || "—"}
                  </td>
                  <td className="p-4 font-medium">
                    ৳{Number(row.amount || 0).toLocaleString()}
                  </td>
                  <td className="p-4">{row.quantity || "—"}</td>
                  <td className="p-4 text-slate-500">{row.notes || "—"}</td>
                  <td className="p-4">
                    <button
                      type="button"
                      onClick={() => void del(row._id)}
                      className="text-red-500"
                      aria-label="Delete transaction"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <p className="py-12 text-center text-slate-400">No transactions yet.</p>
        )}
      </div>
    </div>
  );
}
