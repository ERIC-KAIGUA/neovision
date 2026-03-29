import { useAuth } from "../context/AuthContext";
import { UserAvatar } from "./userAvatar";


export const AdminHeader = () => {

  const { logout } = useAuth()

  return (
   <header className="fixed top-0 left-0 w-full z-50 bg-black/20 backdrop-blur-lg border-b border-white/10  ring-1 ring-white/5 shadow-lg shadow-black/40 rounded-b-2xl">
      <nav className=" relative md:mx-auto max-w-7xl px-6 py-4 flex items-center justify-between text-foreground">
        <div className="cursor-pointer">
         <p className="font-body text-2xl text-accent">Neo<span className="text-black">Vision</span></p> 
       </div>

     <div className="flex items-center gap-3 sm:gap-5">
     
        <>
           <div className="flex items-center gap-4">

         <div className="flex items-center gap-2 cursor-pointer group" onClick={() =>{
          if (window.confirm("Logout?")) logout();
         }}>
          <UserAvatar size="10"/>
          
         </div>

      </div> 

        </>   
      </div> 
      </nav>
    
    </header>
  ) 
 }

