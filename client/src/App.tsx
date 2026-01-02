import React from 'react'
import { Routes,Route } from 'react-router'
import Home from './pages/Home'

export default function App() {
  return (
    <Routes>
      <Route element={<Home/>} path="/" />
    </Routes>
  )
}
