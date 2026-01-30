import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Route, Routes } from 'react-router'
import Home from './Pages/Home'
import DefaultLayout from './Layouts/DefaultLayout'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<DefaultLayout />}>
          <Route path="/" element={<Home />} />
        </Route>
        {/* <Route element={<AuthLayout />}> */}
        {/*   <Route path="/dashboard" element={<AdminDashboard />} /> */}
        {/* </Route> */}
        {/* <Route element={<GuestLayout />}> */}
        {/*   <Route path="/login" element={<Login />} /> */}
        {/* </Route> */}
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
