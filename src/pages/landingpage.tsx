import { Header } from "../components/header"
import { motion } from "framer-motion"
import model1 from "../assets/pexels-godisable-jacob-226636-871495.jpg"
import model2 from "../assets/christopher-ott-WDwOvs7QHIk-unsplash.jpg"
import frame1 from "../assets/blocks-0R1ci4Rb9jU-unsplash.jpg"
import frame2 from "../assets/irene-kredenets-LaXCHG-yCJg-unsplash.jpg"
import model3 from "../assets/baptista-ime-james-1PGFkrYKhq0-unsplash.jpg"
import model4 from "../assets/divine-effiong-34DU08e7lto-unsplash.jpg"
import sunglasses from "../assets/giorgio-trovato-K62u25Jk6vo-unsplash.jpg"
import { useNavigate } from "react-router"
import { BsStars } from "react-icons/bs";
import { AiOutlineSafetyCertificate } from "react-icons/ai";
import { CiDeliveryTruck } from "react-icons/ci";
import { RiLoopRightFill } from "react-icons/ri";
import { TestimonialCard } from "../components/testimonialCard"
import { Footer } from "../components/footer"

export const Landingpage = () => {
  const navigate = useNavigate();
  const shopNavigation =()=>{
     navigate("/shoppage")
  }
  const testimonials = [
    {
    quote:
      '"Ive tried every eyewear brand. NeoVision is the only one that gets both the style and the optics right."',
    author: 'Sarah J.',
  },
  {
    quote:
     '“Ordered the Noir Classic and got compliments within the first hour of wearing them. Absolutely stunning.”',
    author: 'Marcus T.',
  },
  {
    quote:
      '"The 60-day return policy gave me the confidence to try something new. Ended up keeping them immediately.”',
    author: 'Elena R.',
  },
  {
    quote:
      '“The lens quality is unmatched. Anti-reflective coating actually works and the delivery was next-day.”',
    author: 'David L.',
  },
  {
    quote:
      '"Patient and collaborative. I never felt rushed."',
    author: 'Jordan M.',
  },
  {
    quote:
      '“Contact lenses arrived the next day, prescription perfect. NeoVision has earned a customer for life.”',
    author: 'Chloe W.',
  },
  {
    quote:
      '"Master of the craft. The shading and depth are phenomenal."',
    author: 'Anthony.',
  },
  ]
  return (
    <div className= "bg-white">
        <Header />

        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:1.5, ease:"easeIn"}} className="relative">
            <img src={model1} className=" w-full h-105 mt-21 rounded-4xl md:h-125 object-cover object-top p-3" alt="glasses model"/>
            {/*Dark overlay filter*/}
            <div className="absolute inset-2.5 bg-linear-to-t from-black/70 via-black/30 to-transparent rounded-4xl"></div>


               <div className="absolute inset-5 flex flex-col justify-center px-10 text-white">
                <p className="font-secondary text-5xl">See the world in <span className="font-secondary italic">Style.</span></p>

                <p className="font-body text-black text-2xl mt-15">Premium frames, contact lenses and sunglasses</p>
               <p className="font-body text-accent text-xl">crafted for those who see life as a statement.</p>

                <div className="hidden mt-5 md:flex flex-row gap-3.5">
                  <button className="bg-white text-black rounded-full py-3 px-6 font-body font-semibold hover:bg-white/60 transition-all duration-150 ease-in-out" onClick={shopNavigation}> Shop collection</button>
                  <button className="border border-white px-6 py-3 rounded-full font-body font-semibold hover:text-black hover:border-black transition-all duration-150 ease-in-out" onClick={shopNavigation}>View frames</button>
                </div>
               </div>
        </motion.div>

        <div className="mt-5">
            <h2 className="text-center text-gray-500 font-tertiary tracking-widest text-xs">THE COLLECTION</h2>
            <p className="text-center font-secondary text-4xl">Wear what <span className="font-secondary italic">you mean</span></p>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mt-4">

                {/* LEFT LARGE CARD */}
                <motion.div initial={{opacity:0}} whileInView={{opacity:1}} transition={{duration:1, ease:"easeIn"}} viewport={{ once: true, amount: 0.2 }} className="relative group p-6">
                  <img
                    src={model2}
                    alt="Frames collection"
                    className="w-full h-125 lg:h-full object-cover rounded-xl"
                  />
                <div className="absolute inset-6 bg-black/0 group-hover:bg-black/50 transition-all duration-300 rounded-md flex items-end justify-start p-6">
                    <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <p className="font-tertiary tracking-widest text-xs text-gray-400 font-bold mb-1">EDITORIAL PICK</p>
                      <div className="flex-col gap-4">
                        <p className="font-secondary text-xl">Frames Collection</p>
                        <p className="font-body text xs">100+ styles from Ksh.4000</p>
                      </div>
                    </div>
                  </div>                
            </motion.div>

                {/* RIGHT COLUMN */}
                <div className="grid grid-rows-2 gap-6 p-6">

                  {/* FRAMES */}
                  <motion.div initial={{opacity:0}} whileInView={{opacity:1}} transition={{duration:1, ease:"easeIn"}} viewport={{ once: true, amount: 0.2 }} className="relative group">
                    <motion.img
                      src={frame1}
                      alt="Frames"
                      className="w-full aspect-video object-cover rounded-2xl "
                    />
                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 rounded-md flex items-end justify-start p-6">
                          <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
      
                            <div className="flex-col gap-2">
                              <p className="font-secondary text-xl">Frames</p>
                              <p className="font-body text xs text-gray-300"> from  Ksh. 4000</p>
                            </div>
                          </div>
                       </div>      
                  </motion.div>

                  {/* SUNGLASSES */}
                  <motion.div initial={{opacity:0}} whileInView={{opacity:1}} transition={{duration:1, ease:"easeIn"}} viewport={{ once: true, amount: 0.2 }} className="relative group">
                    <img
                      src={frame2}
                      alt="Sunglasses"
                      className="w-full aspect-video object-cover rounded-2xl"
                    />

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 rounded-md flex items-end justify-start p-6">
                        <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <div className="flex-col gap-2">
                            <p className="font-secondary text-xl">Lense fitting</p>
                            <p className="font-body text xs text-gray-300">Under 45 minutes</p>
                          </div>
                        </div>
                    </div>      
                  </motion.div>

          </div>

       </div>
    </div>

    <div className="mt-5">
      <h2 className="text-center text-gray-500 font-tertiary tracking-widest text-xs">WHY NEOVISION</h2>
       <p className="text-center font-secondary text-4xl">Vision meets <span className="font-secondary italic">craft</span></p>

          <div className="grid grid-cols-1 lg:grid-cols-3 grid-rows-2 gap-3 p-10">
      
      <motion.div initial={{opacity:0, x:-40}} whileInView={{opacity:1,x:0}} transition={{duration:1.5, ease:"easeIn"}} viewport={{ once: true, amount: 0.2 }}className="relative group row-span-2 col-span-1 rounded-3xl text-white p-6">
        <img src={model3} alt="glass-model" className="w-full aspect-auto object-contain rounded-xl"/>
          
                    <div className="absolute inset-6 bg-linear-to-t from-black/70 via-black/30 to-transparent  rounded-xl flex items-end justify-start">
                        <div className="text-white p-4">
                          <div className="flex-col gap-2">
                            <p className="font-tertiary text-sm text-gray-400 tracking-widest mb-4">OUR PROMISE</p>
                            <p className="font-secondary text-lg mb-3">Every pair tells a story.</p>
                            <p className="font-tertiary text-xs text-gray-400 tracking-wide mb-4">From the first sketch to the final fitting, NeoVision frames are built to last a lifetime and look better every year.</p>
                          </div>
                        </div>
                    </div>      
        
        </motion.div>

      <div className="rounded-3xl bg-gray-100 p-8">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-black mb-4">
          <div className="absolute">
            <BsStars className="text-white text-xl" />
          </div>
        </div>
        <h3 className="font-secondary mb-3">Curated Designs</h3>
        <p className="font-body text-gray-600">Every frame is selected by our in-house stylists from ateliers across Italy, Japan and Denmark.</p>
        </div>

      <div className="rounded-3xl bg-gray-100 p-8">
         <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-black mb-4">
          <div className="absolute">
            <AiOutlineSafetyCertificate  className="text-white text-xl" />
          </div>
        </div>
        <h3 className="font-secondary mb-3">Precision Optics</h3>
        <p className="font-body text-gray-600">Anti-reflective, blue-light blocking, and scratch-resistant lenses as standard on every order.</p>
        </div>

      <div className="rounded-3xl bg-gray-100 p-8">
         <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-black mb-4">
          <div className="absolute">
            <CiDeliveryTruck className="text-white text-xl" />
          </div>
        </div>
        <h3 className="font-secondary mb-3">Free 48-hr Delivery</h3>
        <p className="font-body text-gray-600">Order before 2 PM and receive your frames the next business day — within Nairobi and Kiambu.</p>
        </div>

      <div className="rounded-3xl bg-gray-100 p-8">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-black mb-4">
          <div className="absolute">
            <RiLoopRightFill className="text-white text-xl" />
          </div>
        </div>
        <h3 className="font-secondary mb-3">60-Day Returns</h3>
        <p className="font-body text-gray-600">Not in love? Return or exchange within 60 days, no questions asked, fully prepaid.</p>
        </div>

      <div className="col-span-1 rounded-3xl bg-black text-white p-8 mt-6">
        <p className="font-tertiary text-xs text-gray-400 tracking-widest mb-2">BY THE NUMBERS</p>
        <p className="font-secondary text-xl">12,000+ <span className="font-tertiary text-xs text-gray-400 tracking-wider ml-3">CUSTOMER SERVED</span></p>
        <p className="font-secondary text-xl">4.9/5 <span className="font-tertiary text-xs text-gray-400 tracking-wider ml-3">CUSTOMER RATING</span></p>
        <p className="font-secondary text-xl">500+ <span className="font-tertiary text-xs text-gray-400 tracking-wider ml-3"> FRAME STYLES</span></p>
        </div>
    </div>

    </div>

    <div className="mt-5 overflow-hidden">
       <h3 className="text-center font-tertiary text-xs tracking-wider text-gray-500">CUSTOMER STORIES</h3>
       <p className=" text-center font-secondary text-4xl">Seen through <span className="font-secondary italic">their eyes</span></p>

           <div className="relative w-full overflow-hidden">

          {/* LEFT FADE */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-40 z-10"
            style={{
              background:
                "linear-gradient(to right, var(--background) 0%, var(--background) 20%, transparent 100%)",
            }}
        />

          {/* RIGHT FADE */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-40 z-10"
              style={{
                background:
                  "linear-gradient(to left, var(--background) 0%, var(--background) 20%, transparent 100%)",
              }}
          />

              <div className="flex gap-6 animate-marquee whitespace-nowrap relative z-0 backdrop-blur-[1px] m-5">
                {/* ORIGINAL */}
                {testimonials.map((t, i) => (
                  <TestimonialCard key={`a-${i}`} {...t} />
                ))}

                {/* DUPLICATE */}
                {testimonials.map((t, i) => (
                  <TestimonialCard key={`b-${i}`} {...t} />
                ))}
              </div>
            </div>
    </div>

    <div className="mt-10">
            <h2 className="text-center text-gray-500 font-tertiary tracking-widest text-xs">FIND YOUR MATCH</h2>
            <p className="text-center font-secondary text-4xl">Every Frame <span className="font-secondary italic">Every Vision</span></p>

           
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                 <motion.div initial={{opacity:0,x:-40}} whileInView={{opacity:1, x:0}} transition={{duration:1, ease:"easeIn"}} viewport={{ once: true, amount: 0.2 }} className="overflow-hidden rounded-2xl bg-black text-white shadow-lg">
                <div className="h-64 bg-white">
                  <img src={model4} alt="Sunglasses" className="h-75 w-full object-cover" />
                </div>
                <div className="p-8">
                  <p className="text-xs uppercase tracking-widest text-gray-400 mb-4 mt-10">Optical Frames</p>
                  <h2 className="text-3xl font-serif mb-4">Built for the Long View.</h2>
                  <p className="text-gray-400 mb-8">Prescription-ready. Titanium-light. Endlessly stylish.</p>
                  <button className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-black font-semibold hover:bg-gray-200 transition" onClick={shopNavigation}>
                    Shop Frames <span>→</span>
                  </button>
               </div> 
                </motion.div>
                

          <motion.div initial={{opacity:0, x:40}} whileInView={{opacity:1,x:0}} transition={{duration:1.5, ease:"easeIn"}} viewport={{ once: true, amount: 0.2 }} className="overflow-hidden rounded-2xl bg-white text-black shadow-lg">
            <div className="h-64">
              <img src={sunglasses} alt="Sunglasses" className="h-75 w-full object-cover" />
            </div>
            <div className="p-8">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-4 mt-10">Sunglasses</p>
              <h2 className="text-3xl font-serif mb-4">Block the Glare. Keep the Style.</h2>
              <p className="text-gray-500 mb-8">UV400 lenses. Polarised options. Zero compromise.</p>
              <button className="flex items-center gap-2 rounded-full bg-black px-6 py-3 text-white  font-semibold hover:bg-gray-800 transition" onClick={shopNavigation}>
                Shop Sunglasses <span>→</span>
              </button>
            </div>
          </motion.div>  
     
      </div>
    </div>

    <motion.div initial={{opacity:0, y:60}} whileInView={{opacity:1,y:0}} transition={{duration:1, ease:"easeIn"}} viewport={{ once: true, amount: 0.2 }} className="p-6">
      <div className="bg-black w-full rounded-2xl p-5 overflow-hidden px-5 h-84 shadow-lg">
        <div className="p-4 flex flex-col items-center justify-center gap-5">
          <p className="font-tertiary text-gray-500 tracking-widest text-xs mt-8">START HERE</p>
          <p className="font-secondary text-white text-4xl">Find Your Frame</p>
          <p className="font-body text-gray-400 text-wrap text-center">Browse 500+ styles across frames, contacts and sunglasses — with free 48-hour delivery on every order.</p>

          <button className="flex items-center gap-2 rounded-full bg-white text-black px-6 py-3 font-semibold mb-3  hover:bg-gray-300 transition" onClick={shopNavigation}>Shop the full collection <span>→</span></button>
        </div>
      </div>

    </motion.div>

    <div>
      <Footer />
    </div>
    </div>
  )
}
