"""Maansi's module: budgets, subscriptions, goals, investments, dashboard."""
from datetime import date
import mysql.connector
from flask import (Blueprint, render_template, request, redirect, url_for,
                   session, flash)
from db import get_conn, query, execute
from routes_tanvi import login_required, user_accounts

bp = Blueprint("maansi", __name__)

ASSET_TYPES = ["STOCK", "MUTUAL_FUND", "CRYPTO", "FD", "GOLD", "OTHER"]


# ---------- helpers ----------
@bp.app_template_filter("inr")
def inr(v):
    try:
        return "₹{:,.2f}".format(float(v or 0))
    except (TypeError, ValueError):
        return v


def this_month():
    return date.today().strftime("%Y-%m")


def month_start(ym=None):
    """'YYYY-MM' (or nothing = this month) -> 'YYYY-MM-01'."""
    if ym and len(ym) == 7:
        return ym + "-01"
    return date.today().strftime("%Y-%m-01")


def act(sql, params, ok=None):
    """Run one write statement and flash the result (SQL SIGNAL messages are shown as-is)."""
    try:
        execute(sql, params)
        if ok:
            flash(ok, "ok")
    except mysql.connector.Error as e:
        flash("That record already exists" if e.errno == 1062 else e.msg, "error")


def proc_rows(name, args):
    """Call a stored procedure that SELECTs rows; returns them as a list of dicts."""
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.callproc(name, args)
        out = []
        for res in cur.stored_results():
            cols = [c[0] for c in res.description]
            out.extend(dict(zip(cols, row)) for row in res.fetchall())
        conn.commit()
        return out
    finally:
        conn.close()


def categories():
    return query("SELECT category_id, name FROM Category WHERE category_type<>'transfer' ORDER BY name")


# ---------- dashboard ----------
@bp.route("/dashboard")
@login_required
def dashboard():
    u, ms = session["user_id"], month_start()
    d = {
        "nw": query("SELECT cash_balance, investment_value, net_worth FROM vw_net_worth WHERE user_id=%s",
                    (u,), one=True) or {"cash_balance": 0, "investment_value": 0, "net_worth": 0},
        "budgets": query("SELECT category, limit_amount, spent, utilisation_pct FROM vw_budget_vs_actual "
                         "WHERE user_id=%s AND month_year=%s ORDER BY utilisation_pct DESC", (u, ms)),
        "upcoming": query("SELECT name, amount, billing_cycle, next_payment_date FROM vw_subscription_cost "
                          "WHERE user_id=%s ORDER BY next_payment_date LIMIT 5", (u,)),
        "sub_monthly": query("SELECT COALESCE(SUM(monthly_cost),0) AS t FROM vw_subscription_cost WHERE user_id=%s",
                             (u,), one=True)["t"],
        "goals": query("SELECT goal_id, goal_name, target_amount, current_amount, status, "
                       "fn_goal_progress(goal_id) AS progress_pct FROM Goal "
                       "WHERE user_id=%s AND status<>'CANCELLED' ORDER BY status, deadline", (u,)),
        "pf": query("SELECT COALESCE(SUM(quantity*buy_price),0) AS invested, "
                    "COALESCE(SUM(quantity*current_price),0) AS current_value FROM Investment WHERE user_id=%s",
                    (u,), one=True),
        "alerts": query("SELECT COUNT(*) AS n FROM Budget_Alert WHERE user_id=%s AND is_read=0", (u,), one=True)["n"],
    }
    d["pnl"] = d["pf"]["current_value"] - d["pf"]["invested"]
    return render_template("dashboard.html", d=d)


# ---------- budgets ----------
@bp.route("/budgets", methods=["GET", "POST"])
@login_required
def budgets():
    u = session["user_id"]
    if request.method == "POST":
        f = request.form
        act("INSERT INTO Budget (user_id,category_id,month_year,limit_amount) VALUES (%s,%s,%s,%s)",
            (u, f["category_id"], month_start(f.get("month")), f["limit_amount"]), "Budget added")
        return redirect(url_for("maansi.budgets", month=f.get("month", "")))
    month = request.args.get("month") or this_month()
    rows = proc_rows("sp_monthly_budget_report", [u, month_start(month)])   # stored procedure
    alerts = query("SELECT alert_id, message, created_at FROM Budget_Alert "
                   "WHERE user_id=%s AND is_read=0 ORDER BY alert_id DESC", (u,))
    return render_template("budgets.html", rows=rows, alerts=alerts, month=month, categories=categories())


