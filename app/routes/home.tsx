// @ts-nocheck
import { useEffect, useState } from 'react';
import '../app.css';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MilkTrackerDB', 1);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('milk')) {
                db.createObjectStore('milk', { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveToDB(data) {
    const db = await openDB();
    const tx = db.transaction('milk', 'readwrite');
    const store = tx.objectStore('milk');
    store.put({ id: 'month-data', ...data });
    return tx.complete;
}

async function loadFromDB() {
    const db = await openDB();
    return new Promise(resolve => {
        const tx = db.transaction('milk', 'readonly');
        const store = tx.objectStore('milk');
        const request = store.get('month-data');

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
    });
}

async function clearDB() {
    const db = await openDB();
    const tx = db.transaction('milk', 'readwrite');
    const store = tx.objectStore('milk');
    store.delete('month-data');
    return tx.complete;
}

export default function Home() {
    const daysInMonth = 31;

    const emptyEntries = Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        cowQty: '',
        buffQty: '',
    }));

    const [cowPrice, setCowPrice] = useState('');
    const [buffPrice, setBuffPrice] = useState('');
    const [entries, setEntries] = useState(emptyEntries);

    useEffect(() => {
        loadFromDB().then(saved => {
            if (saved) {
                setCowPrice(saved.cowPrice || '');
                setBuffPrice(saved.buffPrice || '');
                setEntries(saved.entries || emptyEntries);
            }
        });
    }, []);

    useEffect(() => {
        saveToDB({ cowPrice, buffPrice, entries });
    }, [cowPrice, buffPrice, entries]);

    const updateQty = (index, field, value) => {
        const updated = [...entries];
        updated[index][field] = value;
        setEntries(updated);
    };

    // 🔥 RESET ALL BUTTON ACTION
    const handleReset = async () => {
        setCowPrice('');
        setBuffPrice('');
        setEntries(emptyEntries);
        await clearDB();
    };

    const totalCow = entries.reduce(
        (t, e) => t + Number(e.cowQty || 0) * Number(cowPrice || 0),
        0,
    );

    const totalBuff = entries.reduce(
        (t, e) => t + Number(e.buffQty || 0) * Number(buffPrice || 0),
        0,
    );

    const grandTotal = totalCow + totalBuff;

    return (
        <div className="min-h-screen p-4 flex flex-col items-center bg-white text-black">
            <h1 className="text-2xl font-bold mb-4">Monthly Milk Tracker</h1>

            {/* PRICE FIELDS */}
            <div className="bg-white p-4 rounded-xl shadow w-full max-w-xl mb-5 border">
                <h2 className="font-semibold text-lg mb-3">
                    Milk Prices (per Liter)
                </h2>

                <div className="flex gap-3">
                    <input
                        type="number"
                        className="border p-2 w-full rounded"
                        placeholder="Cow Price"
                        value={cowPrice}
                        onChange={e => setCowPrice(e.target.value)}
                    />
                    <input
                        type="number"
                        className="border p-2 w-full rounded"
                        placeholder="Buffalo Price"
                        value={buffPrice}
                        onChange={e => setBuffPrice(e.target.value)}
                    />
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white p-4 rounded-xl shadow w-full max-w-3xl border">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border p-2">Day</th>
                            <th className="border p-2">Cow Qty (L)</th>
                            <th className="border p-2">Buff Qty (L)</th>
                            <th className="border p-2">Total (₹)</th>
                        </tr>
                    </thead>

                    <tbody>
                        {entries.map((e, i) => (
                            <tr key={i}>
                                <td className="border p-2 text-center">
                                    {e.day}
                                </td>

                                <td className="border p-2">
                                    <input
                                        type="number"
                                        className="border p-1 rounded w-full"
                                        value={e.cowQty}
                                        onChange={ev =>
                                            updateQty(
                                                i,
                                                'cowQty',
                                                ev.target.value,
                                            )
                                        }
                                    />
                                </td>

                                <td className="border p-2">
                                    <input
                                        type="number"
                                        className="border p-1 rounded w-full"
                                        value={e.buffQty}
                                        onChange={ev =>
                                            updateQty(
                                                i,
                                                'buffQty',
                                                ev.target.value,
                                            )
                                        }
                                    />
                                </td>

                                <td className="border p-2 text-center font-medium">
                                    {Number(e.cowQty || 0) *
                                        Number(cowPrice || 0) +
                                        Number(e.buffQty || 0) *
                                            Number(buffPrice || 0)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* TOTALS */}
                <div className="mt-4 bg-gray-100 p-3 rounded-lg text-sm">
                    <p className="font-semibold">Cow Total: ₹{totalCow}</p>
                    <p className="font-semibold">Buffalo Total: ₹{totalBuff}</p>
                    <p className="font-bold text-lg mt-2">
                        Grand Total: ₹{grandTotal}
                    </p>
                </div>

                {/* 🔥 RESET BUTTON */}
                <div className="flex justify-end px-4">
                    <button
                        className="mt-4 px-4 py-2 bg-red-500 text-white rounded shadow hover:bg-red-600"
                        onClick={handleReset}
                    >
                        Reset All
                    </button>
                </div>
            </div>
        </div>
    );
}
