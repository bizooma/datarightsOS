import React from 'react'
import ReactDOM from 'react-dom/client'
import { analytics } from '@heycatch/sdk'
import App from '@/App.jsx'
import '@/index.css'

analytics.init({
  projectKey: 'hck_pk_yyHEbzjZch9KOqIkpdjxpYfslt96gwzM',
  install: {
    framework: 'vite-react',
    frameworkVersion: '18',
    agent: 'base44',
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)