@bp.route("/budgets/<int:bid>/limit", methods=["POST"])
@login_required
def budget_limit(bid):
    act("UPDATE Budget SET limit_amount=%s, alert_sent=0 WHERE budget_id=%s AND user_id=%s",
        (request.form["limit_amount"], bid, session["user_id"]), "Limit updated")
    return redirect(request.referrer or url_for("maansi.budgets"))


@bp.route("/budgets/<int:bid>/delete", methods=["POST"])
@login_required
def budget_delete(bid):
    act("DELETE FROM Budget WHERE budget_id=%s AND user_id=%s", (bid, session["user_id"]), "Budget deleted")
    return redirect(request.referrer or url_for("maansi.budgets"))


@bp.route("/alerts/<int:aid>/read", methods=["POST"])
@login_required
def alert_read(aid):
    act("UPDATE Budget_Alert SET is_read=1 WHERE alert_id=%s AND user_id=%s", (aid, session["user_id"]))
    return redirect(request.referrer or url_for("maansi.budgets"))


# ---------- subscriptions ----------
@bp.route("/subscriptions", methods=["GET", "POST"])
@login_required
def subscriptions():
    u = session["user_id"]
    accts = user_accounts(u)
    if request.method == "POST":
        f = request.form
        if f["account_id"] not in {str(a["account_id"]) for a in accts}:
            flash("Invalid account", "error")
        else:
            act("INSERT INTO Subscription (user_id,account_id,category_id,name,amount,billing_cycle,next_payment_date) "
                "VALUES (%s,%s,%s,%s,%s,%s,%s)",
                (u, f["account_id"], f.get("category_id") or None, f["name"], f["amount"],
                 f["billing_cycle"], f["next_payment_date"]), "Subscription added")
        return redirect(url_for("maansi.subscriptions"))
    subs = query("SELECT s.*, ROUND(CASE s.billing_cycle WHEN 'WEEKLY' THEN s.amount*52/12 "
                 "WHEN 'MONTHLY' THEN s.amount WHEN 'YEARLY' THEN s.amount/12 END, 2) AS monthly_cost "
                 "FROM Subscription s WHERE s.user_id=%s ORDER BY s.status, s.next_payment_date", (u,))
    summary = query("SELECT COUNT(*) AS n, COALESCE(SUM(monthly_cost),0) AS monthly, "
                    "COALESCE(SUM(yearly_cost),0) AS yearly FROM vw_subscription_cost WHERE user_id=%s",
                    (u,), one=True)
    return render_template("subscriptions.html", subs=subs, summary=summary, accounts=accts,
                           categories=categories(), today=date.today().isoformat())


@bp.route("/subscriptions/process", methods=["POST"])
@login_required
def subscriptions_process():
    try:
        r = proc_rows("sp_process_due_subscriptions", [session["user_id"]])[0]   # stored procedure
        flash(f"Processed {r['payments_processed']} payment(s); {r['subscriptions_failed']} failed.", "ok")
    except mysql.connector.Error as e:
        flash(e.msg, "error")
    return redirect(url_for("maansi.subscriptions"))


@bp.route("/subscriptions/<int:sid>/status", methods=["POST"])
@login_required
def subscription_status(sid):
    status = request.form["status"]
    if status in ("ACTIVE", "PAUSED", "CANCELLED"):
        act("UPDATE Subscription SET status=%s WHERE subscription_id=%s AND user_id=%s",
            (status, sid, session["user_id"]), "Subscription updated")
    return redirect(url_for("maansi.subscriptions"))


@bp.route("/subscriptions/<int:sid>/delete", methods=["POST"])
@login_required
def subscription_delete(sid):
    act("DELETE FROM Subscription WHERE subscription_id=%s AND user_id=%s", (sid, session["user_id"]),
        "Subscription deleted")
    return redirect(url_for("maansi.subscriptions"))


