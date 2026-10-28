'use client';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export function CategoryChart({ data }) {
  return <Doughnut data={{ labels: data.map(d => d.category), datasets: [{ data: data.map(d => d.total_spent) }] }} />;
}
export function MerchantChart({ data }) {
  return <Bar data={{ labels: data.map(d => d.merchant), datasets: [{ label: '₹ spent', data: data.map(d => d.total_spent) }] }} />;
}
export function MonthlyChart({ data }) {
  return <Bar data={{ labels: data.map(d => d.ym), datasets: [
    { label: 'Income', data: data.map(d => d.income) }, { label: 'Expense', data: data.map(d => d.expense) }] }} />;
}
