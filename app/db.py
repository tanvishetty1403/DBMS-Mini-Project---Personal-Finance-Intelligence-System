"""Thin MySQL helper. All business logic lives in SQL (triggers/procedures/functions)."""
import os
import mysql.connector

def get_conn():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "personal_finance"),
    )

def query(sql, params=(), one=False):
    conn = get_conn()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(sql, params)
        rows = cur.fetchall()
        return (rows[0] if rows else None) if one else rows
    finally:
        conn.close()

def execute(sql, params=()):
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(sql, params)
        conn.commit()
        return cur.lastrowid
    finally:
        conn.close()

def call_proc(name, args):
    """Call a stored procedure; returns the args tuple (OUT params filled in)."""
    conn = get_conn()
    try:
        cur = conn.cursor()
        result = cur.callproc(name, args)
        conn.commit()
        return result
    finally:
        conn.close()
