import React, { useState, useEffect } from 'react'
import img1 from '../asset/img/cart.jpg'
import del from '../asset/img/delete.svg'
import edit from '../asset/img/edit.png'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/api.json'
function Dashboard() {
    const navigate = useNavigate();
    const [inputs, setInputs] = useState({ title: "", expense: "", type: "", date: "" });
    const [inputs1, setInputs1] = useState({ title: "", expense: "", type: "", date: "" });

    const [expenses, setExpenses] = useState([]);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const showdata = expenses.length > 0;

    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");

    const authHeaders = {
        "Content-Type": "application/json",
        "token": token || "",
    };

    async function safeJson(res) {
        try { return await res.json(); } catch { return null; }
    }

    async function requestWithFallbacks({ primary, fallbacks = [] }) {
        const attempts = [primary, ...fallbacks];
        let last = null;

        for (const req of attempts) {
            const res = await fetch(req.url, req.options);
            const data = await safeJson(res);
            last = { res, data, req };
            if (res.ok) return last;
        }
        return last; // return last attempt for debugging
    }

    async function fetchExpenses() {
        if (!email || !token) return;
        setLoading(true);
        setError("");
        try {
            const res = await fetch(api.baseurl + "record/get?email=" + encodeURIComponent(email), {
                headers: { token },
            });
            const data = await res.json();

            // Backend returns: { expenses: [...], count, success }
            const list =
                Array.isArray(data) ? data :
                (data?.expenses || data?.records || data?.data || []);

            setExpenses(Array.isArray(list) ? list : []);
        } catch (e) {
            setError("Failed to load expenses");
            console.log("Error ", e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchExpenses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshKey]);

    const handleChange = (event, which = "add") => {
        const name = event.target.name;
        const value = event.target.value;
        if (which === "edit") setInputs1(v => ({ ...v, [name]: value }));
        else setInputs(v => ({ ...v, [name]: value }));
    };

    const openModal1 = (expense) => {
        setSelectedExpense(expense);
        const modal1 = document.getElementById("myModal");
        if (modal1) modal1.style.display = "block";
    };

    const closeModal1 = () => {
        const modal1 = document.getElementById("myModal");
        if (modal1) modal1.style.display = "none";
        setSelectedExpense(null);
    };

    const openModal2 = (expense) => {
        setSelectedExpense(expense);
        // preload edit form with selected expense values
        setInputs1({
            title: expense?.title ?? "",
            expense: String(expense?.amount ?? expense?.expense ?? ""),
            type: expense?.type ?? "",
            date: (expense?.date ? String(expense.date).slice(0, 10) : ""),
        });

        const modal2 = document.getElementById("myModal2");
        if (modal2) modal2.style.display = "block";
    };

    const closeModal2 = () => {
        const modal2 = document.getElementById("myModal2");
        if (modal2) modal2.style.display = "none";
        setSelectedExpense(null);
    };

    const addExpense = async (event) => {
        event.preventDefault();
        setError("");

        if (!email || !token) {
            navigate("/"); // app has "/" not "/login"
            return;
        }

        const payload = {
            email,
            title: inputs.title,
            amount: Number(inputs.expense), // backend expects "amount"
            type: inputs.type,
            date: inputs.date,
        };

        try {
            const result = await requestWithFallbacks({
                primary: {
                    url: api.baseurl + "record/add",
                    options: { method: "POST", headers: authHeaders, body: JSON.stringify(payload) },
                },
                fallbacks: [
                    {
                        url: api.baseurl + "record/create",
                        options: { method: "POST", headers: authHeaders, body: JSON.stringify(payload) },
                    },
                ],
            });

            if (!result?.res?.ok) {
                console.log("Add expense failed:", result);
                setError(result?.data?.message || "Add expense failed");
                return;
            }

            setInputs({ title: "", expense: "", type: "", date: "" });
            setRefreshKey(k => k + 1);
        } catch (e) {
            console.log(e);
            setError("Add expense failed");
        }
    };

    const deleteExpense = async () => {
        setError("");
        if (!selectedExpense) return;

        const id = selectedExpense?._id || selectedExpense?.id;
        if (!id) {
            setError("Missing expense id");
            return;
        }

        try {
            const result = await requestWithFallbacks({
                primary: {
                    url: api.baseurl + "record/remove?id=" + encodeURIComponent(id), // correct backend route
                    options: { method: "DELETE", headers: { token } },
                },
                fallbacks: [
                    {
                        url: api.baseurl + "record/remove?id=" + encodeURIComponent(id),
                        options: { method: "DELETE", headers: { token } },
                    },
                    {
                        url: api.baseurl + "record/delete?id=" + encodeURIComponent(id),
                        options: { method: "DELETE", headers: { token } },
                    },
                ],
            });

            if (!result?.res?.ok) {
                console.log("Delete expense failed:", result);
                setError(result?.data?.message || "Delete expense failed");
                return;
            }

            closeModal1();
            setRefreshKey(k => k + 1);
        } catch (e) {
            console.log(e);
            setError("Delete expense failed");
        }
    };

    const editExpense = async (event) => {
        event.preventDefault();
        setError("");

        const id = selectedExpense?._id || selectedExpense?.id;
        if (!id) {
            setError("Missing expense id");
            return;
        }

        const payload = {
            id,
            email,
            title: inputs1.title,
            amount: Number(inputs1.expense), // backend expects "amount"
            type: inputs1.type,
            date: inputs1.date,
        };

        try {
            const result = await requestWithFallbacks({
                primary: {
                    url: api.baseurl + "record/update?id=" + encodeURIComponent(id),
                    options: { method: "PUT", headers: authHeaders, body: JSON.stringify(payload) },
                },
                fallbacks: [
                    {
                        url: api.baseurl + "record/update",
                        options: { method: "POST", headers: authHeaders, body: JSON.stringify(payload) },
                    },
                    {
                        url: api.baseurl + "record/edit?id=" + encodeURIComponent(id),
                        options: { method: "PUT", headers: authHeaders, body: JSON.stringify(payload) },
                    },
                ],
            });

            if (!result?.res?.ok) {
                console.log("Edit expense failed:", result);
                setError(result?.data?.message || "Edit expense failed");
                return;
            }

            closeModal2();
            setRefreshKey(k => k + 1);
        } catch (e) {
            console.log(e);
            setError("Edit expense failed");
        }
    };

    return (
        <div className='container'>
            {error ? <p style={{ color: "red" }}>{error}</p> : null}
            {loading ? <p>Loading...</p> : null}

            {showdata ?
                <div className='leftcontainer'>
                    <p>Total Expenses : 1000</p>

                    <div id="myModal" className="modal">
                        <div className="modal-content">
                            <p>Do you want to delete this expense?</p>
                            <button onClick={deleteExpense}>Yes</button>
                            <button onClick={closeModal1}>No</button>
                        </div>
                    </div>

                    <div id="myModal2" className="modal2">
                        <div className='formcard'>
                            <div>
                                <h2 style={{ alignSelf: 'center' }}>Edit Expense</h2>
                            </div>
                            <form onSubmit={editExpense}>
                                <div>
                                    <label>Title</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder='Enter your expense title'
                                        value={inputs1.title || ''}
                                        onChange={(e) => handleChange(e, "edit")}
                                        name='title'
                                    />
                                </div>
                                <div>
                                    <label>Amount</label>
                                    <input
                                        required
                                        type="number"
                                        placeholder='Enter your expense amount'
                                        value={inputs1.expense || ''}
                                        onChange={(e) => handleChange(e, "edit")}
                                        name='expense'
                                    />
                                </div>
                                <div>
                                    <label>Type</label>
                                    <select
                                        value={inputs1.type || ''}
                                        onChange={(e) => handleChange(e, "edit")}
                                        name='type'
                                        required
                                    >
                                        <option disabled value=''>Please Select Payment Type</option>
                                        <option value="cash">Cash</option>
                                        <option value="upi">UPI</option>
                                        <option value="card">Card</option>
                                    </select>
                                </div>
                                <div>
                                    <label>Date</label>
                                    <input
                                        required
                                        type="date"
                                        placeholder='Enter Date'
                                        value={inputs1.date || ''}
                                        onChange={(e) => handleChange(e, "edit")}
                                        name='date'
                                    />
                                </div>

                                <div>
                                    <button type="submit">Edit Expense</button>
                                </div>
                                <div>
                                    <button type="button" onClick={closeModal2}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div style={{ backgroundColor: 'lightgray', width: '100%', overflowY: 'scroll', marginBottom: '50px', justifyContent: 'center', justifyItems: 'center', padding: '20px' }}>
                        {expenses.map((exp, idx) => (
                            <div className='expenseCard' key={exp?._id || exp?.id || idx}>
                                <div style={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', justifyItems: 'center', alignContent: 'center', alignItems: 'center' }}>
                                    <img onClick={() => openModal2(exp)} style={{ width: '30px', height: '30px' }} src={edit} alt="edit" />
                                    <img onClick={() => openModal1(exp)} style={{ width: '20px', height: '20px', marginLeft: '4px' }} src={del} alt="delete" />
                                </div>
                                <p>{exp?.title ?? "Title"}</p>
                                <p>Amount {exp?.expense ?? exp?.amount ?? ""}</p>
                                <p>{exp?.date ? String(exp.date).slice(0, 10) : "Date"}</p>
                                <p>{exp?.type ?? "Type"}</p>
                            </div>
                        ))}
                    </div>
                </div>
                :
                <div className='leftcontainer'>
                    <p>Please add your expenses</p>
                    <img src={img1} alt="expenses" />
                </div>
            }

            <div className='rightcontainer'>
                <div className='formcard'>
                    <div>
                        <h2 style={{ alignSelf: 'center' }}>Add Expense</h2>
                    </div>
                    <form onSubmit={addExpense}>
                        <div>
                            <label>Title</label>
                            <input
                                required
                                type="text"
                                placeholder='Enter your expense title'
                                value={inputs.title || ''}
                                onChange={(e) => handleChange(e, "add")}
                                name='title'
                            />
                        </div>
                        <div>
                            <label>Amount</label>
                            <input
                                required
                                type="number"
                                placeholder='Enter your expense amount'
                                value={inputs.expense || ''}
                                onChange={(e) => handleChange(e, "add")}
                                name='expense'
                            />
                        </div>
                        <div>
                            <label>Type</label>
                            <select
                                value={inputs.type || ''}
                                onChange={(e) => handleChange(e, "add")}
                                name='type'
                                required
                            >
                                <option disabled value=''>Please Select Payment Type</option>
                                <option value="cash">Cash</option>
                                <option value="upi">UPI</option>
                                <option value="card">Card</option>
                            </select>
                        </div>
                        <div>
                            <label>Date</label>
                            <input
                                required
                                type="date"
                                placeholder='Enter Date'
                                value={inputs.date || ''}
                                onChange={(e) => handleChange(e, "add")}
                                name='date'
                            />
                        </div>

                        <div>
                            <button>Add</button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
