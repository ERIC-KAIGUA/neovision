import { useAuth } from "../context/AuthContext";


export const UserAvatar = ({ size = "10"}: { size?: string}) => {

    const { user } = useAuth();

    if(!user) return null;

    const photoUrl = user.photoURL;
    const email = user.email || "";

    // Get initials from email
    const getInitials = () => {
        if(!email) return "U";

        const namePart = email.split("@")[0];

        //Take the first letter or first two if there's a dot
        const parts = namePart.split(/[.\-_]/).filter(Boolean);
        if(parts.length >=2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return namePart[0]?.toUpperCase() || "U";
    };
    
    const initials = getInitials();

    const sizeClasses = {
        "8": "w-8 h-8 text-sm",
        "10": "w-10 h-10 text-base",
        "12": "w-12 h-12 text-lg",
    }[size] || "w-10 h-10 text-base";
  return (
    <div className={`relative rounded-full overflow-hidden bg-surface-muted border-2 border-accent/30 flex items-center justify-center font-medium text-accent shadow-sm cursor-pointer transition-transform hover:scale-105 ${sizeClasses}`}>
     {photoUrl ? (
        <img
          src={photoUrl}
          alt="User profile"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e)=> {
            //fallback to initials if photo fails to load
            (e.target as HTMLImageElement).style.display = "none"
          }}></img>
     ) : null}

     <span className={photoUrl ? "hidden" : "block"}>{initials}</span>
    </div>
  )
}