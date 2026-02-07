const ExpenseModel = require('../models/Expenses');
const UserModel = require('../models/User');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const find = async (req, res) => {
    try {
        const email = req.query.email;
        const data = await ExpenseModel.find({ email: email });
        res.status(200).json({
            expenses: data,
            count: data.length,
            success: true
        });
    } catch (err) {
        console.log("Find ", err);
        res.status(500).json({ message: "Internal Server Error", success: false });
    }
}

const insert = async (req, res) => {
    try {
        // frontend might send "expense"; model requires "amount"
        const title = req.body.title;
        const amount = req.body.amount ?? req.body.expense;
        const type = req.body.type;
        const date = req.body.date;
        const email = req.body.email;

        if (amount === undefined || amount === null || Number.isNaN(Number(amount))) {
            return res.status(400).json({ message: "Amount is required", success: false });
        }

        const expenseModel = new ExpenseModel({
            title,
            amount: Number(amount),
            type,
            date,
            email
        });

        await expenseModel.save();
        res.status(201).json({ message: "Expense Saved successfully", success: true });
    } catch (err) {
        console.log("Insert ", err);
        res.status(500).json({ message: "Internal Server Error", success: false });
    }
}

const del = async (req, res) => {
    try {
        const id = req.query.id;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Valid expense id is required", success: false });
        }

        const deleted = await ExpenseModel.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: "Expense not found", success: false });
        }

        return res.status(200).json({ message: "Record Deleted", success: true });
    } catch (err) {
        console.log("Delete ", err);
        res.status(500).json({ message: "Internal Server Error", success: false });
    }
}

const modify = async (req, res) => {
    try {
        const id = req.query.id;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Valid expense id is required", success: false });
        }

        const title = req.body.title;
        const amount = req.body.amount ?? req.body.expense;
        const type = req.body.type;
        const date = req.body.date;

        if (amount === undefined || amount === null || Number.isNaN(Number(amount))) {
            return res.status(400).json({ message: "Amount is required", success: false });
        }

        const updated = await ExpenseModel.findByIdAndUpdate(
            id,
            { title: title, amount: Number(amount), type: type, date: date },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Expense not found", success: false });
        }

        res.status(200).json({ message: "Your Expense has been updated", success: true });
    } catch (err) {
        console.log("Update ", err);
        res.status(500).json({ message: "Internal Server Error", success: false });
    }
}

const reset = async (req, res) => {
    console.log("User1 ");
    try {
        const { oldpassword,password,email } = req.body;
        const pass = await bcrypt.hash(password, 10);

        const user = await UserModel.findOne({ email });
        console.log("User ", user);

        const oldpass = await bcrypt.compare(oldpassword, user.password);
        console.log("psw ", oldpass);
        if (oldpass == false) {
            return res.status(403)
                .json({
                    message: 'Please enter a valid old password',
                    success: false
                });

        }

        await UserModel.findOneAndUpdate({ email: email }, { password: pass }).then(() => {
            console.log('Password Updated')
            res.status(200).json({
                message: "Your password has been reset. Please login",
                success: true
            })
        }
        )
            .catch((err) => {
                console.log(err)
                res.status(500).json({
                    message: "Internal Server Error",
                    success: false
                })
            });

    }

    catch {
        res.status(500)
            .json({
                message: "Internal Server Error",
                success: false
            })

    }
  
}

module.exports = { find, insert, del, modify, reset }