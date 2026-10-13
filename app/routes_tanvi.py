"""Tanvi's module: auth, accounts, transactions, transfers, spending analytics."""
from datetime import date
from functools import wraps
from decimal import Decimal
from flask import (Blueprint, render_template, request, redirect, url_for,
                   session, flash, jsonify)
from werkzeug.security import generate_password_hash, check_password_hash
import mysql.connector
from db import query, execute, call_proc

bp = Blueprint("tanvi", __name__)

def login_required(f):
    @wraps(f)
    def wrapper(*a, **kw):
        if "user_id" not in session:
            return redirect(url_for("tanvi.login"))
        return f(*a, **kw)
    return wrapper

def db_error(e):
    """Show the SQL SIGNAL message (e.g. 'Insufficient balance') to the user."""
    flash(e.msg, "error")

def user_accounts(uid):
    return query("SELECT * FROM Account WHERE user_id=%s ORDER BY account_id", (uid,))

# ---------- auth ----------
@bp.route("/")
def home():
    return redirect(url_for("tanvi.accounts" if "user_id" in session else "tanvi.login"))

@bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        u = query("SELECT * FROM User WHERE email=%s", (request.form["email"],), one=True)
        if u and check_password_hash(u["password_hash"], request.form["password"]):
            session.update(user_id=u["user_id"], name=u["name"], role=u["role"])
            return redirect(url_for("tanvi.accounts"))
        flash("Invalid email or password", "error")
    return render_template("login.html")

@bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        try:
            execute("INSERT INTO User (name,email,password_hash,role) VALUES (%s,%s,%s,'user')",
                    (request.form["name"], request.form["email"],
                     generate_password_hash(request.form["password"])))
            flash("Account created, please log in", "ok")
            return redirect(url_for("tanvi.login"))
        except mysql.connector.Error as e:
            flash("Email already registered" if e.errno == 1062 else e.msg, "error")
    return render_template("register.html")

@bp.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("tanvi.login"))

# ---------- accounts ----------
@bp.route("/accounts", methods=["GET", "POST"])
@login_required
def accounts():
    uid = session["user_id"]
    if request.method == "POST":
        try:
            execute("INSERT INTO Account (user_id,account_name,account_type,balance) VALUES (%s,%s,%s,%s)",
                    (uid, request.form["account_name"], request.form["account_type"],
                     request.form.get("balance") or 0))
            flash("Account added", "ok")
        except mysql.connector.Error as e:
            db_error(e)
        return redirect(url_for("tanvi.accounts"))
    accts = user_accounts(uid)
    total = sum((a["balance"] for a in accts), Decimal(0))
    return render_template("accounts.html", accounts=accts, total=total)

# ---------- transactions ----------
@bp.route("/transactions", methods=["GET", "POST"])
@login_required
def transactions():
    uid = session["user_id"]
    if request.method == "POST":
        f = request.form
        acct = query("SELECT account_id FROM Account WHERE account_id=%s AND user_id=%s",
                     (f["account_id"], uid), one=True)
        if not acct:
            flash("Invalid account", "error")
        else:
            try:
                call_proc("sp_add_transaction", [
                    f["account_id"], f["category_id"], f.get("merchant_id") or None,
                    f["amount"], f["txn_type"], f["txn_date"],
                    f.get("description") or None, 0])
                flash("Transaction added", "ok")
            except mysql.connector.Error as e:
                db_error(e)
        return redirect(url_for("tanvi.transactions"))

    sql = "SELECT * FROM v_transaction_details WHERE user_id=%s"
    params = [uid]
    for col, key in (("account_id", "account"), ("category", "category")):
        if request.args.get(key):
            sql += f" AND {col}=%s"
            params.append(request.args[key])
    if request.args.get("month"):  # format YYYY-MM
        sql += " AND DATE_FORMAT(txn_date,'%%Y-%%m')=%s"
        params.append(request.args["month"])
    sql += " ORDER BY txn_date DESC, transaction_id DESC LIMIT 200"
    return render_template(
        "transactions.html",
        txns=query(sql, params),
        accounts=user_accounts(uid),
        categories=query("SELECT * FROM Category WHERE category_type<>'transfer' ORDER BY category_type, name"),
        merchants=query("SELECT * FROM Merchant ORDER BY name"),
        today=date.today().isoformat(), filters=request.args)

@bp.route("/transactions/<int:tid>/delete", methods=["POST"])
@login_required
def delete_transaction(tid):
    owned = query("SELECT 1 FROM v_transaction_details WHERE transaction_id=%s AND user_id=%s",
                  (tid, session["user_id"]), one=True)
    if owned:
        try:
            execute("DELETE FROM Transaction WHERE transaction_id=%s", (tid,))  # trigger reverses balance
            flash("Transaction deleted, balance restored", "ok")
        except mysql.connector.Error as e:
            db_error(e)
    return redirect(url_for("tanvi.transactions"))

# ---------- transfer ----------
@bp.route("/transfer", methods=["GET", "POST"])
@login_required
def transfer():
    uid = session["user_id"]
    accts = user_accounts(uid)
    if request.method == "POST":
        f = request.form
        mine = {str(a["account_id"]) for a in accts}
        if f["from_account"] not in mine or f["to_account"] not in mine:
            flash("You can only transfer between your own accounts", "error")
        else:
            try:
                call_proc("sp_transfer", [f["from_account"], f["to_account"], f["amount"],
                                          f["transfer_date"], f.get("description") or None])
                flash("Transfer complete", "ok")
            except mysql.connector.Error as e:
                db_error(e)  # transaction rolled back by the procedure
        return redirect(url_for("tanvi.transfer"))
    return render_template("transfer.html", accounts=accts, today=date.today().isoformat())

# ---------- analytics ----------
def num(rows):
    return [{k: float(v) if isinstance(v, Decimal) else v for k, v in r.items()} for r in rows]

@bp.route("/analytics")
@login_required
def analytics():
    uid = session["user_id"]
    ym = query("SELECT YEAR(CURDATE()) y, MONTH(CURDATE()) m", one=True)
    y = int(request.args.get("year", ym["y"])); m = int(request.args.get("month", ym["m"]))
    kpi = query("SELECT fn_monthly_spend(%s,NULL,%s,%s) AS spend, fn_savings_rate(%s,%s,%s) AS rate",
                (uid, y, m, uid, y, m), one=True)
    years = query("SELECT DISTINCT YEAR(txn_date) y FROM v_transaction_details WHERE user_id=%s ORDER BY y DESC", (uid,))
    return render_template("analytics.html", kpi=kpi, year=y, month=m, years=years)

@bp.route("/api/analytics/category")
@login_required
def api_category():
    return jsonify(num(query(
        "SELECT category, total_spent FROM v_spending_by_category WHERE user_id=%s AND yr=%s AND mo=%s ORDER BY total_spent DESC",
        (session["user_id"], request.args["year"], request.args["month"]))))

@bp.route("/api/analytics/merchant")
@login_required
def api_merchant():
    return jsonify(num(query(
        "SELECT merchant, total_spent FROM v_spending_by_merchant WHERE user_id=%s ORDER BY total_spent DESC LIMIT 8",
        (session["user_id"],))))

@bp.route("/api/analytics/monthly")
@login_required
def api_monthly():
    return jsonify(num(query(
        "SELECT CONCAT(yr,'-',LPAD(mo,2,'0')) AS ym, income, expense FROM v_monthly_summary WHERE user_id=%s ORDER BY yr, mo",
        (session["user_id"],))))
