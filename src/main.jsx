import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import TestEnv from './temp/envTest'

// Small startup checks (temporary) — prints masked env and runs a basic Supabase list.
TestEnv();

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
)