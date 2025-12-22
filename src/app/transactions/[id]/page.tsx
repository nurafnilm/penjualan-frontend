'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

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

interface UpdateForm {
  quantity: number;
}

export default function TransactionDetail() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const { register: registerUpdate, handleSubmit: handleUpdateSubmit, reset, watch } = useForm<UpdateForm>();
  const quantity = watch('quantity'); // Buat preview real-time

  useEffect(() => {
    fetchTransaction();
  }, [id]);

  const fetchTransaction = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTransaction(data);
        reset({ quantity: data.quantity });
      } else {
        console.error('Fetch failed:', res.statusText);
      }
    } catch (error) {
      console.error('Error fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const onUpdateSubmit = async (data: UpdateForm) => {
    if (data.quantity <= 0) {
      alert('Quantity minimal 1!');
      return;
    }

    // DEBUG: Log types & body
    const jsonBody = JSON.stringify(data);
    console.log('Update data types:', typeof data.quantity, data.quantity); // Harus "number 5"
    console.log('Sending JSON body:', jsonBody); // Harus {"quantity":5} tanpa quotes

    setUpdating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: jsonBody,
      });
      if (res.ok) {
        const result = await res.json();
        console.log('Update berhasil!', result);
        fetchTransaction(); // Refresh data
        alert(`Update sukses! Total baru: Rp ${result.total.toLocaleString()}`);
      } else {
        // Parse error detail dari server
        let errorMsg = 'Update gagal.';
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorMsg;
        } catch {}
        console.error('Update failed:', res.status, res.statusText, errorMsg);
        alert(`Error: ${errorMsg}`); // E.g., "Quantity must be positive"
      }
    } catch (error) {
      console.error('Error update:', error);
      alert('Koneksi error: Pastikan server jalan');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Yakin hapus transaksi ini?')) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions/${id}`, { method: 'DELETE' });
        if (res.ok) {
          alert('Dihapus!');
          router.push('/');
        } else {
          console.error('Delete failed:', res.statusText);
          alert('Gagal hapus');
        }
      } catch (error) {
        console.error('Error delete:', error);
        alert('Error hapus');
      }
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (!transaction) return <div className="flex justify-center items-center min-h-screen">Transaksi tidak ditemukan</div>;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Detail Transaksi #{transaction.id}</h1>
        <div className="mb-4 p-3 bg-gray-50 rounded space-y-2">
          <p><strong>Pembeli:</strong> {transaction.nama_pembeli}</p>
          <p><strong>Produk:</strong> <a href={`/products/${transaction.product.id}`} className="text-blue-500 underline">{transaction.product.nama}</a></p>
          <p><strong>Harga Unit:</strong> Rp {transaction.harga.toLocaleString()}</p>
          <p><strong>Quantity:</strong> {transaction.quantity}</p>
          <p><strong>Total:</strong> Rp {transaction.total.toLocaleString()}</p>
          <p><strong>Tanggal:</strong> {new Date(transaction.created_at).toLocaleString('id-ID')}</p>
        </div>
        <form onSubmit={handleUpdateSubmit(onUpdateSubmit)} className="space-y-4 mb-4">
          <input
            {...registerUpdate('quantity', { min: 1, valueAsNumber: true })} // FIX: Parse ke number!
            type="number"
            className="w-full px-3 py-2 border rounded"
            placeholder="Update Quantity"
          />
          {transaction && quantity && quantity > 0 && (
            <p className="text-sm text-green-600 font-bold">
              Preview Total: Rp {(quantity * transaction.harga).toLocaleString()}
            </p>
          )}
          <button
            type="submit"
            disabled={updating}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {updating ? 'Updating...' : 'Update Quantity'}
          </button>
        </form>
        <button
          onClick={handleDelete}
          className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 mb-2"
        >
          Delete Transaksi
        </button>
        <button
          onClick={() => router.push('/')}
          className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Kembali
        </button>
      </div>
    </main>
  );
}