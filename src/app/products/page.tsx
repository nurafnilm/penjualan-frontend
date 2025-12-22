'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Product {
  id: number;
  nama: string;
  harga: number;
  created_at: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ nama: '', harga: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (query = '') => {
    setLoading(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products`;
      if (query) url += `?search=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        setSearchResults(data);
      } else {
        console.error('Fetch products failed:', res.statusText);
      }
    } catch (error) {
      console.error('Error fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(searchQuery);
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId 
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${editingId}` 
      : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products`;
    const method = editingId ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData({ nama: '', harga: 0 });
        fetchProducts(searchQuery);
        console.log(`${editingId ? 'Update' : 'Create'} berhasil!`);
      } else {
        console.error('Submit failed:', res.statusText);
      }
    } catch (error) {
      console.error('Error submit:', error);
    }
  };

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setFormData({ nama: p.nama, harga: p.harga });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Yakin hapus produk ini?')) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${id}`, { 
          method: 'DELETE' 
        });
        if (res.ok) {
          fetchProducts(searchQuery);
        } else {
          console.error('Delete failed:', res.statusText);
        }
      } catch (error) {
        console.error('Error delete:', error);
      }
    }
  };

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Kelola Produk</h1>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Kembali ke Transaksi
          </button>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <input
            type="text"
            placeholder="Cari nama produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => { 
              setShowForm(true); 
              setEditingId(null); 
              setFormData({ nama: '', harga: 0 }); 
            }}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            + Tambah Produk
          </button>
        </div>

        {showForm && (
            <div className="mb-8 p-6 bg-white rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                    type="text"
                    placeholder="Nama Produk"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                <input
                    type="text"  // <--- DIUBAH JADI TEXT BIAR GAK ADA NOL OTOMATIS
                    inputMode="numeric"  // <--- BIAR KEYBOARD ANGKA DI HP
                    pattern="[0-9]*"  // <--- VALIDASI ANGKA SAJA
                    placeholder="Harga (tanpa Rp atau titik)"
                    value={formData.harga === 0 ? '' : formData.harga}  // <--- KALAU 0, KOSONGIN BIAR GAK KELIATAN "0"
                    onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');  // HANYA ANGKA
                    setFormData({ ...formData, harga: value === '' ? 0 : parseInt(value) || 0 });
                    }}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                <div className="md:col-span-2 flex gap-3">
                    <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    {editingId ? 'Update' : 'Simpan'}
                    </button>
                    <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditingId(null); }}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                    >
                    Batal
                    </button>
                </div>
                </form>
            </div>
            )}

        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">No</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Nama Produk</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Harga</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Tanggal Dibuat</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {searchResults.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      Tidak ada produk. Tambah produk baru dulu!
                    </td>
                  </tr>
                ) : (
                  searchResults.map((p, index) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-700">{index + 1}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.nama}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">Rp {p.harga.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(p.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(p)}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}