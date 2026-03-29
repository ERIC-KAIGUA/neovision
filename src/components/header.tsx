import {  useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoCloseSharp } from "react-icons/io5";
import { AnimatePresence, motion } from "framer-motion"
import { useNavigate } from "react-router";
import { HiMiniShoppingCart } from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";
import { UserAvatar } from "./userAvatar";
import { useCart } from "../context/CartContext";



export const Header = () => {

    const [ sideNavOpen, setSideNavOpen] = useState(false)
    const navigate = useNavigate()
    const { signInWithGoogle } = useAuth();
    const { user, logout } = useAuth();
    const { cartCount } = useCart();
   
   

// Toggling sidenav on small screens
    const toggleSideNav = () => {
        setSideNavOpen(!sideNavOpen)
    }
     const shopNavigation = () =>{
        navigate("/shoppage")
     }
     const homeNavigation = () =>{
        navigate("/")
     }
     const cartNavigation = () => {
        navigate("/cart")
     }
     const ordersNavigation = () => {
        navigate("/orders")
     }  

  return (
   <header className="fixed top-0 left-0 w-full z-50 bg-black/20 backdrop-blur-lg border-b border-white/10  ring-1 ring-white/5 shadow-lg shadow-black/40 rounded-b-2xl">
      <nav className=" relative md:mx-auto max-w-7xl px-6 py-4 flex items-center justify-between text-foreground">
        <div className="cursor-pointer" onClick={homeNavigation}>
         <p className="font-body text-2xl text-accent">Neo<span className="text-black">Vision</span></p> 
       </div>

        <ul className=" hidden md:flex gap-6 absolute left-1/2 -translate-x-1/2">
          <li className="cursor-pointer text-ink-muted hover:text-black transition-all duration-150 font-body" onClick={homeNavigation}>Home</li>
          <li className="cursor-pointer text-ink-muted hover:text-black transition-all duration-150 font-body" onClick={shopNavigation}>Products</li>
          <li className="cursor-pointer text-ink-muted hover:text-black transition-all duration-150 font-body" onClick={ordersNavigation}>Order</li>
        </ul>
        
           
      

     <div className="flex items-center gap-3 sm:gap-5">

      <button onClick={cartNavigation} className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/20 transition-all duration-150" aria-label="View-cart">
                   <HiMiniShoppingCart size={24} className="text-ink" />
                      <AnimatePresence>
                      {cartCount > 0 && (
                       
                             <motion.span
                                key="badge"
                                initial={{scale:0, opacity:0}}
                                animate={{scale:1, opacity:1}}
                                exit={{scale:0, opacity:0}}
                                transition={{ type:"spring", stiffness: 500, damping: 25 }}
                                className="absolute -top-1 -right-1 min-w-4.5 flex items-center justify-center bg-accent text-white text-xs font-bold rounded-full px-1 shadow-sm"
                              >
                              {cartCount > 99 ? "99+" : cartCount}
                              </motion.span>
                         )}
                        </AnimatePresence>                   
                   </button>

      {user? (
         <>

         <button className="hidden md:inline-flex items-center justify-center rounded-xs px-6 py-3 text-white font-display bg-black transitionhover:brightness-105 active:scale-[0.98]
          "   onClick={shopNavigation}>
            Order Now
          </button>

          <div className="flex items-center gap-2 cursor-pointer group" onClick={()=>{
            if(window.confirm("Logout?")) logout();
          }}>
            <UserAvatar size="10"/>

          </div>
        
        </>
     

      ) : (

         <>

            <button className="hidden md:inline-flex items-center justify-center rounded-xs px-6 py-3 text-white font-display bg-black transitionhover:brightness-105 active:scale-[0.98]
          "   onClick={shopNavigation}>
            Order Now
          </button> 


            <button  onClick={async () => {
              try {
                await signInWithGoogle();
              } catch (error) {
                console.error("Error signing in with Google:", error);
              }
            }} className="inline-flex items-center justify-center rounded-xs px-6 py-3 text-white font-display bg-black  transitionhover:brightness-105 active:scale-[0.98]
          ">
              Sign In
          </button>

        
        
        </>

      )}
      
       
       
      
        

        <button className="md:hidden text-foreground hover:text-accent transition-all duration-150" onClick={toggleSideNav}>
          {sideNavOpen ?  <IoCloseSharp  className="text-3xl"/> : <GiHamburgerMenu className="text-3xl"/> }
        </button>
         <AnimatePresence>
        {sideNavOpen && (
            <motion.div className="md:hidden absolute top-full left-0 w-full bg-white rounded-md border-b border-white/10 shadow-lg shadow-black/40 px-6 py-4" initial={{opacity:0, y: -5}} animate={{opacity:1, y: 0}} transition={{duration:1, ease:"easeInOut"}} exit={{opacity:0, y:-5}}>
                 <ul className="flex flex-col gap-4">
                    <li className="cursor-pointer text-ink-muted hover:text-black transition-all duration-150 font-body" onClick={homeNavigation}>Home</li>
                    <li className="cursor-pointer text-ink-muted hover:text-black transition-all duration-150 font-body" onClick={shopNavigation}>Products</li>
                    <li className="cursor-pointer text-ink-muted hover:text-black transition-all duration-150 font-body" onClick={ordersNavigation}>Order</li>
                  </ul>

                    <button className="mt-4 w-full inline-flex items-center justify-center rounded-full px-6 py-3 text-white font-display bg-black  transitionhover:brightness-105 active:scale-[0.98]
                                      " onClick={shopNavigation}>
            Order Now
          </button>
            </motion.div>
        )}
        </AnimatePresence>
      </div> 
      </nav>
    
    </header>
  )
}
