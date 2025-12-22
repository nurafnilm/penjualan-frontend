'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

interface Product {
  id: number;
  nama: string;
  harga: number;
}

interface Transaction {
  id: number;
  nama_pembeli: string;
  product_id: number;
  quantity: number;
  harga: number;
  total: number;
  product: Product;
  created_at: string;
}

interface PostForm {
  nama_pembeli: string;
  product_id: number;
  quantity: number;
}

const ITEMS_PER_PAGE = 10;

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [productSuggestions, setProductSuggestions] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const router = useRouter();
  const productDebounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const { register, handleSubmit, reset, setValue, watch } = useForm<PostForm>();
  const quantity = watch('quantity');

  // Fetch transaksi — hanya dipanggil saat perlu
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions`;
      if (searchQuery.trim()) {
        url += `?search=${encodeURIComponent(searchQuery.trim())}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data: Transaction[] = await res.json();
        const sorted = data.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setTransactions(sorted);
        setCurrentPage(1); // Reset pagination saat search
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load + saat search berubah
  useEffect(() => {
    fetchTransactions();
  }, [searchQuery]);

  // Search produk untuk form
  useEffect(() => {
    if (productSearchQuery.length < 2) {
      setProductSuggestions([]);
      return;
    }
    if (productDebounceTimeout.current) clearTimeout(productDebounceTimeout.current);
    productDebounceTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?search=${encodeURIComponent(productSearchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setProductSuggestions(data);
        }
      } catch (error) {
        console.error('Error searching products:', error);
      }
    }, 300);

    return () => {
      if (productDebounceTimeout.current) clearTimeout(productDebounceTimeout.current);
    };
  }, [productSearchQuery]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setValue('product_id', product.id);
    setProductSearchQuery(product.nama);
    setProductSuggestions([]);
  };

  const onSubmit = async (data: PostForm) => {
    const namaPembeli = data.nama_pembeli.trim();
    if (!namaPembeli || !selectedProduct || data.quantity <= 0) {
      alert('Lengkapi semua field dengan benar!');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, nama_pembeli: namaPembeli }),
      });

      if (res.ok) {
        const result = await res.json();
        reset();
        setSelectedProduct(null);
        setProductSearchQuery('');
        fetchTransactions(); // Refresh list
        alert(`Transaksi berhasil! Total: Rp ${result.total.toLocaleString('id-ID')}`);
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Gagal: ' + (err.error || 'Server error'));
      }
    } catch (error) {
      alert('Koneksi error. Pastikan backend nyala.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Kiri: Welcome */}
        <div className="flex flex-col justify-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            Selamat Datang di Penjualan App
          </h2>
          <p className="text-xl text-gray-600">
            Kelola transaksi dan produk dengan mudah. Cari, tambah, atau update data secara real-time!
          </p>
        </div>

        {/* Kanan: Search + Form Tambah */}
        <div className="space-y-8">
          <input
            type="text"
            placeholder="Cari nama pembeli atau produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-full focus:outline-none focus:ring-4 focus:ring-blue-900 focus:border-blue-900 transition-all"
          />

          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Tambah Transaksi Baru</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <input
                {...register('nama_pembeli', { required: true })}
                placeholder="Nama Pembeli"
                className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-900 focus:border-blue-900"
              />

              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari produk..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-900 focus:border-blue-900"
                />
                {productSuggestions.length > 0 && (
                  <ul className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {productSuggestions.map((p) => (
                      <li
                        key={p.id}
                        onClick={() => handleProductSelect(p)}
                        className="px-5 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-0"
                      >
                        <strong>{p.nama}</strong> - Rp {p.harga.toLocaleString('id-ID')}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {selectedProduct && (
                <div className="p-5 bg-blue-50 rounded-lg">
                  <p><strong>Produk dipilih:</strong> {selectedProduct.nama}</p>
                  <p><strong>Harga satuan:</strong> Rp {selectedProduct.harga.toLocaleString('id-ID')}</p>
                </div>
              )}

              <input
                {...register('quantity', { required: true, min: 1, valueAsNumber: true })}
                type="number"
                min="1"
                placeholder="Quantity"
                className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-900 focus:border-blue-900"
              />

              {selectedProduct && quantity > 0 && (
                <div className="text-right text-xl font-bold text-blue-900 bg-blue-100 p-4 rounded-lg">
                  Total: Rp {(quantity * selectedProduct.harga).toLocaleString('id-ID')}
                </div>
              )}

              <button
                type="submit"
                disabled={submitLoading || !selectedProduct || !quantity}
                className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold transition-all"
              >
                {submitLoading ? 'Menyimpan...' : 'Simpan Transaksi'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Tabel Transaksi */}
      <div className="max-w-7xl mx-auto px-6 mt-16">
        <h3 className="text-3xl font-bold text-center mb-8 text-gray-800">Daftar Transaksi</h3>

        {loading ? (
          <p className="text-center text-gray-500 text-lg">Memuat data...</p>
        ) : transactions.length === 0 ? (
          <p className="text-center text-gray-500 text-lg">Belum ada transaksi. Tambahkan yang pertama!</p>
        ) : (
          <>
            <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
              <table className="w-full text-left">
                <thead className="bg-blue-900 text-white">
                  <tr>
                    <th className="px-6 py-5 font-semibold">Pembeli</th>
                    <th className="px-6 py-5 font-semibold">Produk</th>
                    <th className="px-6 py-5 font-semibold text-center">Qty</th>
                    <th className="px-6 py-5 font-semibold text-right">Harga Satuan</th>
                    <th className="px-6 py-5 font-semibold text-right">Total</th>
                    <th className="px-6 py-5 font-semibold text-right">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => router.push(`/transactions/${t.id}`)}
                      className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-medium">{t.nama_pembeli}</td>
                      <td className="px-6 py-4">{t.product.nama}</td>
                      <td className="px-6 py-4 text-center">{t.quantity}</td>
                      <td className="px-6 py-4 text-right">Rp {t.harga.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-right font-bold text-green-700">
                        Rp {t.total.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        {new Date(t.created_at).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-6 mt-10">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-8 py-3 bg-blue-900 text-white rounded-lg disabled:opacity-50 hover:bg-blue-800 font-medium"
                >
                  Previous
                </button>
                <span className="py-3 px-6 text-lg">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-8 py-3 bg-blue-900 text-white rounded-lg disabled:opacity-50 hover:bg-blue-800 font-medium"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}