# ---------- goals ----------
@bp.route("/goals", methods=["GET", "POST"])
@login_required
def goals():
    u = session["user_id"]
    if request.method == "POST":
        f = request.form
        act("INSERT INTO Goal (user_id,goal_name,target_amount,current_amount,deadline) VALUES (%s,%s,%s,%s,%s)",
            (u, f["goal_name"], f["target_amount"], f.get("current_amount") or 0, f.get("deadline") or None),
            "Goal added")
        return redirect(url_for("maansi.goals"))
    rows = query("SELECT g.*, fn_goal_progress(g.goal_id) AS progress_pct FROM Goal g "
                 "WHERE g.user_id=%s ORDER BY g.status, g.deadline", (u,))                # SQL function
    return render_template("goals.html", goals=rows)


@bp.route("/goals/<int:gid>/contribute", methods=["POST"])
@login_required
def goal_contribute(gid):
    g = query("SELECT status FROM Goal WHERE goal_id=%s AND user_id=%s", (gid, session["user_id"]), one=True)
    if not g or g["status"] != "IN_PROGRESS":
        flash("This goal is not in progress", "error")
    else:
        # the trigger trg_goal_progress marks the goal COMPLETED once the target is reached
        act("UPDATE Goal SET current_amount=current_amount+%s WHERE goal_id=%s AND user_id=%s",
            (request.form["amount"], gid, session["user_id"]), "Money added to goal")
    return redirect(url_for("maansi.goals"))


@bp.route("/goals/<int:gid>/cancel", methods=["POST"])
@login_required
def goal_cancel(gid):
    act("UPDATE Goal SET status='CANCELLED' WHERE goal_id=%s AND user_id=%s AND status='IN_PROGRESS'",
        (gid, session["user_id"]), "Goal cancelled")
    return redirect(url_for("maansi.goals"))


@bp.route("/goals/<int:gid>/delete", methods=["POST"])
@login_required
def goal_delete(gid):
    act("DELETE FROM Goal WHERE goal_id=%s AND user_id=%s", (gid, session["user_id"]), "Goal deleted")
    return redirect(url_for("maansi.goals"))


# ---------- investments ----------
@bp.route("/investments", methods=["GET", "POST"])
@login_required
def investments():
    u = session["user_id"]
    if request.method == "POST":
        f = request.form
        act("INSERT INTO Investment (user_id,asset_name,asset_type,quantity,buy_price,current_price,purchase_date) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s)",
            (u, f["asset_name"], f["asset_type"], f["quantity"], f["buy_price"],
             f.get("current_price") or f["buy_price"], f["purchase_date"]), "Investment added")
        return redirect(url_for("maansi.investments"))
    rows = query("SELECT i.*, i.quantity*i.buy_price AS invested, i.quantity*i.current_price AS current_value, "
                 "fn_investment_pnl(i.investment_id) AS pnl, "
                 "ROUND(fn_investment_pnl(i.investment_id)/NULLIF(i.quantity*i.buy_price,0)*100,2) AS pnl_pct "
                 "FROM Investment i WHERE i.user_id=%s ORDER BY i.purchase_date DESC", (u,))   # SQL function
    summary = proc_rows("sp_portfolio_summary", [u])                                           # stored procedure
    total = next((s for s in summary if s["asset_type"] is None), None)
    by_type = [s for s in summary if s["asset_type"] is not None]
    return render_template("investments.html", rows=rows, total=total, by_type=by_type,
                           types=ASSET_TYPES, today=date.today().isoformat())


@bp.route("/investments/<int:iid>/price", methods=["POST"])
@login_required
def investment_price(iid):
    act("UPDATE Investment SET current_price=%s WHERE investment_id=%s AND user_id=%s",
        (request.form["current_price"], iid, session["user_id"]), "Price updated")
    return redirect(url_for("maansi.investments"))


@bp.route("/investments/<int:iid>/delete", methods=["POST"])
@login_required
def investment_delete(iid):
    act("DELETE FROM Investment WHERE investment_id=%s AND user_id=%s", (iid, session["user_id"]),
        "Investment deleted")
    return redirect(url_for("maansi.investments"))
