import React from 'react'
import { useAuth } from '../context/AuthContext'
import FullPageLoader from '../components/fullPageLoader'
import { Navigate } from 'react-router-dom'

export const ProtectedAdminRoute = ({children}: { children: React.ReactNode}) => {
   
    const { user, role, loading } = useAuth();

    if (loading) return <FullPageLoader />

    if(!user || role !== "admin"){
        return <Navigate to="/" replace />;
    }

    return <>{children}</>
    
  
}
