'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

export default function ForecastPage() {
  const [file, setFile] = useState<File | null>(null);
  const [forecastPeriod, setForecastPeriod] = useState(30);
  const [historyDaysToShow, setHistoryDaysToShow] = useState(90); // Default tampilkan 90 hari historis
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.toLowerCase().endsWith('.csv')) {
        setFile(selectedFile);
        setResult(null);
        setError(null);
        setForecastPeriod(30);
        setHistoryDaysToShow(90);
      } else {
        setError('Harap upload file CSV saja');
        setFile(null);
      }
    }
  };

  const runForecast = async (periods: number) => {
    if (!file) {
      setError('Pilih file CSV terlebih dahulu');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('csvFile', file);
    formData.append('periods', periods.toString());

    try {
      const res = await fetch('http://localhost:8080/api/v1/forecast/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.details || errData.error || 'Gagal melakukan forecast');
      }

      const data = await res.json();
      setResult(data);
      setForecastPeriod(periods);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat forecast');
    } finally {
      setLoading(false);
    }
  };

  // Otomatis forecast saat file baru diupload
  useEffect(() => {
    if (file && !result) {
      runForecast(30);
    }
  }, [file]);

  // Auto-adjust history days berdasarkan forecast period (opsional, bisa dihapus kalau tidak mau)
  useEffect(() => {
    if (forecastPeriod <= 30) {
      setHistoryDaysToShow(90);
    } else if (forecastPeriod <= 90) {
      setHistoryDaysToShow(180);
    } else {
      setHistoryDaysToShow(365);
    }
  }, [forecastPeriod]);

  // === DATA UNTUK GRAFIK ===
  const limitedHistorical = useMemo(() => {
    if (!result?.historical || historyDaysToShow === 9999) {
      return result?.historical || [];
    }
    const histLength = result.historical.length;
    const startIdx = Math.max(0, histLength - historyDaysToShow);
    return result.historical.slice(startIdx);
  }, [result?.historical, historyDaysToShow]);

  const displayedSeparatorDate =
    limitedHistorical.length > 0
      ? limitedHistorical[limitedHistorical.length - 1].ds
      : null;

  const chartData = useMemo(() => {
    if (!result) return [];
    return [
      ...limitedHistorical.map((item: any) => ({
        ...item,
        type: 'historical',
      })),
      ...result.forecast.map((item: any) => ({
        ...item,
        type: 'forecast',
        y: null, // Sembunyikan nilai aktual di masa depan
      })),
    ];
  }, [limitedHistorical, result?.forecast]);

  // === TOTAL PREDIKSI ===
  const totalForecast = useMemo(() => {
    return result?.forecast
      ? result.forecast.reduce((sum: number, item: any) => sum + Math.round(item.yhat), 0)
      : 0;
  }, [result?.forecast]);

  // === FILTER & PAGINATION TABEL ===
  const filteredForecast = useMemo(() => {
    if (!result?.forecast) return [];
    if (!searchTerm) return result.forecast;

    const lowerSearch = searchTerm.toLowerCase();
    return result.forecast.filter((item: any) =>
      item.ds.toLowerCase().includes(lowerSearch)
    );
  }, [result?.forecast, searchTerm]);

  const displayedForecast = useMemo(() => {
    return rowsPerPage === 9999
      ? filteredForecast
      : filteredForecast.slice(0, rowsPerPage);
  }, [filteredForecast, rowsPerPage]);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-10">
        Forecast Penjualan Samsung
      </h1>

      {/* ==== Upload CSV ==== */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-10">
        <label className="block text-xl font-medium text-gray-700 mb-4">
          Upload File CSV Penjualan
        </label>
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="dropzone-file"
            className="flex flex-col items-center justify-center w-full h-64 border-4 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {file ? (
                <>
                  <FileText className="w-16 h-16 text-green-500 mb-4" />
                  <p className="text-lg font-medium text-gray-800">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Ukuran: {(file.size / 1024).toFixed(1)} KB
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-xl font-medium text-gray-600">
                    Klik atau drag file CSV ke sini
                  </p>
                </>
              )}
            </div>
            <input
              id="dropzone-file"
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* ==== Jika sudah ada file ==== */}
      {file && (
        <>
          {/* Pengaturan Forecast & Tampilan Grafik */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-10">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Pengaturan Forecast
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Periode Forecast */}
              <div className="flex flex-col gap-4">
                <label className="text-lg font-medium text-gray-700">
                  Prediksi untuk berapa hari ke depan?
                </label>
                <select
                  value={forecastPeriod}
                  onChange={(e) => runForecast(Number(e.target.value))}
                  disabled={loading}
                  className="px-6 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={7}>7 hari</option>
                  <option value={14}>14 hari</option>
                  <option value={30}>30 hari</option>
                  <option value={60}>60 hari</option>
                  <option value={90}>90 hari</option>
                  <option value={180}>180 hari</option>
                  <option value={365}>365 hari</option>
                </select>
              </div>

              {/* Historis di Grafik */}
              <div className="flex flex-col gap-4">
                <label className="text-lg font-medium text-gray-700">
                  Tampilkan data historis terakhir di grafik:
                </label>
                <select
                  value={historyDaysToShow}
                  onChange={(e) => setHistoryDaysToShow(Number(e.target.value))}
                  className="px-6 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={30}>30 hari</option>
                  <option value={60}>60 hari</option>
                  <option value={90}>90 hari</option>
                  <option value={180}>180 hari</option>
                  <option value={365}>365 hari</option>
                  <option value={9999}>Semua data historis</option>
                </select>
              </div>
            </div>

            {loading && (
              <div className="mt-6 flex items-center gap-3 text-blue-600">
                <Loader2 className="animate-spin w-7 h-7" />
                <span className="text-lg font-medium">Sedang menghitung forecast...</span>
              </div>
            )}
          </div>

          {/* ==== Grafik ==== */}
        {result && (
        <div className="bg-white rounded-xl shadow-lg p-8 mb-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Grafik Forecast Penjualan ({forecastPeriod} Hari ke Depan)
            </h2>

            <ResponsiveContainer width="100%" height={500}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                dataKey="ds"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="line" />

                <Area
                type="monotone"
                dataKey="yhat_upper"
                stroke="none"
                fill="#e5e7eb"
                fillOpacity={0.6}
                name="Batas Atas (Confidence)"
                />
                <Area
                type="monotone"
                dataKey="yhat_lower"
                stroke="none"
                fill="#ffffff"
                fillOpacity={1}
                name="Batas Bawah (Confidence)"
                />

                <Line
                type="monotone"
                dataKey="yhat"
                stroke="#f97316"
                strokeWidth={3}
                dot={false}
                name="Prediksi"
                />

                <Line
                type="monotone"
                dataKey="y"
                stroke="#2563eb"
                strokeWidth={3}
                dot={false}
                name="Penjualan Aktual"
                />

                {displayedSeparatorDate && (
                <ReferenceLine
                    x={displayedSeparatorDate}
                    stroke="#ef4444"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                />
                )}
            </ComposedChart>
            </ResponsiveContainer>

            <p className="mt-6 text-center text-gray-600 text-sm">
            Garis biru: Penjualan Aktual • Garis oranye: Prediksi • 
            Area abu-abu: Confidence Interval • 
            <span className="text-red-600 font-medium">Garis merah putus-putus: Mulai Forecast</span>
            </p>
        </div>
        )}

          {/* ==== Tabel Forecast ==== */}
          {result && result.forecast && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Tabel Hasil Forecast ({forecastPeriod} Hari ke Depan)
              </h2>

              {/* Search & Rows per page */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Cari tanggal (misal: 2025-12-25 atau 25)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-80 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex items-center gap-3">
                  <span className="text-gray-700">Tampilkan:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={9999}>Semua</option>
                  </select>
                  <span className="text-gray-700">baris</span>
                </div>
              </div>

              {/* Tabel */}
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 border border-gray-300">
                        Tanggal
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-medium text-gray-700 border border-gray-300">
                        Prediksi (yhat)
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-medium text-gray-700 border border-gray-300">
                        Lower
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-medium text-gray-700 border border-gray-300">
                        Upper
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedForecast.map((item: any, idx: number) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-6 py-4 text-sm text-gray-800 border border-gray-300">
                          {item.ds}
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-gray-900 border border-gray-300">
                          {Math.round(item.yhat)}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-600 border border-gray-300">
                          {Math.round(item.yhat_lower)}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-600 border border-gray-300">
                          {Math.round(item.yhat_upper)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-sm text-gray-600 text-right">
                Menampilkan {displayedForecast.length} dari {result.forecast.length} hari
                {searchTerm && ` (difilter)`}
              </div>

              {/* Total */}
              <p className="mt-10 text-xl text-gray-700 text-center">
                Total prediksi penjualan {forecastPeriod} hari ke depan:{' '}
                <span className="font-bold text-4xl text-blue-600">
                  {totalForecast.toLocaleString('id-ID')}
                </span>{' '}
                unit
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}